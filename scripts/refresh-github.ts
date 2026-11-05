import { rename, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createGithubSnapshot, GITHUB_SOURCE } from '../src/lib/github';

export async function fetchPublicRepositories(fetcher: typeof fetch = fetch) {
  const repositories: unknown[] = [];
  // No Authorization header: this command can only query public user repositories.
  for (let page = 1; page <= 20; page++) {
    const response = await fetcher(`${GITHUB_SOURCE}&page=${page}`, {
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(15_000),
      redirect: 'error'
    });
    if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}; retry later (public API rate limits may apply).`);
    const batch: unknown = await response.json();
    if (!Array.isArray(batch)) throw new Error('Unexpected GitHub response.');
    repositories.push(...batch);
    if (batch.length < 100) return repositories;
  }
  throw new Error('Pagination limit reached; refusing to write incomplete data.');
}

export async function refreshGithubSnapshot(destination = new URL('../src/data/github.json', import.meta.url), fetcher: typeof fetch = fetch) {
  const raw = await fetchPublicRepositories(fetcher);
  const snapshot = createGithubSnapshot(raw, new Date().toISOString());
  // An empty response can be a transient anomaly: retain the last known good snapshot.
  if (!snapshot.repositories.length) throw new Error('No eligible public repositories returned; previous snapshot retained.');
  await mkdir(new URL('.', destination), { recursive: true });
  const temporary = new URL(`${destination.href}.${process.pid}.tmp`);
  try {
    await writeFile(temporary, JSON.stringify(snapshot, null, 2) + '\n', { flag: 'wx' });
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
  return snapshot;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const snapshot = await refreshGithubSnapshot();
    console.log(`Updated ${snapshot.repositories.length} public, non-fork, non-archived repositories at ${snapshot.fetchedAt}. Review the diff before committing.`);
  } catch (error) {
    console.error(`GitHub refresh failed. Existing snapshot unchanged. ${error instanceof Error ? error.message : 'Unknown error.'}`);
    process.exitCode = 1;
  }
}
