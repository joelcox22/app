import { Buffer } from "node:buffer";
import Debug from 'debug';
import { $ } from 'zx';

interface Change {
  path: string;
  contents: string;
  /**
   * @default '10644'
  */
  mode?: string;
}

interface Changeset {
  /**
   * @example 'octocat/Hello-World'
   */
  repository: string;
  /**
   * @default repo default branch
   */
  baseBranch?: string;
  branch: string;
  commitMessage: string;
  prTitle: string;
  changes: Change[];
  /**
   * Gets prefixed to path for all changes.
   * 
   * @default /
   */
  basePath?: string;
  /**
   * @default gets a token from from `gh` cli
   */
  token?: string;
  /**
   * @default 'https://api.github.com'
   */
  api?: string;
}

const debug = Debug('github');

export async function getGithubToken() {
  const token = (await $`gh auth token`).stdout.trim();
  debug('github token', token);
  if (!token) {
    throw new Error('No github token provided');
  }
  return token;
}

/**
 * Create a pull request with changes on GitHub, without cloning the repository locally.
 */
export async function createPR(changeset: Changeset) {
  const token = changeset.token ?? await getGithubToken();

  // Validate repository format
  if (!changeset.repository.match(/^[^/]+\/[^/]+$/)) {
    throw new Error(`Invalid repository: ${changeset.repository}`);
  }

  // Set API base URL
  const api = changeset.api ?? 'https://api.github.com';
  debug('github api base url:', api);

  // Check if the branch exists
  debug('checking if branch exists');
  const branchReq = await fetch(`${api}/repos/${changeset.repository}/git/refs/heads/${changeset.branch}`, {
    headers: {
      authorization: `token ${token}`,
    },
  });
  const branchRes = await branchReq.json();
  debug('get branch response', branchRes);

  // Determine the base branch
  let branch: string = '';
  if (changeset.baseBranch) {
    branch = changeset.baseBranch;
  } else {
    const defaultBranchReq = await fetch(`${api}/repos/${changeset.repository}`, {
      headers: {
        authorization: `token ${token}`,
      },
    });
    const defaultBranchRes = await defaultBranchReq.json();
    debug('default branch response', defaultBranchRes);
    branch = defaultBranchRes.default_branch;
  }

  // Get the parent commit SHA
  let parentCommitSha = '';
  if (branchReq.status === 200) {
    parentCommitSha = branchRes.object.sha;
  } else {
    debug(`fetching latest commit details from ${branch} branch`);
    const latestCommitReq = await fetch(`${api}/repos/${changeset.repository}/branches/${branch}`, {
      headers: {
        authorization: `token ${token}`,
      },
    });
    const latestCommitRes = await latestCommitReq.json();
    debug(`latest commit from ${branch} response`, latestCommitRes);
    parentCommitSha = latestCommitRes.commit.sha;
  }

  // Fetch parent commit details
  debug('fetching parent commit details');
  const parentCommitReq = await fetch(`${api}/repos/${changeset.repository}/git/commits/${parentCommitSha}`, {
    headers: {
      authorization: `token ${token}`,
    },
  });
  const parentCommitRes = await parentCommitReq.json();
  debug('parent commit response', parentCommitRes);
  const parentCommitTreeSha = parentCommitRes.tree.sha;
  if (!parentCommitSha) {
    throw new Error(`Could not find parent commit from ${changeset.branch} or ${branch} branch`);
  }

  // Create blobs for each change
  const tree = await Promise.all(changeset.changes.map(async (change) => {
    const path = `${changeset.basePath ?? ''}${change.path}`;
    debug('creating blob for', path);
    const blobReq = await fetch(`${api}/repos/${changeset.repository}/git/blobs`, {
      method: 'POST',
      headers: {
        authorization: `token ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        content: Buffer.from(change.contents).toString('base64'),
        encoding: 'base64',
      }),
    });
    const blob = await blobReq.json();
    debug(`blob response for ${path}`, blob);
    return {
      path,
      mode: change.mode ?? '100644',
      type: 'blob',
      sha: blob.sha,
    };
  }));

  // Fetch author details
  debug('fetching author details');
  const name = (await $`git config --get user.name`).stdout.trim() ?? 'fixme';
  const email = (await $`git config --get user.email`).stdout.trim() ?? 'fixme';
  debug('author details', { name, email });

  // Upload tree data
  debug('uploading tree data', tree);
  const treeReq = await fetch(`${api}/repos/${changeset.repository}/git/trees`, {
    method: 'POST',
    headers: {
      authorization: `token ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      base_tree: parentCommitTreeSha,
      tree,
    }),
  });
  const treeRes = await treeReq.json();
  debug('tree response', treeRes);

  // Create commit
  debug('creating commit');
  const commitReq = await fetch(`${api}/repos/${changeset.repository}/git/commits`, {
    method: 'POST',
    headers: {
      authorization: `token ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      message: changeset.commitMessage,
      tree: treeRes.sha,
      parents: [parentCommitSha],
      author: { name, email },
    }),
  });
  const commitRes = await commitReq.json();
  debug('commit response', commitRes);

  // Create or update branch
  if (branchRes.message === 'Not Found') {
    debug('creating branch');
    const branchCreateReq = await fetch(`${api}/repos/${changeset.repository}/git/refs`, {
      method: 'POST',
      headers: {
        authorization: `token ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        ref: `refs/heads/${changeset.branch}`,
        sha: commitRes.sha,
      }),
    });
    const branchCreateRes = await branchCreateReq.json();
    debug('branch create response', branchCreateRes);
  } else {
    debug('updating branch');
    const updateReq = await fetch(`${api}/repos/${changeset.repository}/git/refs/heads/${changeset.branch}`, {
      method: 'PATCH',
      headers: {
        authorization: `token ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sha: commitRes.sha,
      }),
    });
    const updateRes = await updateReq.json();
    debug('update branch response', updateRes);
  }

  // check if PR already exists
  debug('checking if PR already exists');
  const prCheckReq = await fetch(`${api}/repos/${changeset.repository}/pulls?head=${branch}`, {
    headers: {
      authorization: `token ${token}`,
    },
  });
  const prCheckRes = await prCheckReq.json();
  debug('pr check response', prCheckRes);
  if (prCheckRes.length) {
    return {
      commit: commitRes,
      pr: prCheckRes[0],
    };
  }

  // Create pull request
  debug('creating pull request');
  const prReq = await fetch(`${api}/repos/${changeset.repository}/pulls`, {
    method: 'POST',
    headers: {
      authorization: `token ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      title: changeset.prTitle,
      head: changeset.branch,
      base: branch,
    }),
  });
  const prRes = await prReq.json();
  debug('create pr response', prRes);

  return {
    commit: commitRes,
    pr: prRes,
  };
}
