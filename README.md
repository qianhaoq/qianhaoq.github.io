# Hao Qian Blog

个人博客主站，发布到 <https://qianhaoq.github.io>。

## 写作

这个博客有两个入口：

- 读者入口：<https://qianhaoq.github.io>
- 作者入口：本地仓库命令 `pnpm author` 和 `pnpm write "文章标题"`

```bash
pnpm author
pnpm write "文章标题"
```

新文章会生成在 `src/content/posts/`，默认 `draft: true`。写完后把 `draft` 改为 `false`，再提交到 `main`。

Frontmatter:

```yaml
title: "标题"
description: "摘要"
pubDate: 2026-06-05
updatedDate: 2026-06-05
tags: ["AI Coding", "工程实践"]
draft: false
hero: "https://example.com/image.jpg"
series: "系列名"
```

更完整的作者流程见 `AUTHORING.md`。

## 开发

```bash
pnpm install
pnpm dev
pnpm quality
pnpm quality:pr
pnpm preview
```

`pnpm build` 会先执行 Astro 静态构建，再生成 Pagefind 搜索索引。搜索页需要在 `pnpm build && pnpm preview` 后验证。

## AI-native 工作流

进入 protected `main` 的 PR 使用 Linear 作为需求和验收来源，GitHub 作为代码、review、CI 和发布来源。

- Linear project: `AI-native qianhaoq.github.io 研发工作流`
- Linear team: `OneRepublic`
- PR 必须在标题或描述中包含 Linear issue key，例如 `ONE-15`
- PR 描述必须补齐 `## Acceptance`，不能保留模板占位内容；`quality:pr` 会在 CI 或已有本地 PR 分支上快速检查，`AI Review Gate` 会从默认分支 trusted checkout 执行硬门禁
- Agent 执行前按 `docs/agent-playbooks.md` 匹配任务 playbook，Slack/Linear Asks 来源需求先停在 `Triage` 做去重和补验收
- 合并硬门禁是 GitHub required checks：`Quality Gate` 和 `AI Review Gate`；solo personal repo 默认不要求 required approval

完整说明见 `docs/ai-native-workflow.md`。

## 质量门禁

```bash
pnpm quality
```

门禁顺序：

1. `pnpm lint`，ESLint 静态规则检查，任何 warning 都会失败
2. `pnpm check`
3. `pnpm unit:gate`，Vitest 单测通过率必须严格大于 90%
4. `pnpm build`
5. `pnpm bdd`

PR 默认检查运行 `pnpm quality:pr`，会额外执行 `pnpm browser:smoke`，用 Playwright 覆盖首页、文章页、搜索、主题切换、代码复制和移动端首屏。

BDD 约束见 `bdd.md`，场景在 `features/**/*.feature`。

## 发布

仓库使用 GitHub Actions 发布到 GitHub Pages。推送 `main` 后会执行：

1. `withastro/action@v5` 安装依赖。
2. `pnpm quality`
3. `actions/deploy-pages@v4`

GitHub Pages 配置应使用 workflow source，不使用 `gh-pages` 分支。

PR 的 AI review gate 使用默认分支可信 checkout 中的 `scripts/ai-review-gate.mjs` 读取 Codex 和 Claude 的当前 HEAD 评审结果；通过后会用 `scripts/devflow-metrics.mjs` 更新 PR 里的 Devflow Metrics 评论，评论失败不会阻塞合并门禁。
