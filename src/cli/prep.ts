import { Command } from 'commander';
import * as util from './util.ts';
import { buildHelmChart } from "./prep/chart.ts";
import { buildDist } from './prep/dist.ts';

export const prep = new Command('prep');

prep.description('Prepare code/artifacts for build & deployment');

prep.addArgument(util.entrypointArgument);

prep.action(async (entrypoint) => {
  const app = await util.loadApp(entrypoint);
  const image = await buildDist(entrypoint, app);
  await buildHelmChart(app, image);
});
