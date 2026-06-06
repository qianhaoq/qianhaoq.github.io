# Agent Review Smoke Test

This temporary file creates a small pull request diff to verify whether both
Codex and Claude can review pull requests in `qianhaoq/qianhaoq.github.io`.

Expected signals:

- `Quality Gate` completes successfully.
- Codex responds to `@codex review`.
- Claude Code Review runs from `.github/workflows/claude-review.yml`.

Do not merge this pull request into `main`.
