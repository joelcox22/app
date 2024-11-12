import * as fs from 'node:fs';

export function buildDockerfile() {
  fs.writeFileSync('Dockerfile', `
FROM scratch

ARG TARGETPLATFORM

WORKDIR /app
ADD dist/$TARGETPLATFORM app

CMD ["./app"]
`);
}
