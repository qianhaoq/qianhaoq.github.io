export function getPostSlugFromId(id: string) {
  return id.replace(/\.(md|mdx)$/i, '');
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function getReadingTime(body = '') {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const cjkChars = (body.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const minutes = Math.max(1, Math.ceil((words + cjkChars / 2) / 220));
  return `${minutes} 分钟`;
}

export function slugifyTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getAllTags<TPost extends { data: { tags: string[] } }>(posts: TPost[]) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count, slug: slugifyTag(tag) }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function groupPostsByYear<TPost extends { data: { pubDate: Date } }>(posts: TPost[]) {
  return posts.reduce<Record<string, TPost[]>>((groups, post) => {
    const year = String(post.data.pubDate.getFullYear());
    groups[year] ??= [];
    groups[year].push(post);
    return groups;
  }, {});
}
