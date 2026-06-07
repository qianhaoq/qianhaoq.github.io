# GitHub PR Review Setup

这个仓库已经包含 PR review 所需的 repo-local 配置：

- `AGENTS.md`: 唯一 agent 指南源文件，Codex 会自动读取，包含 `Review guidelines`。
- `CLAUDE.md`: 指向 `AGENTS.md` 的软链接，供 Claude Code 自动读取同一份项目上下文。
- `REVIEW.md`: Claude Code Review 专用评审规则。
- `.github/workflows/pr-quality.yml`: PR 质量门禁，检查名是 `Quality Gate`。
- `.github/workflows/claude-review.yml`: Claude Code Review workflow。无论是否发现问题，都应在 PR 顶层写入 `## Claude Code Review` 总结评论。
- `.github/workflows/claude-review-evidence.yml`: 默认分支上的手动 Claude evidence workflow，用于 workflow self-change PR 或需要重新采集当前 head Claude 证据的场景。
- `.github/workflows/ai-review-gate.yml`: AI 评审门禁。使用 `pull_request_target` 在默认分支 workflow 上下文运行；先从默认分支 `trusted-base` 执行 PR metadata gate，再要求当前 PR head 同时存在 Codex PASS 和 Claude PASS 证据，避免运行 PR head 中被篡改的门禁脚本。
- `scripts/ai-review-gate.mjs`: 结构化汇总 Codex issue comment、PR review、trigger reaction 和 Claude PASS 评论。
- `scripts/devflow-metrics.mjs`: 记录 PR age、Quality Gate duration 和 bot review latency；指标评论失败不会阻塞 AI Review Gate。
- `docs/ai-native-workflow.md`: Linear -> GitHub -> Codex/Claude -> required checks 的端到端工作流说明。
- `.github/PULL_REQUEST_TEMPLATE.md`: 要求 PR 填写 Linear issue、验收标准、BDD/测试和静态边界检查。

## 推荐 GitHub 仓库设置

在 GitHub 仓库设置中配置 `main`：

1. Settings -> Rules -> Rulesets 或 Branches -> Branch protection rules。
2. 对 `main` 启用 pull request 后合并。
3. Require status checks before merging，选择 `Quality Gate` 和 `AI Review Gate`。
4. Require conversation resolution before merging。
5. Require linear history。
6. 不允许 force push 和 branch deletion。
7. Solo personal repo 默认不要求 required approval；需要协作者参与时，再开启 required pull request reviews。

## Linear 设置

Linear 是需求和状态源，不是合并门禁源。推荐在 Linear 的 GitHub integration 中为 `OneRepublic` 团队连接 `qianhaoq/qianhaoq.github.io`：

1. 启用 PR linking，让 branch name、PR title、PR description 和 magic words 可以关联 Linear issue。
2. 对 `main` 配置 issue status automation：PR linked/opened 进入执行或 review，PR merged 进入 Done，PR closed without merge 回到 Backlog 或 Canceled。
3. 保持 GitHub required checks 作为唯一硬门禁；Linear 状态只反映工作进度。
4. 暂不启用 GitHub Issues 双向同步，除非需要公开反馈入口。

## Codex Code Review

在 Codex settings 中为 `qianhaoq/qianhaoq.github.io` 开启 Code review。

使用方式：

```text
@codex review for security regressions, missing tests, and risky behavior changes.
```

需要自动评审时，在 Codex settings 中开启 Automatic reviews。

仓库内把 Codex reviewer 记作 `codex-bot`。真实 GitHub 评论作者仍是 OpenAI 的 `chatgpt-codex-connector[bot]`，这个 GitHub App 名称不能由本仓库改名。`AI Review Gate` 会要求 Codex comment/review 对应当前 PR head，并且包含 no major issues 的通过结论。
如果 Codex 以 PR review 或 `@codex review ...` 的 thumbs-up reaction 表示通过，`scripts/ai-review-gate.mjs` 也会纳入判断；PR review 必须绑定当前 `commit_id` 或正文包含当前 head SHA，issue comment 必须正文包含当前 head SHA，或晚于当前 head 的最新 `@codex review ...` 触发。

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

Claude reviewer 在仓库内记作 `claude-bot`。`claude-review.yml` 使用 `CLAUDE_BOT_APP_CLIENT_ID` 和 `CLAUDE_BOT_APP_PRIVATE_KEY` 创建 GitHub App token，再发布 `## Claude Code Review` 顶层评论；评论必须包含当前 PR head 和 `Verdict: PASS`。

`claude-review.yml` 会在 `opened`、`synchronize`、`reopened` 和 `ready_for_review` 时刷新 Claude 证据。这样 draft PR 标记 ready、已关闭 PR 重新打开、或后续 push 后，`AI Review Gate` 都能等待当前 head 的 Claude PASS，而不是复用旧提交证据。

如果 PR 修改 `.github/workflows/claude-review.yml` 本身，Anthropic `claude-code-action@v1` 可能拒绝换取 app token，因为正在运行的 workflow 文件必须已经存在于默认分支且内容一致。不要因此降低 `Quality Gate` 或 `AI Review Gate`；应从默认分支运行 `Claude Review Evidence` workflow，为指定 PR 和 head SHA 生成同格式 Claude PASS/FAIL 证据。

```bash
gh workflow run "Claude Review Evidence" \
  --repo qianhaoq/qianhaoq.github.io \
  --ref main \
  -f pr_number=<PR_NUMBER> \
  -f head_sha=<CURRENT_HEAD_SHA>
```

这个 workflow 必须从 `main` 运行，避免执行 PR head 中的 workflow 代码。它会让 Claude 实际 review 指定 PR 和 head SHA；Claude 模型步骤不能持有可被 gate 信任的写权限 token，最终只能用 Claude bot App token 发布 `## Claude Code Review` 评论。合并后再用 `reopened` 或 `ready_for_review` 事件验证默认分支 workflow。
