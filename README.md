# simple app framework POC

Need a better name for this type of framework. Given this is just a POC to help
me explain some goals/plans to other people, I'm just keeping it simple and
calling it "app", scoped under @joelcox22 for now.

Simple example add the following into any `.ts` file you like - we'll use `example.ts`.

```typescript
import { App, Cron } from 'jsr:@joelcox22/app';

const app = new App();

const cron = new Cron('* * * * *', () => {
  console.log('this should run every minute');
});

app.register('cron', cron);
```

Then run the prepare step

```bash
npm run prep examples.ts
```

This will generate

- a `Dockerfile` with build instructions
- a `dist` directory with bundled application logic (this keeps the Dockerfile super clean and simple)
- a `chart` directory with a usable helm chart to deploy the app to kubernetes, with a sensible `values.yaml` for configuration options.

It is recommended you add all 3 of these to your `.gitignore` file.

What this package does not to, and you will need to do yourself

- provide a CI workflow for building / deploying your app
- provide any opinionated ways to build/manage kubernetes clusters to run the app.
- publish the app or helm chart to a docker registry
- populate the `image` value into `chart/values.yaml` from the build docker image

Basically this is just a POC to show what a good dev experience should start with in my opinion,
with some well handy gaps in what's in scope based on some stuff I'm doing at work where
we're missing scope and plans to do these things.

## Other features planned

- Simple http methods
- Queue processing
- Caching methods

See the examples directory for basic code samples. All of them are designed to be simple
and easy to use like the above cron example, and if you build an app following this pattern,
it will take the hard work out of configuring helm/kubernetes charts for your applications.

You get to focus on the business logic, and not need to worry about how that
translates to the kubernetes resources to support what you're trying to do.

## Other deployment pattern targets?

This same pattern could easily be extended to prepare a AWS CDK application and
to translate the features into relevant CDK constructs, however for simplicity
of this POC, at this stage I'm only focusing on Kubernetes.
