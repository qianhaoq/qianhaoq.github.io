import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseGithubSnapshot } from './github';

// Build-time only. A missing or invalid snapshot must not take the blog offline.
export async function loadGithubSnapshot(snapshotPath = resolve('src/data/github.json')) {
  try {
    return parseGithubSnapshot(JSON.parse(await readFile(snapshotPath, 'utf8')));
  } catch {
    return null;
  }
}
