import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function buildDockerfile() {
  await fs.writeFile(path.join('dist', 'Dockerfile'), `
FROM debian:12-slim

ARG TARGETPLATFORM

WORKDIR /app
COPY $TARGETPLATFORM ./app
COPY static ./

ENTRYPOINT ["./app"]
`);
}
