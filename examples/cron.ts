import { App, Cron } from "app";

export const app = new App();

app.register("testCron", new Cron("*/10 * * * * *", async () => {
  console.log("This will run every 10 seconds", new Date().toISOString());
}));

app.register('otherCron', new Cron('* * * * *', async () => {
  console.log('this will run every minute');
}));
