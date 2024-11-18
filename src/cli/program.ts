import { Command } from 'commander';
import { prep } from './prep.ts';
import { build } from './build.ts';
import { deploy } from './deploy.ts';
import { start } from './start.ts';

export const program = new Command('app');

program.addCommand(prep);
program.addCommand(build);
program.addCommand(deploy);
program.addCommand(start);

