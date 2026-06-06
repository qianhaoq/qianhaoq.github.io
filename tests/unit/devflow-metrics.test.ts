import { describe, expect, it } from 'vitest';
import { buildDevflowMetrics, formatDuration, renderMetricsComment } from '../../scripts/devflow-metrics.mjs';

const headSha = 'ce3ebf6cc587da6681fc83c8db998c5a694bb1e3';

describe('devflow metrics contracts', () => {
  it('formats compact durations', () => {
    expect(formatDuration('2026-06-06T10:00:00Z', '2026-06-06T10:00:42Z')).toBe('42s');
    expect(formatDuration('2026-06-06T10:00:00Z', '2026-06-06T10:02:05Z')).toBe('2m 5s');
    expect(formatDuration('2026-06-06T10:00:00Z', '2026-06-06T12:03:00Z')).toBe('2h 3m');
  });

  it('builds a PR delivery snapshot from checks and bot comments', () => {
    const metrics = buildDevflowMetrics({
      pullRequest: {
        state: 'open',
        created_at: '2026-06-06T10:00:00Z',
        closed_at: null,
        merged_at: null,
        head: { sha: headSha }
      },
      headDate: '2026-06-06T10:14:00Z',
      checkRuns: [
        {
          name: 'Quality Gate',
          started_at: '2026-06-06T10:14:15Z',
          completed_at: '2026-06-06T10:14:45Z'
        },
        {
          name: 'AI Review Gate',
          started_at: '2026-06-06T10:14:13Z',
          completed_at: '2026-06-06T10:19:41Z'
        }
      ],
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
      ],
      pullReviews: [],
      triggerReactions: []
    });

    expect(metrics).toMatchObject({
      headSha,
      state: 'open',
      qualityGateDuration: '30s',
      aiReviewGateDuration: '5m 28s',
      codexReviewLatency: '5m 34s',
      claudeReviewLatency: '2m 45s',
      codexPassed: true,
      claudePassed: true
    });

    expect(renderMetricsComment(metrics)).toContain('<!-- devflow-metrics -->');
    expect(renderMetricsComment(metrics)).toContain('| Quality Gate duration | 30s |');
  });
});
