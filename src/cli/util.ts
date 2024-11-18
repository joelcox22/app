import { Argument } from "commander";
import * as fs from 'node:fs';
import * as process from 'node:process';
import * as path from 'node:path';
import { App } from '../app.ts';
import { customAlphabet } from "nanoid";

export { getGithubToken } from '../util/github.ts';

export const entrypointArgument = new Argument("<entrypoint>", "entrypoint file");

export async function loadApp(entrypoint: string): Promise<App> {
  if (!fs.existsSync(entrypoint)) {
    throw new Error(`Entry point file ${entrypoint} does not exist.`);
  }
  const fullPath = path.join(process.cwd(), entrypoint);
  const { app } = await import(fullPath);
  if (!(app instanceof App)) {
    throw new Error('Entry point does not export an instance of App');
  }
  return app;
}

export const nanoid = customAlphabet('1234567890abcdef', 10);