
export class Cron {
  constructor(public schedule: string, public handler: () => Promise<void>) {}
}