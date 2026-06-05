# 架构说明

## 总览

这是一个 Astro 静态博客。内容、RSS、sitemap 和搜索索引都在构建期生成；GitHub Pages 只托管 `dist/` 产物，不运行服务端代码。

站点按两个入口分层：

- 读者入口：公开 GitHub Pages 站点，负责阅读、发现、搜索和订阅。
- 作者入口：本地仓库命令和文档，负责创建草稿、预览、质量门禁和发布。

公开站点不提供 `/admin`、登录态、GitHub token 写入或服务端发布按钮。需要写入仓库的能力必须留在本地环境或 GitHub 仓库权限边界内。

## 数据流

1. 作者通过 `pnpm author` 查看写作入口，通过 `pnpm write "标题"` 创建草稿。
2. 作者在 `src/content/posts/*.mdx` 写文章，草稿必须显式保留 `draft: true`。
3. `src/content.config.ts` 校验 frontmatter。
4. 页面通过 `src/lib/posts.ts` 读取并过滤 `draft`。
5. `astro build` 生成静态页面、RSS 和 sitemap。
6. `pagefind --site dist` 为构建产物生成搜索索引。
7. GitHub Actions 上传 `dist/` 并由 GitHub Pages 发布。

## 路由

- `/`: 首页，展示个人品牌、最近文章和主题入口。
- `/posts/`: 文章列表。
- `/posts/[slug]/`: 文章详情。
- `/tags/` 与 `/tags/[tag]/`: 标签索引。
- `/archive/`: 年份归档。
- `/search/`: Pagefind 全文搜索。
- `/about/`: 关于页。
- `/rss.xml`: RSS feed。

作者入口不属于公开路由，见 `AUTHORING.md`、`pnpm author` 和 `pnpm write`。

## 发布

仓库名为 `qianhaoq.github.io`，因此 Astro `site` 固定为 `https://qianhaoq.github.io`，不设置 `base`。GitHub Pages source 使用 GitHub Actions workflow。
