# Hao Qian Blog

个人博客主站，发布到 <https://qianhaoq.github.io>。

## 写作

```bash
pnpm new:post "文章标题"
```

新文章会生成在 `src/content/posts/`，默认 `draft: true`。写完后把 `draft` 改为 `false` 或删除该字段，再提交到 `main`。

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

## 开发

```bash
pnpm install
pnpm dev
pnpm check
pnpm build
pnpm preview
```

`pnpm build` 会先执行 Astro 静态构建，再生成 Pagefind 搜索索引。搜索页需要在 `pnpm build && pnpm preview` 后验证。

## 发布

仓库使用 GitHub Actions 发布到 GitHub Pages。推送 `main` 后会执行：

1. `withastro/action@v5` 安装依赖。
2. `pnpm check && pnpm build`
3. `actions/deploy-pages@v4`

GitHub Pages 配置应使用 workflow source，不使用 `gh-pages` 分支。
