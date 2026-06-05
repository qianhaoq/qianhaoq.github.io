import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export async function getPublishedPosts() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function getPostSlug(post: Post) {
  return post.id.replace(/\.(md|mdx)$/i, '');
}

export function getPostUrl(post: Post) {
  return `/posts/${getPostSlug(post)}/`;
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

export function getAllTags(posts: Post[]) {
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

export function groupPostsByYear(posts: Post[]) {
  return posts.reduce<Record<string, Post[]>>((groups, post) => {
    const year = String(post.data.pubDate.getFullYear());
    groups[year] ??= [];
    groups[year].push(post);
    return groups;
  }, {});
}
