import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { App } from "../../app.ts";

export async function buildStatic(app: App) {
  await fs.mkdir(path.join('dist', 'static'), { recursive: true });
  await fs.writeFile(path.join('dist', 'static', 'app.json'), JSON.stringify({
    name: app.name,
    version: app.version,
  }, null, 2));
  const licenseExists = await fs.stat('LICENSE');
  if (licenseExists.isFile()) {
    await fs.copyFile('LICENSE', path.join('dist', 'static', 'LICENSE'));
  }
}
