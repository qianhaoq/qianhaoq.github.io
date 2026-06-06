# GitHub PR Review Setup

这个仓库已经包含 PR review 所需的 repo-local 配置：

- `AGENTS.md`: 唯一 agent 指南源文件，Codex 会自动读取，包含 `Review guidelines`。
- `CLAUDE.md`: 指向 `AGENTS.md` 的软链接，供 Claude Code 自动读取同一份项目上下文。
- `REVIEW.md`: Claude Code Review 专用评审规则。
- `.github/workflows/pr-quality.yml`: PR 质量门禁，检查名是 `Quality Gate`。
- `.github/workflows/claude-review.yml`: Claude Code Review workflow。无论是否发现问题，都应在 PR 顶层写入 `## Claude Code Review` 总结评论。
- `.github/workflows/ai-review-gate.yml`: AI 评审门禁。只有当前 PR head 同时存在 Codex PASS 和 Claude PASS 评论时才通过。

## 推荐 GitHub 仓库设置

在 GitHub 仓库设置中配置 `main`：

1. Settings -> Rules -> Rulesets 或 Branches -> Branch protection rules。
2. 对 `main` 启用 pull request 后合并。
3. Require status checks before merging，选择 `Quality Gate` 和 `AI Review Gate`。
4. Require conversation resolution before merging。
5. Require linear history。
6. 不允许 force push 和 branch deletion。

## Codex Code Review

在 Codex settings 中为 `qianhaoq/qianhaoq.github.io` 开启 Code review。

使用方式：

```text
@codex review for security regressions, missing tests, and risky behavior changes.
```

需要自动评审时，在 Codex settings 中开启 Automatic reviews。

Codex 通过信号来自 `chatgpt-codex-connector[bot]` 的 PR 顶层评论。`AI Review Gate` 会要求评论对应当前 PR head，并且包含无 major issues 的通过结论。

## Claude Code Review

Claude Code Review 是 GitHub App 侧能力。启用后，Claude 会读取 `CLAUDE.md` 和 `REVIEW.md`。

推荐先使用 Manual 模式：

```text
@claude review once
```

如果要用 Claude Code GitHub Actions，则需要添加 repository secret：

```text
ANTHROPIC_API_KEY
```

当前 workflow 使用 OAuth token：

```text
CLAUDE_CODE_OAUTH_TOKEN
```

Claude 通过信号来自 workflow 发布的 `## Claude Code Review` 顶层评论，且必须包含当前 PR head 和 `Verdict: PASS`。
