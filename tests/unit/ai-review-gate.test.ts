import { describe, expect, it } from 'vitest';
import { summarizeAiReviews } from '../../scripts/ai-review-gate.mjs';

const headSha = 'ce3ebf6cc587da6681fc83c8db998c5a694bb1e3';
const headDate = '2026-06-06T10:14:00Z';

describe('AI review gate contracts', () => {
  it('accepts current Claude PASS comments and Codex no-issue comments', () => {
    const summary = summarizeAiReviews({
      issueComments: [
        {
          user: { login: 'cloud-code-review[bot]' },
          created_at: '2026-06-06T10:16:45Z',
          body: `## Claude Code Review\n\nHead SHA: ${headSha}\nVerdict: PASS`
        },
        {
          user: { login: 'chatgpt-codex-connector[bot]' },
          created_at: '2026-06-06T10:19:34Z',
          body: "Codex Review: Didn't find any major issues. Bravo."
        }
      ]
    }, { headSha, headDate });

    expect(summary.claude).toMatchObject({ passed: true });
    expect(summary.codex).toMatchObject({ passed: true });
    expect(summary.codex.evidence?.source).toBe('issue_comment');
  });

  it('accepts Codex pull request reviews when they contain a no-issue verdict for the head', () => {
    const summary = summarizeAiReviews({
      pullReviews: [
        {
          user: { login: 'chatgpt-codex-connector[bot]' },
          submitted_at: '2026-06-06T10:19:34Z',
          body: `Codex Review: Didn't find any major issues.\n\nReviewed commit: ${headSha.slice(0, 10)}`
        }
      ]
    }, { headSha, headDate });

    expect(summary.codex).toMatchObject({ passed: true });
    expect(summary.codex.evidence?.source).toBe('pull_request_review');
  });

  it('accepts Codex thumbs-up reactions on a current @codex review trigger', () => {
    const summary = summarizeAiReviews({
      triggerReactions: [
        {
          user: { login: 'chatgpt-codex-connector[bot]' },
          content: '+1',
          created_at: '2026-06-06T10:20:00Z'
        }
      ]
    }, { headSha, headDate });

    expect(summary.codex).toMatchObject({ passed: true });
    expect(summary.codex.evidence?.source).toBe('trigger_reaction');
  });

  it('rejects stale Codex comments created before the current head commit', () => {
    const summary = summarizeAiReviews({
      issueComments: [
        {
          user: { login: 'chatgpt-codex-connector[bot]' },
          created_at: '2026-06-06T10:00:00Z',
          body: "Codex Review: Didn't find any major issues."
        }
      ]
    }, { headSha, headDate });

    expect(summary.codex).toMatchObject({ passed: false, evidence: null });
  });

  it('rejects Claude PASS comments for older heads', () => {
    const summary = summarizeAiReviews({
      issueComments: [
        {
          user: { login: 'cloud-code-review[bot]' },
          created_at: '2026-06-06T10:16:45Z',
          body: '## Claude Code Review\n\nHead SHA: 0e303d1e08e0b30121f633e10598d0e07b4b876b\nVerdict: PASS'
        }
      ]
    }, { headSha, headDate });

    expect(summary.claude).toMatchObject({ passed: false, evidence: null });
  });
});
