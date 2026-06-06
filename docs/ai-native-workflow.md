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

## 推荐状态流

```text
Backlog -> 待 Agent 处理 -> Agent 执行中 -> AI 评审 -> 人工评审 -> 预览验证 -> 待合并 -> Done
```

当前 `OneRepublic` 团队已经有这些状态。关键是每个 issue 都要能回答三件事：

1. 这次改动为什么做。
2. 做到什么程度算完成。
3. 哪些验证必须通过。

## Issue 模板

每个非纯内容 PR 应关联一个 Linear issue。内容类小文章可以直接走写作流程；但涉及站点行为、发布、作者入口、CI、review gate、样式系统或信息架构时，必须先有 issue。

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

PR 合并条件：

1. `Quality Gate` 通过。
2. `AI Review Gate` 通过。
3. 用户可见行为已同步 BDD。
4. 人类确认需求仍然成立。
5. 没有草稿、secret、后台路由或 GitHub Pages 静态边界风险。

## AI Review 策略

统一 review policy 在 `REVIEW.md`。Codex 和 Claude 可以用不同执行方式，但必须围绕同一套判断标准输出证据。

推荐分工：

- Codex hosted review：关注实现正确性、测试遗漏、仓库约束和可维护性。
- Claude review：关注发布安全、草稿隔离、RSS/sitemap/search、BDD 和静态站点边界。
- AI Review Gate：只判断当前 PR head 是否同时有 Codex PASS 和 Claude PASS evidence。

不要把 bot 的 `APPROVE` 当成唯一合并许可。真正阻塞 merge 的机制是 GitHub branch protection 里的 required checks。

## Linear GitHub Integration 设置

在 Linear 中把 `qianhaoq/qianhaoq.github.io` 连接到 `OneRepublic` 团队。推荐配置：

1. 启用 PR linking，允许通过 branch name、PR title、PR description 和 magic words 关联 issue。
2. 启用 issue status automation：
   - PR opened 或 linked：移动到执行或 review 状态。
   - PR merged to `main`：移动到 Done。
   - PR closed without merge：回到 Backlog 或 Canceled。
3. 不开启 GitHub Issues 双向同步，除非你决定把 GitHub Issues 也作为公开反馈入口。

## Agent 工作方式

1. 从 Linear issue 读取目标、非目标和验收标准。
2. 从仓库文档读取技术边界：`AGENTS.md`、`bdd.md`、`REVIEW.md`、`arch.md`。
3. 新建独立分支实现。
4. 如果改动用户可见行为，先补 BDD 场景或同步补场景。
5. 本地运行最小必要验证；代码或 workflow 变更优先运行 `pnpm quality:pr`。
6. 创建 PR，描述里包含 Linear issue key、验证结果和 review 触发方式。
7. 等待 GitHub required checks，而不是手动绕过门禁。

## 当前 Linear 项目

- Project: `AI-native qianhaoq.github.io 研发工作流`
- Team: `OneRepublic`
- First issue: `ONE-15`

## 参考

- Linear GitHub integration: https://linear.app/docs/github-integration
- Linear MCP server: https://linear.app/docs/mcp
- Linear Agent: https://linear.app/docs/linear-agent
- Linear Agents developer guide: https://linear.app/developers/agents
