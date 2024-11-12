import * as process from 'node:process';
import * as fs from 'node:fs';
import { Cron } from './cron.ts';
import Debug from 'npm:debug@^4';

const debug = Debug('app');

type Feature = Cron;

interface AppProps {
  /**
   * @default auto-detect this from your package.json / deno.json, or read from `APP_NAME` environment variable
   */
  name?: string;

  /**
   * @default auto-detect this from your package.json / deno.json, or read from APP_VERSION environment variable
   */
  version?: string;
}

export class App {

  public name: string = '';
  public version: string = '';

  constructor(public props: AppProps = {}) {
    // todo: optimize this to only read package/deno.json once
    if (props.name) {
      this.name = props.name;
    } else if (fs.existsSync('package.json')) {
      this.name = JSON.parse(fs.readFileSync('package.json', 'utf8')).name;
    } else if (fs.existsSync('deno.json')) {
      this.name = JSON.parse(fs.readFileSync('deno.json', 'utf8')).name;
    } else if (process.env.APP_NAME) {
      this.name = process.env.APP_NAME;
    }
    if (props.version) {
      this.version = props.version;
    } else if (fs.existsSync('package.json')) {
      this.version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
    } else if (fs.existsSync('deno.json')) {
      this.version = JSON.parse(fs.readFileSync('deno.json', 'utf8')).version;
    } else if (process.env.APP_VERSION) {
      this.version = process.env.APP_VERSION;
    }
    if (this.name === '') {
      throw new Error('Unable to app name from package.json or deno.json, and it was not provided.');
    }
    if (this.version === '') {
      throw new Error('Unable to app version from package.json or deno.json, and it was not provided.');
    }
    debug('App created with name %s and version %s', this.name, this.version);
  }

  private locked = false;
  features: Record<string, Feature> = {};

  register(id: string, feature: Feature) {
    if (this.locked) {
      throw new Error('Cannot register features after app is locked.');
    }
    if (this.features[id]) {
      throw new Error(`Feature with id ${id} already exists.`);
    }
    this.features[id] = feature;
  }

  lock() {
    this.locked = true;
  }

  unlock() {
    this.locked = false;
  }

  /**
   * @internal
   */
  async run() {
    this.lock();
    if (process.env.APP_FEATURE_ID) {
      // if we have a feature id specified then we only
      // need to execute some specific things, not everything
      for (const [id, feature] of Object.entries(this.features)) {
        if (process.env.APP_FEATURE_ID === id && feature instanceof Cron) {
          await feature.handler();
        }
      }
    } else {
      // if we don't have a feature id, then we start all http routes
      console.log('todo: start server');
      process.exit(1);
    }
  }
}
