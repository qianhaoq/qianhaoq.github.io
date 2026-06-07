# AI-native 研发工作流

## 目标

这个仓库的工作流以 Linear 作为需求、验收和状态源，以 GitHub 作为代码、PR、CI 和发布源。Codex 与 Claude 负责实现、解释和独立 review，但最终是否允许合并只由 GitHub required checks 决定。

## 职责边界

| 系统 | 职责 | 不负责 |
| --- | --- | --- |
| Linear | 记录目标、非目标、验收标准、风险、状态和复盘 | 保存 token、替代 GitHub 合并门禁 |
| GitHub PR | 承载代码 diff、review 对话、CI 和 merge 决策 | 代替需求说明 |
| Codex | 根据 Linear issue 和仓库文档实现、解释、review | 绕过 BDD、质量门禁或静态站点边界 |
| Claude | 独立 review，给出当前 head 的 PASS/FAIL evidence | 单独决定能否 merge |
| Quality Gate | lint、typecheck、单测通过率、build、BDD、浏览器 smoke | 判断需求是否值得做 |
| AI Review Gate | 汇总 Codex 与 Claude 的当前 head review evidence | 代替 reviewer 的判断过程 |
| Deployment Verification | 在真实部署 URL 上验证发布结果 | 代替 PR 阶段的 BDD 和 review |

## 推荐状态流

```text
Triage -> Backlog -> 待 Agent 处理 -> Agent 执行中 -> AI 评审 -> 人工评审 -> 预览验证 -> 待合并 -> Done
```

当前 `OneRepublic` 团队已经有这些状态。关键是每个 issue 都要能回答三件事：

1. 这次改动为什么做。
2. 做到什么程度算完成。
3. 哪些验证必须通过。

Slack 或 Linear Asks 进入的需求默认停在 `Triage`。人类 owner 需要完成去重、补验收、标 area/risk、判断是否 `ai-agent-ready`，再推进到 `待 Agent 处理`。重复需求保留 canonical issue，另一个 issue 评论说明并关闭或取消。

## Issue 模板

每个进入 protected `main` 的 PR 都应关联一个 Linear issue。内容类小文章可以先走本地写作流程生成草稿；但一旦通过 PR 合入主站，也需要 issue key 和验收标准，确保发布记录可追溯。

```md
## 目标

用一段话说明用户价值或工作流收益。

## 非目标

明确这次不做什么，避免 agent 扩 scope。

## 验收标准

- 用户可见行为或工程契约的可验证结果。
- BDD、单测、构建、浏览器 smoke 中至少说明需要哪些。
- 如涉及发布安全，说明草稿、RSS、sitemap、search、Pages 的预期。

## 风险

- 静态站点边界
- secret/token 暴露
- 草稿泄露
- CI/门禁被绕过

## Agent 指令

- 先读 `AGENTS.md`、`REVIEW.md`、`bdd.md` 和本 issue。
- 保持 diff 小，更新测试和文档。
- PR 描述必须包含本 issue key。
```

## PR 规则

PR 标题或描述必须包含 Linear issue key，例如 `ONE-15`。这样 Linear 的 GitHub integration 可以把 issue 与 PR 关联起来，GitHub Actions 和 review 结果仍留在 GitHub 作为事实源。

`quality:pr` 会运行 `scripts/check-pr-metadata.mjs`，在 CI 或已有本地 PR 分支上提供快速反馈。`AI Review Gate` 会从默认分支的 `trusted-base` checkout 再执行同一 metadata gate，作为不可被 PR head 改写的硬门禁。没有真实 Linear issue key，或 `## Acceptance` 仍是占位内容时，PR 不能合并。

PR 合并条件：

1. `Quality Gate` 通过。
2. `AI Review Gate` 通过。
3. 代码仓库或用户可见行为已同步 BDD，并在 PR 描述里贴出验证证据。
4. 如存在 PR preview URL，已在真实 preview URL 上跑 smoke/BDD 验证。
5. 人类确认需求仍然成立。
6. 没有草稿、secret、后台路由或 GitHub Pages 静态边界风险。
7. Solo personal repo 默认不把 required approval 作为硬门禁；需要协作者参与时，可以临时开启或要求至少一个人工 PR review。

## 真实部署验证

`pnpm quality:pr` 和 `pnpm browser:smoke` 证明 PR head 可以构建并在本地 preview 正常运行，但它们不等于真实部署验证。真实部署验证必须访问 GitHub 记录的 deployment URL 或 preview URL。

当前仓库采用两层策略：

1. PR 阶段：`Quality Gate` 必须运行 `pnpm bdd` 和浏览器 smoke。若未来接入 preview provider，PR 还必须新增 `Preview Deployment Verification` check，使用 preview URL 运行同一套 smoke/BDD。
2. 合并后：`Deploy to GitHub Pages` 在 `actions/deploy-pages` 成功后输出 Pages URL，随后 `Deployment Verification` job 设置 `PLAYWRIGHT_BASE_URL` 指向真实 URL 并运行 `pnpm deploy:smoke`。

PR preview 的可选方案：

