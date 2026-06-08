import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const LINEAR_ISSUE_PATTERN = /\bONE-\d+\b/g;
const PLACEHOLDER_VALUES = new Set(['-', 'todo', 'tbd', 'n/a', 'none']);
const PLACEHOLDER_PATTERNS = [
  /^required:/i,
  /^replace\b/i,
  /^<LINEAR-ISSUE-KEY>$/i,
  /^<ACCEPTANCE-CRITERION-\d+>$/i
];

const normalize = (value) => (value ?? '').replace(/\r\n/g, '\n').trim();

const stripListSyntax = (line) => line
  .trim()
  .replace(/^[-*]\s*/, '')
  .replace(/^\[[ xX]\]\s*/, '')
  .trim();

export const extractMarkdownSection = (body, heading) => {
  const normalizedBody = normalize(body);
  const headingPattern = new RegExp(`^##\\s+${heading}\\s*$`, 'im');
  const match = normalizedBody.match(headingPattern);
  if (!match || match.index === undefined) return '';

  const sectionStart = match.index + match[0].length;
  const rest = normalizedBody.slice(sectionStart);
  const nextHeading = rest.search(/^##\s+/m);
  return normalize(nextHeading === -1 ? rest : rest.slice(0, nextHeading));
};

const isPlaceholderLine = (line) => {
  const normalized = line.toLowerCase();
  return PLACEHOLDER_VALUES.has(normalized) || PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(line));
};

export const findLinearIssueKeys = ({ title = '', body = '' }) =>
  Array.from(`${title}\n${body}`.matchAll(LINEAR_ISSUE_PATTERN), ([match]) => match);

export const hasLinearIssueKey = ({ title = '', body = '' }) =>
  findLinearIssueKeys({ title, body }).length > 0;

export const extractFencedBlock = (section) => {
  const match = normalize(section).match(/```[^\n]*\n([\s\S]*?)```/);
  return match ? normalize(match[1]) : '';
};

export const extractFencedBlocks = (section) => {
  const normalized = normalize(section);
  const pattern = /```[^\n]*\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  while ((match = pattern.exec(normalized)) !== null) {
    blocks.push(normalize(match[1]));
  }
  return blocks;
};

// Evidence must reference a concrete verification artifact, not loose keywords such as
// "all checks passed" / "请通过验证" / "see features/" that any prose could contain.
// Accepted signals: a `pnpm bdd`/`pnpm quality` invocation, a cucumber scenario count
// (`8 scenarios` / `8 个场景`), or a specific `features/<name>.feature` file reference.
const BDD_EVIDENCE_PATTERN = /pnpm\s+(?:bdd|quality)\b|\d+\s+scenarios?\b|\d+\s*个场景|features\/[\w-]+\.feature/i;

const BDD_WAIVER_PATTERN = /^(?:无需\s*bdd|no\s+bdd(?:\s+needed)?)\s*[:：]?\s*(.*)$/i;

const hasBddWaiver = (section) =>
  section
    .split('\n')
    .map(stripListSyntax)
    .some((line) => {
      const match = line.match(BDD_WAIVER_PATTERN);
      if (!match) return false;
      const reason = match[1].trim();
      return reason.length >= 6 && !isPlaceholderLine(reason);
    });

export const hasBddEvidence = (body) => {
  const section = extractMarkdownSection(body, 'BDD / Tests');
  if (!section) return false;

  // An explicit, non-placeholder waiver is an accepted escape hatch.
  if (hasBddWaiver(section)) return true;

  // Otherwise require real verification evidence inside a fenced block. The template's
  // checkboxes mention `pnpm quality` / `features/**` as guidance, so evidence must live
  // in a fenced verification block. Scan every fence (not just the first) so authors can
  // keep the empty template block and append real output below it, and require the
  // content to reference actual verification rather than arbitrary filler text.
  return extractFencedBlocks(section).some((block) => BDD_EVIDENCE_PATTERN.test(block));
};

export const hasMeaningfulAcceptance = (body) => {
  const acceptance = extractMarkdownSection(body, 'Acceptance');
  if (!acceptance) return false;

  const rawLines = acceptance
    .split('\n')
    .filter(Boolean);
  const lines = rawLines.map(stripListSyntax);

  if (
    lines.length === 0 ||
    rawLines.some(isPlaceholderLine) ||
    lines.some((line) => !line || isPlaceholderLine(line))
  ) return false;

  return lines.some((line) => line.length >= 8);
};

export const validatePrMetadata = ({ title = '', body = '' }) => {
  const errors = [];

  if (!hasLinearIssueKey({ title, body })) {
    errors.push('PR title or body must include a Linear issue key such as ONE-15.');
  }

  if (!hasMeaningfulAcceptance(body)) {
    errors.push('PR body must include a non-placeholder ## Acceptance section.');
  }

  if (!hasBddEvidence(body)) {
    errors.push('PR body must include BDD evidence in the ## BDD / Tests section (verification output or a features/** change), or an explicit no-BDD reason such as "无需 BDD：原因".');
  }

  return {
    passed: errors.length === 0,
    errors
  };
};

export const readPullRequestMetadataFromEvent = (eventPath) => {
  if (!eventPath) return { title: '', body: '' };

  try {
    const event = JSON.parse(readFileSync(eventPath, 'utf8'));
    return {
      title: event.pull_request?.title ?? '',
      body: event.pull_request?.body ?? ''
    };
  } catch (error) {
    throw new Error(`Unable to read pull_request metadata from ${eventPath}: ${error.message}`, { cause: error });
  }
};

export const readPullRequestMetadataFromGitHubCli = (execFile = execFileSync) => {
  try {
    const output = execFile('gh', ['pr', 'view', '--json', 'title,body'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    const pullRequest = JSON.parse(output);
    return {
      title: pullRequest.title ?? '',
      body: pullRequest.body ?? ''
    };
  } catch {
    return { title: '', body: '' };
  }
};

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  const eventName = process.env.PR_METADATA_EVENT_NAME ?? process.env.GITHUB_EVENT_NAME;
  const eventMetadata = readPullRequestMetadataFromEvent(process.env.GITHUB_EVENT_PATH);
  const localMetadata = process.env.PR_TITLE || process.env.PR_BODY || eventMetadata.title || eventMetadata.body
    ? { title: '', body: '' }
    : readPullRequestMetadataFromGitHubCli();
  const title = process.env.PR_TITLE || eventMetadata.title || localMetadata.title;
  const body = process.env.PR_BODY || eventMetadata.body || localMetadata.body;

  if (eventName && eventName !== 'pull_request') {
    console.log(`Skipping PR metadata check for ${eventName}.`);
    process.exit(0);
  }

  if (!eventName && !title && !body) {
    console.log('Skipping PR metadata check outside a pull_request event or local PR branch.');
    process.exit(0);
  }

  const result = validatePrMetadata({ title, body });

  if (!result.passed) {
    for (const error of result.errors) {
      console.error(`::error::${error}`);
    }
    process.exit(1);
  }

  console.log('PR metadata includes a Linear issue key, meaningful acceptance criteria, and BDD evidence.');
}
