import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

export const CODEX_BOT_AUTHORS = new Set(['chatgpt-codex-connector[bot]', 'codex-bot[bot]']);
export const CLAUDE_BOT_AUTHORS = new Set([
  'claude-bot[bot]',
  'cloud-code-review[bot]',
  'github-actions[bot]',
  'claude[bot]'
]);

const API_ROOT = 'https://api.github.com';

const normalizeDate = (value) => new Date(value).getTime();

const hasUsableDate = (value) => Number.isFinite(normalizeDate(value));

const isAtOrAfter = (candidate, lowerBound) => {
  if (!hasUsableDate(candidate) || !hasUsableDate(lowerBound)) return false;
  return normalizeDate(candidate) >= normalizeDate(lowerBound);
};

const bodyContainsCurrentHead = (body, headSha) => {
  const shortSha = headSha.slice(0, 10);
  return body.includes(headSha) || body.includes(shortSha) || body.includes(headSha.slice(0, 7));
};

const isCodexNoIssueBody = (body) =>
  body.includes('Codex Review') &&
  (
    body.includes("Didn't find any major issues") ||
    body.includes('Didn’t find any major issues') ||
    body.includes('未发现需要修改的问题')
  );

const isClaudePassBody = (body, headSha) =>
  body.includes('## Claude Code Review') &&
  body.includes(`Head SHA: ${headSha}`) &&
  body.includes('Verdict: PASS');

export const isCodexReviewTrigger = (body) => /^@codex\s+review\b/.test(body.trim().toLowerCase());

const reviewTargetsCurrentHead = (review, body, headSha) =>
  review.commit_id === headSha || bodyContainsCurrentHead(body, headSha);

const getBody = (item) => item.body ?? '';

/**
 * @typedef {{ login?: string }} GitHubUser
 * @typedef {{ id?: number, user?: GitHubUser, body?: string, created_at?: string }} IssueComment
 * @typedef {{ user?: GitHubUser, body?: string, submitted_at?: string, commit_id?: string }} PullReview
 * @typedef {{ user?: GitHubUser, content?: string, created_at?: string }} Reaction
 * @typedef {{ issueComments?: IssueComment[], pullReviews?: PullReview[], triggerReactions?: Reaction[] }} ReviewSnapshot
 * @typedef {{ headSha: string, headDate: string }} ReviewContext
 */

/**
 * @param {ReviewSnapshot} snapshot
 * @param {ReviewContext} context
 */
export const summarizeAiReviews = ({ issueComments = [], pullReviews = [], triggerReactions = [] }, { headSha, headDate }) => {
  const codexIssuePass = issueComments.find((comment) =>
    CODEX_BOT_AUTHORS.has(comment.user?.login) &&
    isCodexNoIssueBody(getBody(comment)) &&
    (bodyContainsCurrentHead(getBody(comment), headSha) || isAtOrAfter(comment.created_at, headDate))
  );

  const codexReviewPass = pullReviews.find((review) =>
    CODEX_BOT_AUTHORS.has(review.user?.login) &&
    isCodexNoIssueBody(getBody(review)) &&
    reviewTargetsCurrentHead(review, getBody(review), headSha)
  );

  const codexReactionPass = triggerReactions.find((reaction) =>
    CODEX_BOT_AUTHORS.has(reaction.user?.login) &&
    reaction.content === '+1' &&
    isAtOrAfter(reaction.created_at, headDate)
  );

  const claudeIssuePass = issueComments.find((comment) =>
    CLAUDE_BOT_AUTHORS.has(comment.user?.login) &&
    isClaudePassBody(getBody(comment), headSha)
  );

  return {
    codex: {
      passed: Boolean(codexIssuePass || codexReviewPass || codexReactionPass),
      evidence: codexIssuePass
        ? { source: 'issue_comment', author: codexIssuePass.user.login, createdAt: codexIssuePass.created_at }
        : codexReviewPass
          ? {
              source: 'pull_request_review',
              author: codexReviewPass.user.login,
              createdAt: codexReviewPass.submitted_at,
              commitId: codexReviewPass.commit_id
            }
          : codexReactionPass
            ? { source: 'trigger_reaction', author: codexReactionPass.user.login, createdAt: codexReactionPass.created_at }
            : null
    },
    claude: {
      passed: Boolean(claudeIssuePass),
      evidence: claudeIssuePass
        ? { source: 'issue_comment', author: claudeIssuePass.user.login, createdAt: claudeIssuePass.created_at }
        : null
    }
  };
};

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

export const fetchReviewSnapshot = async ({ token, repository, prNumber, headSha }) => {
  const commit = await githubFetch({ token, path: `/repos/${repository}/commits/${headSha}` });
  const headDate = commit.commit?.committer?.date ?? commit.commit?.author?.date;
  const issueComments = await paginate({ token, path: `/repos/${repository}/issues/${prNumber}/comments` });
  const pullReviews = await paginate({ token, path: `/repos/${repository}/pulls/${prNumber}/reviews` });

  const currentTriggers = issueComments.filter((comment) =>
    isCodexReviewTrigger(getBody(comment)) &&
    isAtOrAfter(comment.created_at, headDate)
  );

  const triggerReactions = (await Promise.all(currentTriggers.map((comment) =>
    paginate({ token, path: `/repos/${repository}/issues/comments/${comment.id}/reactions` })
  ))).flat();

  return { headDate, issueComments, pullReviews, triggerReactions };
};

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env ${name}.`);
  return value;
};

export const runAiReviewGate = async ({
  token = requiredEnv('GH_TOKEN'),
  repository = process.env.REPOSITORY ?? process.env.GITHUB_REPOSITORY,
  prNumber = process.env.PR_NUMBER,
  headSha = process.env.HEAD_SHA,
  attempts = Number(process.env.AI_REVIEW_GATE_ATTEMPTS ?? 45),
  sleepMs = Number(process.env.AI_REVIEW_GATE_SLEEP_MS ?? 20_000)
} = {}) => {
  if (!repository) throw new Error('Missing repository. Set REPOSITORY or GITHUB_REPOSITORY.');
  if (!prNumber) throw new Error('Missing PR_NUMBER.');
  if (!headSha) throw new Error('Missing HEAD_SHA.');

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const snapshot = await fetchReviewSnapshot({ token, repository, prNumber, headSha });
    const summary = summarizeAiReviews(snapshot, { headSha, headDate: snapshot.headDate });

    console.log(JSON.stringify({ attempt, headSha, headDate: snapshot.headDate, ...summary }, null, 2));

    if (summary.codex.passed && summary.claude.passed) {
      console.log(`codex-bot and claude-bot have both passed review for ${headSha}.`);
      return summary;
    }

    if (attempt < attempts) await sleep(sleepMs);
  }

  throw new Error(`Missing passing codex-bot and claude-bot reviews for current PR head ${headSha}.`);
};

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  runAiReviewGate().catch((error) => {
    console.error(`::error::${error.message}`);
    process.exit(1);
  });
}
