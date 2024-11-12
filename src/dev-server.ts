import { CronJob } from 'npm:cron@^3';
import { type App, Cron } from '../mod.ts';
import Debug from 'debug';

const debug = Debug('app:dev-server');

export class DevServer {
  constructor(public app: App) {
    debug('devServer created');
  }

  private cronJobs: CronJob[] = [];

  start() {
    debug('devServer starting. Features:', Object.keys(this.app.features));
    this.app.lock();
    const features = Object.entries(this.app.features);
    for (const [id, feature] of features) {
      if (feature instanceof Cron) {
        debug(`Registering cron job for ${id} with schedule ${feature.schedule}`);
        const cronJob = new CronJob(feature.schedule, async () => {
          await feature.handler();
        });
        this.cronJobs.push(cronJob);
        cronJob.start();
      }
    }
  }

  stop() {
    debug('devServer stopping');
    for (const cronJob of this.cronJobs) {
      cronJob.stop();
    }
    this.app.unlock();
  }
}