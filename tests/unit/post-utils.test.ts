import { describe, expect, it } from 'vitest';
import {
  getAllTags,
  getPostSlugFromId,
  getReadingTime,
  groupPostsByYear,
  slugifyTag
} from '../../src/lib/post-utils';

describe('post utility contracts', () => {
  it('keeps markdown ids stable as public post slugs', () => {
    expect(getPostSlugFromId('2026-06-05-start-here.mdx')).toBe('2026-06-05-start-here');
    expect(getPostSlugFromId('notes/plain-post.md')).toBe('notes/plain-post');
  });

  it('normalizes mixed English and Chinese tags for URLs', () => {
    expect(slugifyTag('AI Coding')).toBe('ai-coding');
    expect(slugifyTag('工程实践')).toBe('工程实践');
    expect(slugifyTag('Product & Engineering')).toBe('product-and-engineering');
  });

  it('never reports less than one minute of reading time', () => {
    expect(getReadingTime('短文')).toBe('1 分钟');
  });

  it('counts Chinese text toward reading time', () => {
    const longChineseText = '工程实践'.repeat(180);
    expect(getReadingTime(longChineseText)).toBe('2 分钟');
  });

  it('sorts tags by frequency and exposes URL slugs', () => {
    const tags = getAllTags([
      { data: { tags: ['AI Coding', '工程实践'] } },
      { data: { tags: ['AI Coding'] } }
    ]);

    expect(tags).toEqual([
      { tag: 'AI Coding', count: 2, slug: 'ai-coding' },
      { tag: '工程实践', count: 1, slug: '工程实践' }
    ]);
  });

  it('groups posts by publication year', () => {
    const groups = groupPostsByYear([
      { data: { pubDate: new Date('2026-06-05') } },
      { data: { pubDate: new Date('2025-12-31') } },
      { data: { pubDate: new Date('2026-01-01') } }
    ]);

    expect(groups['2026']).toHaveLength(2);
    expect(groups['2025']).toHaveLength(1);
  });
});
