import { fileURLToPath } from 'node:url';
import { summarizeAiReviews } from './ai-review-gate.mjs';

export const METRICS_MARKER = '<!-- devflow-metrics -->';

const API_ROOT = 'https://api.github.com';

export const formatDuration = (start, end) => {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return 'n/a';

  const totalSeconds = Math.round((endMs - startMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) return `${hours}h ${remainingMinutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const earliestDate = (values) => values
  .filter(Boolean)
  .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];

const getCheckDuration = (checkRuns, name) => {
  const run = checkRuns.find((candidate) => candidate.name === name);
  if (!run?.started_at || !run?.completed_at) return 'pending';
  return formatDuration(run.started_at, run.completed_at);
};

export const buildDevflowMetrics = ({ pullRequest, checkRuns, issueComments, pullReviews, triggerReactions, headDate }) => {
  const headSha = pullRequest.head.sha;
  const now = new Date().toISOString();
  const endTime = pullRequest.merged_at ?? pullRequest.closed_at ?? now;
  const aiSummary = summarizeAiReviews(
    { issueComments, pullReviews, triggerReactions },
    { headSha, headDate }
  );

  const codexTime = earliestDate([
    aiSummary.codex.evidence?.createdAt,
    ...pullReviews
      .filter((review) => review.user?.login === 'chatgpt-codex-connector[bot]')
      .map((review) => review.submitted_at)
  ]);
  const claudeTime = aiSummary.claude.evidence?.createdAt;

  return {
    headSha,
    state: pullRequest.merged_at ? 'merged' : pullRequest.state,
    prAge: formatDuration(pullRequest.created_at, endTime),
    timeSinceHead: formatDuration(headDate, endTime),
    codexReviewLatency: codexTime ? formatDuration(headDate, codexTime) : 'pending',
    claudeReviewLatency: claudeTime ? formatDuration(headDate, claudeTime) : 'pending',
    qualityGateDuration: getCheckDuration(checkRuns, 'Quality Gate'),
    aiReviewGateDuration: getCheckDuration(checkRuns, 'AI Review Gate'),
    deployDuration: getCheckDuration(checkRuns, 'deploy'),
    codexPassed: aiSummary.codex.passed,
    claudePassed: aiSummary.claude.passed
  };
};

export const renderMetricsComment = (metrics) => `${METRICS_MARKER}
## Devflow Metrics

| Metric | Value |
| --- | --- |
| PR state | ${metrics.state} |
| Head SHA | \`${metrics.headSha}\` |
| PR age | ${metrics.prAge} |
| Latest-head lead time | ${metrics.timeSinceHead} |
| Quality Gate duration | ${metrics.qualityGateDuration} |
| AI Review Gate duration | ${metrics.aiReviewGateDuration} |
| Codex review latency | ${metrics.codexReviewLatency} |
| Claude review latency | ${metrics.claudeReviewLatency} |
| Codex passed | ${metrics.codexPassed ? 'yes' : 'no'} |
| Claude passed | ${metrics.claudePassed ? 'yes' : 'no'} |

This comment is updated automatically so PRs have a lightweight delivery trace.
`;

const githubFetch = async ({ token, path, method = 'GET', body }) => {
  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${method} ${path} failed: ${response.status} ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
};

const paginate = async ({ token, path }) => {
  const items = [];
  let page = 1;

  while (true) {
    const separator = path.includes('?') ? '&' : '?';
    const batch = await githubFetch({ token, path: `${path}${separator}per_page=100&page=${page}` });
    items.push(...batch);
    if (batch.length < 100) return items;
    page += 1;
  }
};

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env ${name}.`);
  return value;
};

const collectTriggerReactions = async ({ token, repository, issueComments, headDate }) => {
  const triggerComments = issueComments.filter((comment) =>
    comment.body?.trim().toLowerCase() === '@codex review' &&
    new Date(comment.created_at).getTime() >= new Date(headDate).getTime()
  );

  return (await Promise.all(triggerComments.map((comment) =>
    paginate({ token, path: `/repos/${repository}/issues/comments/${comment.id}/reactions` })
  ))).flat();
};

export const runDevflowMetrics = async ({
  token = requiredEnv('GH_TOKEN'),
  repository = process.env.REPOSITORY ?? process.env.GITHUB_REPOSITORY,
  prNumber = process.env.PR_NUMBER
} = {}) => {
  if (!repository) throw new Error('Missing repository. Set REPOSITORY or GITHUB_REPOSITORY.');
  if (!prNumber) throw new Error('Missing PR_NUMBER.');

  const pullRequest = await githubFetch({ token, path: `/repos/${repository}/pulls/${prNumber}` });
  const headSha = pullRequest.head.sha;
  const commit = await githubFetch({ token, path: `/repos/${repository}/commits/${headSha}` });
  const headDate = commit.commit?.committer?.date ?? commit.commit?.author?.date;
  const issueComments = await paginate({ token, path: `/repos/${repository}/issues/${prNumber}/comments` });
  const pullReviews = await paginate({ token, path: `/repos/${repository}/pulls/${prNumber}/reviews` });
  const checkRunsResponse = await githubFetch({ token, path: `/repos/${repository}/commits/${headSha}/check-runs?per_page=100` });
  const triggerReactions = await collectTriggerReactions({ token, repository, issueComments, headDate });

  const metrics = buildDevflowMetrics({
    pullRequest,
    checkRuns: checkRunsResponse.check_runs ?? [],
    issueComments,
    pullReviews,
    triggerReactions,
    headDate
  });
  const body = renderMetricsComment(metrics);

  const existing = issueComments.find((comment) =>
    comment.user?.login === 'github-actions[bot]' &&
    comment.body?.includes(METRICS_MARKER)
  );

  if (existing) {
    await githubFetch({
      token,
      path: `/repos/${repository}/issues/comments/${existing.id}`,
      method: 'PATCH',
      body: { body }
    });
  } else {
    await githubFetch({
      token,
      path: `/repos/${repository}/issues/${prNumber}/comments`,
      method: 'POST',
      body: { body }
    });
  }

  console.log(JSON.stringify(metrics, null, 2));
  return metrics;
};

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  runDevflowMetrics().catch((error) => {
    console.error(`::error::${error.message}`);
    process.exit(1);
  });
}
