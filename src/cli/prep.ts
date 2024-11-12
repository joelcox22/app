import { Command } from 'commander';
import * as util from './util.ts';
import { buildHelmChart } from "./build/chart.ts";
import { buildDockerfile } from "./build/dockerfile.ts";
import { buildDist } from './build/dist.ts';

export const prep = new Command('prep');

prep.description('Prepare code/artifacts for build & deployment');

prep.addArgument(util.entrypointArgument);

prep.action(async (entrypoint) => {
  const app = await util.loadApp(entrypoint);
  buildHelmChart(app, '');
  buildDockerfile(app);
  await buildDist(entrypoint);
});
