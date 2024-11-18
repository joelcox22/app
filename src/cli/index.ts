#!/usr/bin/env -S deno run --allow-all

import { program } from './program.ts';

await program.parseAsync();
