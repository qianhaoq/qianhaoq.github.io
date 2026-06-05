import { describe, expect, it } from 'vitest';
import {
  buildDraftPostBody,
  normalizePostDate,
  resolveDraftPost,
  slugifyTitle
} from '../../scripts/post-authoring';

describe('post authoring contracts', () => {
  it('normalizes explicit authoring dates', () => {
    expect(normalizePostDate('2026-06-06')).toBe('2026-06-06');
  });

  it('rejects ambiguous authoring dates', () => {
    expect(() => normalizePostDate('06/06/2026')).toThrow(/Expected YYYY-MM-DD/);
  });

  it('creates stable ascii slugs from English titles', () => {
    expect(slugifyTitle('AI Coding Practice Notes')).toBe('ai-coding-practice-notes');
  });

  it('keeps generated posts private by default', () => {
    expect(buildDraftPostBody('新的文章', '2026-06-06')).toContain('draft: true');
  });

  it('resolves drafts into the content posts directory', () => {
    const draft = resolveDraftPost({
      title: 'AI Coding Practice Notes',
      date: '2026-06-06',
      cwd: '/tmp/blog'
    });

    expect(draft.relativePath).toBe('src/content/posts/2026-06-06-ai-coding-practice-notes.mdx');
    expect(draft.filePath).toBe('/tmp/blog/src/content/posts/2026-06-06-ai-coding-practice-notes.mdx');
  });
});
