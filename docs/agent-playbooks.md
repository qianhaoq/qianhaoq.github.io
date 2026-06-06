# Agent Playbooks

这些 playbook 是 `qianhaoq.github.io` 的 AI-native 执行协议。Agent 接到 Linear issue 后，先匹配任务类型，再按对应 playbook 工作。没有匹配时，退回 `docs/ai-native-workflow.md` 的通用流程。

## 通用接单条件

Agent 只能处理满足以下条件的 issue：

- 有真实 Linear issue key、目标、非目标和验收标准。
- 有 owner；AI agent 是 delegate 或 contributor，不是最终责任人。
- 已标记 `ai-agent-ready`，并明确 area/risk 标签。
- 涉及安全、发布、公开入口或工作流门禁时，必须保留 `needs-human-review`。
- 明确允许修改的范围和必须运行的验证命令。
- 代码仓库或用户可见行为改动必须说明 BDD 场景和验证证据。

不满足条件时，先在 Linear 评论缺口，不要直接开 PR。

## 博客内容改动

适用：新增或修改文章、标签、摘要、系列信息。

步骤：

1. 读取 Linear issue、`AGENTS.md`、`AUTHORING.md` 和内容 schema。
2. 使用本地写作脚本创建或修改 `src/content/posts/*.mdx`。
3. 默认保持草稿私有；只有 issue 明确要求发布时才设置 `draft: false`。
4. 运行内容相关检查；若发布公开内容，运行 `pnpm quality`。
5. PR 描述写清 Linear issue key、草稿/发布状态、验证结果。

禁止：

- 不要把未确认的草稿暴露到 RSS、sitemap、搜索或首页。
- 不要引入服务端写入、登录态或公开后台。

## 静态站交互改动

适用：首页、搜索、主题切换、文章页、作者入口展示、样式和读者交互。

步骤：

1. 先补或同步 `features/**/*.feature` 与 step definitions。
2. 保持 GitHub Pages 纯静态边界，只在本地脚本或构建期写入。
3. 运行 `pnpm quality:pr`；涉及视觉时补浏览器 smoke 证据。
4. PR 描述列出用户可见变化、BDD 场景、桌面/移动端验证结果。

禁止：

- 不要新增公开 `/admin`、token 保存、模拟登录态或常驻后端。
- 不要只改 UI 而漏掉 BDD 场景。

## CI / Review Gate 改动

适用：GitHub Actions、AI Review Gate、Claude review、Quality Gate、branch protection 文档。

步骤：

1. 先读 `REVIEW.md`、`GITHUB_REVIEW_SETUP.md`、`scripts/ai-review-gate.mjs` 和相关单测。
2. 修改 gate 逻辑时同步更新 `tests/unit/*`。
3. 使用可信默认分支 checkout 执行 gate 脚本，不执行 PR head 中的门禁代码。
4. 发布 workflow 改动必须说明 PR preview 或 production deployment verification 如何保留真实 URL 证据。
5. 运行 `pnpm unit` 和 `pnpm quality:pr`；`AI Review Gate` 中的 metadata gate 必须从默认分支 `trusted-base` 执行，若完整门禁不可用，说明缺口。
6. PR 描述必须包含 Linear issue key、BDD/部署验证证据、风险说明、回滚方式。

禁止：

- 不要降低 required checks。
- 不要把 bot 评论当成唯一 merge 许可。
- 不要把 secret 或 Linear/GitHub token 暴露给公开站点运行时。

## Linear / GitHub Workflow 改动

适用：Linear 状态流、Slack intake、PR 模板、issue 模板、状态自动化和协作协议。

步骤：

1. 先核对当前 Linear issue/status/label 与 GitHub branch protection。
2. 代码或文档改动必须让 PR 能被 GitHub/Linear 自动关联。
3. Slack-originated issue 只能从 `Triage` 开始；补齐 owner、acceptance、area/risk、dedupe 判断后才能进 `待 Agent 处理`。
4. Preview 验证通过后进 `待合并`；验证失败回 `处理中` 或 `待 Agent 处理`，并要求失败摘要。
5. PR preview 或 production deployment verification 失败时，回写 Linear 失败摘要、部署 URL、Actions 日志和下一步。
6. 关闭重复 issue 时，保留 canonical issue 链接和处理原因。

禁止：

- 不要把所有 Slack 线程直接变成 agent-ready 任务。
- 不要把 Linear 状态当成 CI 通过证据。