| 方案 | 适用场景 | 取舍 |
| --- | --- | --- |
| GitHub Pages + preview branch/action | 想尽量留在 GitHub 内部，接受 preview URL 公开 | 需要额外分支或第三方 action 管理 PR 子目录，不能覆盖当前 production Pages workflow |
| Vercel / Netlify / Cloudflare Pages preview | 需要每个 PR 自动生成独立 URL 和 GitHub check | 配置成熟，但会新增外部部署系统、权限边界和环境变量管理 |
| 只跑本地 artifact smoke | 只能作为快速反馈 | 不是真实部署验证，不能替代 preview 或 production URL 验证 |

在没有 PR preview provider 前，`预览验证` 只能基于本地/CI 产物和 merge 后 production URL。若 production `Deployment Verification` 失败，应在 Linear 回写失败摘要、日志链接和复现步骤；必要时重新打开 issue 或创建 follow-up 修复。

## AI Review 策略

统一 review policy 在 `REVIEW.md`。Codex 和 Claude 可以用不同执行方式，但必须围绕同一套判断标准输出证据。

推荐分工：

- Codex hosted review：关注实现正确性、测试遗漏、仓库约束和可维护性。
- Claude review：关注发布安全、草稿隔离、RSS/sitemap/search、BDD 和静态站点边界。
- AI Review Gate：只判断当前 PR head 是否同时有 Codex PASS 和 Claude PASS evidence。

不要把 bot 的 `APPROVE` 当成唯一合并许可。真正阻塞 merge 的机制是 GitHub branch protection 里的 required checks。

当 PR 修改 Claude review workflow 本身时，Anthropic action 可能拒绝运行尚未进入默认分支的 workflow 内容。此时不能绕过 required checks，也不能把失败的 optional `claude-review` check 当作通过；应从默认分支运行 `Claude Review Evidence` workflow，对指定 PR/head SHA 生成真实 Claude 证据，再让 `AI Review Gate` 重新读取。这个手动 evidence workflow 必须从默认分支 dispatch，Claude 模型步骤不能持有可被 gate 信任的写权限 token，最终 PASS/FAIL 评论只能由单独的 Claude bot App token 发布；`github-actions[bot]` 评论不作为 Claude PASS evidence。

## Linear GitHub Integration 设置

在 Linear 中把 `qianhaoq/qianhaoq.github.io` 连接到 `OneRepublic` 团队。推荐配置：

1. 启用 PR linking，允许通过 branch name、PR title、PR description 和 magic words 关联 issue。
2. 启用 issue status automation：
   - PR opened 或 linked：移动到执行或 review 状态。
   - PR merged to `main`：移动到 Done。
   - PR closed without merge：回到 Backlog 或 Canceled。
3. 不开启 GitHub Issues 双向同步，除非你决定把 GitHub Issues 也作为公开反馈入口。

当前 public repo 的 Linear public linkback 应保持关闭，除非先关闭 “include issue descriptions” 一类会把 Linear 描述同步到公开 GitHub 页面上的选项。

## Slack Intake 规则

Slack 负责收集上下文，不负责长期管理需求。推荐规则：

1. 所有 Slack Ask 默认进入 `Triage`。
2. 保留 Slack thread 链接和原始上下文摘要。
3. 只有补齐 owner、目标、非目标、验收标准、area/risk、dedupe 判断后，才进入 `Backlog` 或 `待 Agent 处理`。
4. 所有 public channel 都接入时，每天至少做一次 triage digest，清掉重复、无 owner、无验收标准的 issue。

## Preview 验证与自动推进

`预览验证` 是人类产品验证状态，不是 AI review 状态。

- 预览验证通过：Linear issue 进入 `待合并`，PR 等待 human review 和 required checks。
- 预览验证失败：Linear issue 回到 `处理中` 或 `待 Agent 处理`，AI 必须回写失败摘要、复现步骤和下一步建议。
- PR merge 到 `main` 后：Linear GitHub integration 自动推进到 `Done`，GitHub Actions 继续执行 production `Deployment Verification`。
- production `Deployment Verification` 失败：在 Linear 回写失败摘要、部署 URL、Actions 日志和下一步处理；需要修复时新建 follow-up issue 或重新打开原 issue。
- PR closed without merge：保留原因，回到 `Backlog` 或 `Canceled`。

## Agent 工作方式

1. 从 Linear issue 读取目标、非目标和验收标准。
2. 从仓库文档读取技术边界：`AGENTS.md`、`bdd.md`、`REVIEW.md`、`arch.md`。
3. 按 `docs/agent-playbooks.md` 选择对应 playbook。
4. 新建独立分支实现。
5. 如果改动用户可见行为，先补 BDD 场景或同步补场景。
6. 本地运行最小必要验证；代码或 workflow 变更优先运行 `pnpm quality:pr`，并在 PR 描述里贴 BDD 证据。
7. 创建 PR，描述里包含 Linear issue key、验收标准、验证结果和 review 触发方式。
8. 如有 preview URL，在真实 preview URL 上运行 smoke/BDD 并贴证据。
9. 等待 GitHub required checks 和部署验证，而不是手动绕过门禁。

## 当前 Linear 项目

- Project: `AI-native qianhaoq.github.io 研发工作流`
- Team: `OneRepublic`
- First issue: `ONE-15`

## 参考

- Linear GitHub integration: https://linear.app/docs/github-integration
- Linear MCP server: https://linear.app/docs/mcp
- Linear Agent: https://linear.app/docs/linear-agent
- Linear Agents developer guide: https://linear.app/developers/agents
