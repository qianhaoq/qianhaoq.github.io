# 架构说明

## 总览

这是一个 Astro 静态博客。内容、RSS、sitemap 和搜索索引都在构建期生成；GitHub Pages 只托管 `dist/` 产物，不运行服务端代码。

## 数据流

1. 作者在 `src/content/posts/*.mdx` 写文章。
2. `src/content.config.ts` 校验 frontmatter。
3. 页面通过 `src/lib/posts.ts` 读取并过滤 `draft`。
4. `astro build` 生成静态页面、RSS 和 sitemap。
5. `pagefind --site dist` 为构建产物生成搜索索引。
6. GitHub Actions 上传 `dist/` 并由 GitHub Pages 发布。

## 路由

- `/`: 首页，展示个人品牌、最近文章和主题入口。
- `/posts/`: 文章列表。
- `/posts/[slug]/`: 文章详情。
- `/tags/` 与 `/tags/[tag]/`: 标签索引。
- `/archive/`: 年份归档。
- `/search/`: Pagefind 全文搜索。
- `/about/`: 关于页。
- `/rss.xml`: RSS feed。

## 发布

仓库名为 `qianhaoq.github.io`，因此 Astro `site` 固定为 `https://qianhaoq.github.io`，不设置 `base`。GitHub Pages source 使用 GitHub Actions workflow。
