# AGENTS.md

用中文和用户对话。

## 项目定位

- 这是 `qianhaoq.github.io` 个人博客主站，发布到 GitHub Pages。
- 运行时是纯静态站点，不引入数据库、常驻服务端或需要后端权限的功能。
- 项目有两个入口：公开读者入口是 GitHub Pages 静态站点；作者入口是本地仓库命令和文档，不发布成公开后台。
- 写作内容优先服务 AI Coding、工程实践、产品思考和长期复盘。
- 非纯内容 PR 使用 Linear 作为需求和验收来源；当前项目是 `AI-native qianhaoq.github.io 研发工作流`，团队是 `OneRepublic`，工作流说明见 `docs/ai-native-workflow.md`。

## 技术约束

- 使用 pnpm，不混用 npm、yarn 或 bun lockfile。
- 使用 Astro + TypeScript strict + MDX + Tailwind CSS。
- 文章放在 `src/content/posts/*.mdx`，通过 `src/content.config.ts` 的 Astro content collection 校验 frontmatter。
- 不在公开站点实现 `/admin`、登录态、GitHub token 写入或服务端发布按钮；写入仓库的能力只能放在本地脚本或 GitHub 仓库权限边界内。
- `AGENTS.md` 是唯一 agent 指南源文件，供 Codex 自动读取。
- `CLAUDE.md` 是指向 `AGENTS.md` 的软链接，供 Claude Code 自动读取同一份指南。
- 不保留 `agent.md`、`claude.md` 等大小写变体；修改 agent 指南时只编辑 `AGENTS.md`。
- BDD 约束写在 `bdd.md`；涉及用户可见行为时必须同步更新 `features/**/*.feature` 和 step definitions。

## 内容接口

文章 frontmatter 字段：

- `title`: 必填字符串。
- `description`: 必填字符串。
- `pubDate`: 必填日期。
- `updatedDate`: 可选日期。
- `tags`: 字符串数组，默认空数组。
- `draft`: 必填布尔值；草稿不得出现在公开列表、RSS、搜索索引和 sitemap。
- `hero`: 可选图片 URL。
- `series`: 可选系列名。

新文章使用：

```bash
pnpm write "文章标题"
```

## 验证要求

改动代码、样式、内容模型、测试或发布流程后，至少运行完整质量门禁：

```bash
pnpm quality
```

质量门禁包含：

- `pnpm lint`: ESLint 静态规则检查，任何 error 或 warning 都会失败。
- `pnpm check`: Astro/TypeScript 类型检查。
- `pnpm unit:gate`: Vitest 单测报告门禁，单测通过率必须严格大于 90%；没有执行任何单测视为失败。
- `pnpm build`: 生产构建并生成 Pagefind 索引。
- `pnpm bdd`: Cucumber BDD 验收构建后的静态产物。

PR 默认检查运行 `pnpm quality:pr`，它会在完整质量门禁后继续执行 `pnpm browser:smoke`，用 Playwright 验证关键读者路径和交互。

发布后检查运行 `pnpm deploy:smoke`，通过 `PLAYWRIGHT_BASE_URL` 指向真实 GitHub Pages URL，不启动本地 preview server。

只改纯文档且不影响公开页面、写作流程、发布流程或测试约束时，可以只运行相关的最小检查；最终报告必须说明跳过 `pnpm quality` 的原因。

涉及视觉和交互时，还要运行 `pnpm browser:smoke` 或用浏览器验证桌面和移动端关键页面，检查主题切换、搜索、文章目录和代码复制。

## Linear 工作流

- 开始任务前，先读取对应 Linear issue 的目标、非目标、验收标准、风险和链接；纯本地草稿可以先写作，但进入 protected `main` 的 PR 仍必须关联 issue。
- PR 标题或描述必须包含 Linear issue key，例如 `ONE-15`，以便 Linear GitHub integration 自动关联。
- Linear 记录需求和状态，GitHub 记录代码、review、CI 和合并事实；不要把 Linear 当成合并门禁，也不要在公开站点里保存 Linear 或 GitHub token。
- Agent 可以更新 Linear issue/comment 总结进展，但不得用 Linear 状态替代 `Quality Gate`、`AI Review Gate` 或人工合并判断。
- Agent 接到 `ai-agent-ready` issue 后，先按 `docs/agent-playbooks.md` 选择任务 playbook；不满足 owner、验收标准、area/risk 和修改范围条件时，先在 Linear 评论缺口，不直接开 PR。
- Slack/Linear Asks 来源的 issue 默认只进 `Triage`；完成去重、补验收、标记风险和明确 owner 后，才允许推进到 `待 Agent 处理`。
- PR 描述的 Linear issue key 和 `## Acceptance` 由 `scripts/check-pr-metadata.mjs` 检查；`quality:pr` 提供快速反馈，`AI Review Gate` 从默认分支 trusted checkout 执行硬门禁，不能保留模板占位内容。
- GitHub Pages 发布完成后必须通过真实 URL 的 `Deployment Verification`；失败时回写 Linear 并创建 follow-up 或回退。

## BDD 要求

- 新增或修改用户可见行为时，先补或同步补 BDD 场景，再实现。
- 默认每个 PR 都必须在 `## BDD / Tests` 段给出 BDD 证据（`验证结果` 围栏块里贴 `pnpm bdd` / `pnpm quality` 输出或 `features/**` 变更），或写明 `无需 BDD：<原因>`；这条由 `scripts/check-pr-metadata.mjs` 自动化强制，详见 `bdd.md`。
- BDD 场景描述业务行为，不描述组件内部实现。
- `pnpm bdd` 必须在 `pnpm build` 后执行，因为它读取 `dist/` 产物。
- 草稿隔离、已发布文章可发现、RSS、sitemap、搜索索引等发布契约必须保持 BDD 覆盖。
- 作者入口、写作脚本、草稿默认私有等写作契约必须保持 BDD 覆盖，且 BDD 只能用只读或 `--dry-run` 验收作者流程。

## Review guidelines

- 统一 review policy 见 `REVIEW.md`；Codex、Claude 和人工 review 都应优先遵守它。
- 重要问题：会导致公开站点构建失败、草稿泄露、RSS/sitemap/search 暴露错误、GitHub Pages 发布失败、作者入口误发布为公开后台、token/secret 暴露、或 `pnpm quality` 门禁被绕过。
- 重要问题：涉及用户可见行为但没有同步 BDD 场景，或改变内容 schema 但没有更新示例文章、写作脚本和文档。
- 重要问题：新增公开路由写入仓库、保存 GitHub token、模拟登录态或引入常驻服务端；这违反 GitHub Pages 静态边界。
- Nit：纯文案、样式微调或命名建议，除非它会误导发布、写作或评审流程。
- 不要报告 CI 已强制覆盖的普通格式问题；优先报告 CI 没法判断的发布契约、内容可见性、权限边界和文档/行为不一致。
- 每条行为类发现都应给出具体文件路径和可复现的验证方式。
- AI review gate 逻辑集中在 `scripts/ai-review-gate.mjs`，workflow 必须从默认分支的可信 checkout 执行该脚本，不要执行 PR head 中的门禁代码；修改 Codex/Claude 评审门禁时必须同步更新对应单测。

## 提交规范

提交信息遵循 Lore protocol：第一行写为什么改，必要时补充 `Constraint:`、`Rejected:`、`Confidence:`、`Scope-risk:`、`Directive:`、`Tested:`、`Not-tested:` trailers。
