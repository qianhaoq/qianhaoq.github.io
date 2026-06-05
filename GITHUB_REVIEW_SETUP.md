# GitHub PR Review Setup

这个仓库已经包含 PR review 所需的 repo-local 配置：

- `AGENTS.md`: Codex 和通用 agent 指南，包含 `Review guidelines`。
- `CLAUDE.md`: 指向 `AGENTS.md` 的软链接，供 Claude Code 读取项目上下文。
- `REVIEW.md`: Claude Code Review 专用评审规则。
- `.github/workflows/pr-quality.yml`: PR 质量门禁，检查名是 `Quality Gate`。

## 推荐 GitHub 仓库设置

在 GitHub 仓库设置中配置 `main`：

1. Settings -> Rules -> Rulesets 或 Branches -> Branch protection rules。
2. 对 `main` 启用 pull request 后合并。
3. Require status checks before merging，选择 `Quality Gate`。
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

然后按 Anthropic 官方示例添加 workflow。当前仓库优先使用托管 Code Review，不默认提交需要 secret 的 Action workflow，避免未配置 secret 时 PR CI 失败。
