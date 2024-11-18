import { Command } from "commander";
import * as util from './util.ts';

export const deploy = new Command('deploy');

deploy.description('Deploy the application');

deploy.addArgument(util.entrypointArgument);

deploy.action(async (entrypoint) => {
  console.log('todo: deployment');
});
