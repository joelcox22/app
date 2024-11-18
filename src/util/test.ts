/*

// commented out to ensure avoid accidentally executing this
// uncomment and run deno src/util/test.ts to test the createPR function

import { createPR } from "./github.ts";

await createPR({
  repository: 'joelcox22/test-api-changes',
  commitMessage: 'test commit ' + new Date().toISOString(),
  changes: [
    {
      path: 'test3.txt',
      contents: 'followup change to a different file',
    },
  ],
  branch: 'test2',
  prTitle: 'test pr ' + new Date().toISOString,
});
*/
