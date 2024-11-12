import * as fs from "node:fs";
import * as path from 'node:path';
import { $ } from 'npm:zx@^8';

export async function buildDist(entrypoint: string) {
  fs.rmSync('dist', { recursive: true, force: true });
  fs.mkdirSync('dist', { recursive: true });
  fs.writeFileSync(path.join('dist', 'app.ts'), `
import { app } from '../${entrypoint}';

await app.run();
`);
  const architectures = {
    x86_64: 'x86_64-unknown-linux-gnu',
    aarch64: 'aarch64-unknown-linux-gnu',
    aarch64_apple: 'aarch64-apple-darwin',
  };
  await Promise.all(Object.entries(architectures).map(async ([name, target]) => {
    return $`deno compile --allow-all --target ${target} -o ${path.join('dist', name)} ${path.join('dist', 'app.ts')}`;
  }));
  fs.rmSync(path.join('dist', 'app.ts'));
}
