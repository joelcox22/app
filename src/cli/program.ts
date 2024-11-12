import { Command } from 'commander';
import { prep } from './prep.ts';
import { start } from './start.ts';

const program = new Command('app');

program.addCommand(prep);
program.addCommand(start);

await program.parseAsync();
