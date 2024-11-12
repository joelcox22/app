import * as fs from 'node:fs';
import * as path from 'node:path';
import type { App } from '../../app.ts';
import { Cron } from '../../cron.ts';
import { stringify } from 'jsr:@std/yaml@^1';

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

export function buildHelmChart(app: App, image: string) {
  const values: Record<string, any> = {
    image,
    imagePullPolicy: 'ifNotPresent',
    appName: app.name,
    appVersion: app.version,
  };

  fs.rmSync('chart', { recursive: true, force: true });
  fs.mkdirSync(path.join('chart', 'templates'), { recursive: true });
  fs.writeFileSync(path.join('chart', 'Chart.yaml'), stringify({
    apiVersion: 'v2',
    name: app.name,
    version: app.version,
  }));

  const features = Object.entries(app.features);
  for (const [id, feature] of features) {
    if (feature instanceof Cron) {
      fs.writeFileSync(path.join('chart', 'templates', `${id}.yaml`), cronTemplate(id));
      values[id] = {
        enabled: true,
        schedule: feature.schedule,
      };
    }
  }

  fs.writeFileSync(path.join('chart', 'values.yaml'), stringify(values));
}
