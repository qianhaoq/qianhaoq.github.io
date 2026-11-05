import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createGithubSnapshot, isSnapshotStale, languageCounts, parseGithubSnapshot, pushRecencyCounts } from '../../src/lib/github';
import { loadGithubSnapshot } from '../../src/lib/github-data';
import { fetchPublicRepositories, refreshGithubSnapshot } from '../../scripts/refresh-github';

const time = '2026-11-05T12:00:00.000Z';
const rawRepo = (name = 'example', overrides = {}) => ({
  name, html_url: `https://github.com/qianhaoq/${name}`, private: false, visibility: 'public',
  owner: { login: 'qianhaoq' }, fork: false, archived: false,
  description: 'Public project', language: 'TypeScript', pushed_at: '2026-11-04T12:00:00Z', ...overrides
});
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });

describe('GitHub public snapshot boundary', () => {
  it('excludes forks, archived projects and the retired site, and drops unexpected fields', () => {
    const snapshot = createGithubSnapshot([
      rawRepo('project', { token: 'must-not-survive' }), rawRepo('fork', { fork: true }),
      rawRepo('archive', { archived: true }), rawRepo('qianhao-ai-site')
    ], time);
    expect(snapshot.repositories.map(repo => repo.name)).toEqual(['project']);
    expect(JSON.stringify(snapshot)).not.toContain('must-not-survive');
    expect(parseGithubSnapshot(snapshot)).toEqual(snapshot);
  });

  it.each([
    { private: true, visibility: 'private' }, { owner: { login: 'someone-else' } },
    { html_url: 'javascript:alert(1)' }, { pushed_at: 'invalid' }, { name: '../../file' }
  ])('rejects unexpected or nonpublic source data: %j', overrides => {
    expect(() => createGithubSnapshot([rawRepo('example', overrides)], time)).toThrow();
  });

  it('keeps all eligible repositories in both chart denominators, including unknown language/date', () => {
    const snapshot = createGithubSnapshot([
      rawRepo('recent'), rawRepo('week', { pushed_at: '2026-10-20T12:00:00Z', language: null }),
      rawRepo('old', { pushed_at: '2020-01-01T00:00:00Z' }), rawRepo('empty', { pushed_at: null })
    ], time);
    expect(languageCounts(snapshot.repositories)).toEqual([{ language: 'TypeScript', count: 3 }, { language: '未标注', count: 1 }]);
    expect(pushRecencyCounts(snapshot.repositories, time).map(row => row.count)).toEqual([1, 1, 1, 1]);
  });

  it('detects stale and future snapshots without interpreting an error as zero activity', () => {
    expect(isSnapshotStale(time, Date.parse(time) + 31 * 86_400_000)).toBe(true);
    expect(isSnapshotStale(time, Date.parse(time) + 30 * 86_400_000)).toBe(false);
    expect(isSnapshotStale(time, Date.parse(time) - 2 * 86_400_000)).toBe(true);
    expect(parseGithubSnapshot({ repositories: [] })).toBeNull();
  });

  it('loads missing or malformed data as unavailable', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'github-snapshot-')); directories.push(dir);
    const file = join(dir, 'github.json');
    expect(await loadGithubSnapshot(file)).toBeNull();
    await writeFile(file, '{invalid');
    expect(await loadGithubSnapshot(file)).toBeNull();
    await writeFile(file, JSON.stringify(createGithubSnapshot([rawRepo()], time)));
    expect((await loadGithubSnapshot(file))?.repositories).toHaveLength(1);
  });

  it('follows pagination without sending authorization', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(Array.from({ length: 100 }, (_, i) => rawRepo(`r${i}`)))))
      .mockResolvedValueOnce(new Response(JSON.stringify([rawRepo('last')])));
    expect(await fetchPublicRepositories(fetcher)).toHaveLength(101);
    expect(String(fetcher.mock.calls[1][0])).toContain('page=2');
    expect(fetcher.mock.calls[0][1]?.headers).not.toHaveProperty('Authorization');
  });

  it.each([new Response('rate limited', { status: 403 }), new Response('[]'), new Response('{}')])('retains the last good file on fetch failure, empty or invalid responses', async response => {
    const dir = await mkdtemp(join(tmpdir(), 'github-snapshot-')); directories.push(dir);
    const file = join(dir, 'github.json');
    await writeFile(file, 'last good snapshot');
    await expect(refreshGithubSnapshot(pathToFileURL(file), vi.fn<typeof fetch>().mockResolvedValue(response))).rejects.toThrow();
    expect(await readFile(file, 'utf8')).toBe('last good snapshot');
  });
});
