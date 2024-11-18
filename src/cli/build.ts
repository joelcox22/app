import { Command } from 'commander';
import { $, cd, within } from 'zx';
import { stringify, parse } from 'jsr:@std/yaml@1';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as util from './util.ts';
import { prep } from './prep.ts';

export const build = new Command('build');

build.description('Prep and Build the application');

build.addArgument(util.entrypointArgument);

build.action(async (entrypoint) => {
  await prep.parseAsync(['', '', entrypoint]);
  const githubToken = await util.getGithubToken();

  $.verbose = true;

  const registry = 'ghcr.io';
  const username = 'joelcox22';
  const repository = `${username}/app`;
  const tag = util.nanoid();
  const image = `${registry}/${repository}:${tag}`;

  // gh auth login --scopes write:packages 
  await $`echo ${githubToken} | docker login ${registry} -u ${username} --password-stdin`;
  await $`echo ${githubToken} | helm registry login ${registry}/${repository} --username ${username} --password-stdin`;

  // build and push image
  await $`docker buildx build -t ${image} dist/ --push`;

  // update chart with image
  const valuesPath = path.join('chart', 'values.yaml');
  const values = parse(await fs.readFile(valuesPath, 'utf8')) as Record<string, any>;
  values.image = image;
  await fs.writeFile(valuesPath, stringify(values));

  const chartPath = path.join('chart', 'Chart.yaml');
  const chart = parse(await fs.readFile(chartPath, 'utf8')) as Record<string, any>;
  chart.version += `-${tag}`;
  await fs.writeFile(chartPath, stringify(chart));

  // publish helm chart to registry
  await $`helm package chart -d chart/`;
  await $`helm push chart/${chart.name}-${chart.version}.tgz oci://${registry}/${repository}`;

  // construct a new chart for deployment
  const deployChartDir = path.join('dist', 'deploy-chart');
  await fs.mkdir(deployChartDir, { recursive: true });
  within(async () => {
    cd(deployChartDir);
    await fs.writeFile('Chart.yaml', stringify({
      apiVersion: 'v2',
      name: chart.name,
      version: chart.version,
      dependencies: [
        {
          name: chart.name,
          version: chart.version,
          repository: `oci://${registry}/${repository}`
        }
      ]
    }));
    $`helm dependency build`;
  });
});
