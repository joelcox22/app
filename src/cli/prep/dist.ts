import * as fs from "node:fs";
import * as path from 'node:path';
import { $ } from 'npm:zx@^8';
import { buildDockerfile } from "./dockerfile.ts";
import { buildStatic } from './static.ts';
import type { App } from '../../app.ts';

export async function buildDist(entrypoint: string, app: App): Promise<string> {
  fs.rmSync('dist', { recursive: true, force: true });
  fs.mkdirSync('dist', { recursive: true });
  fs.writeFileSync(path.join('dist', 'app.ts'), `
import { app } from '../${entrypoint}';

await app.run();
`);
  const architectures = {
    ['macOS/arm64']: 'aarch64-apple-darwin',
    ['linux/x86_64']: 'x86_64-unknown-linux-gnu',
    ['linux/arm64']: 'aarch64-unknown-linux-gnu',
  };
  await Promise.all([
    ...Object.entries(architectures).map(async ([name, target]) => {
      return $`deno compile --allow-all --target ${target} -o ${path.join('dist', name)} ${path.join('dist', 'app.ts')}`;
    }),
    buildDockerfile(),
    buildStatic(app),
  ]);
  fs.rmSync(path.join('dist', 'app.ts'));
  return 'fixme:publish-image-when-local-and-return-uri:or-empty-string-if-skipping-in-ci';
}
