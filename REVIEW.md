# Review Instructions

## Important

Report as Important only when the change can break the blog's behavior, publication safety, or repository operating contract:

- The production build, `pnpm quality`, GitHub Pages deployment, RSS, sitemap, Pagefind search, or public routes can fail.
- Draft posts can appear in public pages, RSS, sitemap, or search indexes.
- A user-visible behavior changes without matching BDD coverage.
- The content schema changes without updating examples, authoring scripts, and docs.
- The public GitHub Pages site gains an `/admin`-style backend, stores GitHub tokens, writes repository files, or depends on a runtime server.
- Secrets, tokens, private URLs, or credentials are committed or logged.

## Nit

Treat copy polish, minor style preferences, and naming suggestions as Nit at most unless they mislead the writing, publishing, or review workflow.

## Do Not Report

- Formatting, type errors, or build failures already enforced by CI unless the PR weakens the gate.
- Generated build output, dependency caches, or local test result artifacts.
- Lockfile changes that match dependency changes and do not introduce a clear security or compatibility risk.

## Always Check

- New posts explicitly declare `draft: true` or `draft: false`.
- Authoring scripts create drafts by default.
- Reader-facing pages remain static and public-only.
- Any behavior change is reflected in `features/**/*.feature` and step definitions.
- Review comments cite concrete files and give a reproducible validation path.
