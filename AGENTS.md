# AGENTS.md

用中文和用户对话。

## 项目定位

- 这是 `qianhaoq.github.io` 个人博客主站，发布到 GitHub Pages。
- 运行时是纯静态站点，不引入数据库、常驻服务端或需要后端权限的功能。
- 写作内容优先服务 AI Coding、工程实践、产品思考和长期复盘。

## 技术约束

- 使用 pnpm，不混用 npm、yarn 或 bun lockfile。
- 使用 Astro + TypeScript strict + MDX + Tailwind CSS。
- 文章放在 `src/content/posts/*.mdx`，通过 `src/content.config.ts` 的 Astro content collection 校验 frontmatter。
- `CLAUDE.md` 和 `claude.md` 是指向本文件的软链接；修改 agent 指南时只编辑 `AGENTS.md`。

## 内容接口

文章 frontmatter 字段：

- `title`: 必填字符串。
- `description`: 必填字符串。
- `pubDate`: 必填日期。
- `updatedDate`: 可选日期。
- `tags`: 字符串数组，默认空数组。
- `draft`: 可选布尔值；草稿不得出现在公开列表、RSS、搜索索引和 sitemap。
- `hero`: 可选图片 URL。
- `series`: 可选系列名。

新文章使用：

```bash
pnpm new:post "文章标题"
```

## 验证要求

改动代码、样式、内容模型或发布流程后，至少运行：

```bash
pnpm check
pnpm build
```

涉及视觉和交互时，还要用浏览器验证桌面和移动端关键页面，检查主题切换、搜索、文章目录和代码复制。

## 提交规范

提交信息遵循 Lore protocol：第一行写为什么改，必要时补充 `Constraint:`、`Rejected:`、`Confidence:`、`Scope-risk:`、`Directive:`、`Tested:`、`Not-tested:` trailers。
