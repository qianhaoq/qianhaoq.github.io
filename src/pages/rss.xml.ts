import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../lib/site';
import { getPostUrl, getPublishedPosts } from '../lib/posts';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${SITE.title} | ${SITE.subtitle}`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: getPostUrl(post),
      categories: post.data.tags
    }))
  });
}
