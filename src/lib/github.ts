export const GITHUB_ACCOUNT = 'qianhaoq';
export const GITHUB_SOURCE = `https://api.github.com/users/${GITHUB_ACCOUNT}/repos?type=owner&per_page=100&sort=full_name`;
export const RETIRED_REPOSITORIES = ['qianhao-ai-site'];
export const SNAPSHOT_MAX_AGE_DAYS = 30;

export interface PublicRepository {
  name: string;
  url: string;
  description: string | null;
  primaryLanguage: string | null;
  pushedAt: string | null;
}

export interface GithubSnapshot {
  schemaVersion: 1;
  account: typeof GITHUB_ACCOUNT;
  fetchedAt: string;
  source: typeof GITHUB_SOURCE;
  scope: 'public-owned-nonfork-nonarchived';
  repositories: PublicRepository[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
const isNullableText = (value: unknown): value is string | null => value === null || typeof value === 'string';
const isName = (value: unknown): value is string => typeof value === 'string' && /^[\w.-]+$/.test(value);
const repoUrl = (name: string) => `https://github.com/${GITHUB_ACCOUNT}/${name}`;

// Only an allowlist of public metadata survives. Never persist raw API responses.
export function createGithubSnapshot(raw: unknown[], fetchedAt: string): GithubSnapshot {
  if (!isDate(fetchedAt)) throw new Error('Invalid snapshot time.');
  const seen = new Set<string>();
  const repositories: PublicRepository[] = [];
  for (const item of raw) {
    if (!isRecord(item) || item.private !== false || item.visibility !== 'public' ||
      !isRecord(item.owner) || item.owner.login !== GITHUB_ACCOUNT || !isName(item.name) ||
      item.html_url !== repoUrl(item.name) || typeof item.fork !== 'boolean' || typeof item.archived !== 'boolean' ||
      !isNullableText(item.description) || !isNullableText(item.language) ||
      !(item.pushed_at === null || isDate(item.pushed_at))) {
      throw new Error('Unexpected public repository response; previous snapshot retained.');
    }
    if (seen.has(item.name)) throw new Error('Duplicate repository; pagination may have changed. Retry the refresh.');
    seen.add(item.name);
    if (item.fork || item.archived || RETIRED_REPOSITORIES.includes(item.name)) continue;
    repositories.push({
      name: item.name,
      url: repoUrl(item.name),
      description: item.description,
      primaryLanguage: item.language,
      pushedAt: item.pushed_at
    });
  }
  return {
    schemaVersion: 1,
    account: GITHUB_ACCOUNT,
    fetchedAt,
    source: GITHUB_SOURCE,
    scope: 'public-owned-nonfork-nonarchived',
    repositories: repositories.sort((a, b) => a.name.localeCompare(b.name, 'en'))
  };
}

export function parseGithubSnapshot(value: unknown): GithubSnapshot | null {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.account !== GITHUB_ACCOUNT ||
    value.source !== GITHUB_SOURCE || value.scope !== 'public-owned-nonfork-nonarchived' ||
    !isDate(value.fetchedAt) || !Array.isArray(value.repositories)) return null;
  // Reuse the API validator to check URLs, names and dates, and discard unknown fields.
  try {
    return createGithubSnapshot(value.repositories.map((repo: unknown) => {
      if (!isRecord(repo)) throw new Error('Invalid repository.');
      if (RETIRED_REPOSITORIES.includes(String(repo.name))) throw new Error('Retired repository.');
      return {
        name: repo.name, html_url: repo.url, description: repo.description,
        language: repo.primaryLanguage, pushed_at: repo.pushedAt,
        private: false, visibility: 'public', owner: { login: GITHUB_ACCOUNT }, fork: false, archived: false
      };
    }), value.fetchedAt);
  } catch {
    return null;
  }
}

export function isSnapshotStale(fetchedAt: string, now = Date.now()): boolean {
  const age = now - Date.parse(fetchedAt);
  return !Number.isFinite(age) || age < -86_400_000 || age > SNAPSHOT_MAX_AGE_DAYS * 86_400_000;
}

export function languageCounts(repositories: PublicRepository[]) {
  const counts = new Map<string, number>();
  for (const repo of repositories) {
    const language = repo.primaryLanguage || '未标注';
    counts.set(language, (counts.get(language) ?? 0) + 1);
  }
  return [...counts].map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language, 'en'));
}

// Buckets describe one latest-push timestamp per repository, not events or contributions.
export function pushRecencyCounts(repositories: PublicRepository[], fetchedAt: string) {
  const buckets = [
    { label: '7 天以内', count: 0 },
    { label: '8–30 天', count: 0 },
    { label: '超过 30 天', count: 0 },
    { label: '无推送日期', count: 0 }
  ];
  for (const repo of repositories) {
    const age = repo.pushedAt ? Date.parse(fetchedAt) - Date.parse(repo.pushedAt) : NaN;
    const index = !Number.isFinite(age) || age < 0 ? 3 : age <= 7 * 86_400_000 ? 0 : age <= 30 * 86_400_000 ? 1 : 2;
    buckets[index].count++;
  }
  return buckets;
}

export const SELECTED_PROJECTS = [
  { name: 'qh-dsh-weixin', title: 'DSH 微信插件', category: 'Agent 接入', summary: '通过微信向本机 DeepSeek Harness 发送任务，并接收回复。' },
  { name: 'kilocean-translate', title: '千浩翻译', category: '浏览器工具', summary: '渐进式网页翻译与双语对照，支持新加载内容和划词翻译。' },
  { name: 'dota2.ai', title: 'Dota2.ai', category: '产品实验', summary: '围绕比赛事实、选择代价和下一局练习的 Dota 2 战术教练。' },
  { name: 'qh-dsh-dota-coach', title: 'DSH Dota Coach', category: 'Agent 应用', summary: '基于证据复盘比赛，保存一个训练目标，并在下一局回看。' },
  { name: 'qh-personal-agent', title: '个人语音助手', category: '个人工具', summary: '把语音整理成笔记、待办和提醒，并用语音问答自己的记忆。' },
  { name: 'ai-devflow-weekly', title: 'AI DevFlow Weekly', category: '工程资讯', summary: '聚合官方更新，整理中文 AI 研发工作流资讯与周刊。' }
] as const;
