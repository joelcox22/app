import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { stringify } from 'jsr:@std/yaml@1';
import type { App } from '../../app.ts';
import { Cron } from '../../cron.ts';

// https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/
const cronTemplate = (id: string) => `
{{ if .Values.${id}.enabled }}
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${id}
spec:
  schedule: '{{ .Values.testCron.schedule }}'
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: ${id}
              image: '{{ .Values.image }}'
              imagePullPolicy: '{{ .Values.imagePullPolicy }}'
              env:
              - name: APP_NAME
                value: {{ .Values.appName }}
              - name: APP_VERSION
                value: {{ .Values.appVersion }}
              - name: APP_FEATURE_ID
                value: ${id}
{{ end }}
`;

export async function buildHelmChart(app: App, image: string) {
  const values: Record<string, any> = {
    image,
    imagePullPolicy: 'ifNotPresent',
    appName: app.name,
    appVersion: app.version,
  };

  await fs.rm('chart', { recursive: true, force: true });
  await fs.mkdir(path.join('chart', 'templates'), { recursive: true });
  await fs.writeFile(path.join('chart', 'Chart.yaml'), stringify({
    apiVersion: 'v2',
    name: app.name.replace(/^@[^/]+\//, ''),
    version: app.version,
  }));

  const features = Object.entries(app.features);
  for (const [id, feature] of features) {
    if (feature instanceof Cron) {
      await fs.writeFile(path.join('chart', 'templates', `${id}.yaml`), cronTemplate(id));
      values[id] = {
        enabled: true,
        schedule: feature.schedule,
      };
    }
  }

  await fs.writeFile(path.join('chart', 'values.yaml'), stringify(values));
}
