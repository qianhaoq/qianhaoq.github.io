import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readWorkflow = (path: string) => readFileSync(path, 'utf8');

const pullRequestTypes = (workflow: string) => {
  const match = workflow.match(/pull_request:\s*\n\s+types:\s*\[([^\]]+)\]/);
  if (!match) return [];
  return match[1].split(',').map((type) => type.trim());
};

describe('workflow configuration contracts', () => {
  it('refreshes Claude review evidence when PRs reopen or leave draft', () => {
    const workflow = readWorkflow('.github/workflows/claude-review.yml');

    expect(pullRequestTypes(workflow)).toEqual([
      'opened',
      'synchronize',
      'reopened',
      'ready_for_review'
    ]);
  });
});
