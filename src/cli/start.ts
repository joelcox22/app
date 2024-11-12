import { Command } from 'commander';
import { DevServer } from "../dev-server.ts";
import * as util from "./util.ts";

export const start = new Command('start');

start.addArgument(util.entrypointArgument);

start.action(async (entrypoint) => {
  const app = await util.loadApp(entrypoint);
  const devServer = new DevServer(app);
  devServer.start();
});
