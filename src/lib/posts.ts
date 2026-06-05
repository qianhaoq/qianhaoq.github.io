import { getCollection, type CollectionEntry } from 'astro:content';
import {
  formatDate,
  getAllTags,
  getPostSlugFromId,
  getReadingTime,
  groupPostsByYear,
  slugifyTag
} from './post-utils';

export { formatDate, getAllTags, getReadingTime, groupPostsByYear, slugifyTag };

export type Post = CollectionEntry<'posts'>;

export async function getPublishedPosts() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function getPostSlug(post: Post) {
  return getPostSlugFromId(post.id);
}

export function getPostUrl(post: Post) {
  return `/posts/${getPostSlug(post)}/`;
}
