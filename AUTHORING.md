# 作者入口

这个仓库有两个入口：

- 读者入口：`https://qianhaoq.github.io`，只承载公开文章、标签、归档、搜索、RSS 和 sitemap。
- 作者入口：本地仓库里的 `pnpm author` 和 `pnpm write "文章标题"`，用于创建、预览、校验和发布文章。

GitHub Pages 只托管静态文件，没有服务端会话和权限控制，所以不要把写作后台、GitHub token 或发布按钮放到公开站点里。写作入口必须留在本地或 GitHub 仓库权限边界内。

## 公开站点入口

公开站点导航里可以提供“写作指南”入口，帮助作者从读者站点回到正确的本地工作流。

这个入口只做说明和导航，不提供在线编辑能力：

- 不提供公开 `/admin`。
- 不保存 GitHub token 或其他 secret。
- 不提供登录态、在线发布按钮或服务端写仓库能力。
- 修改内容时回到本地仓库命令或 GitHub PR 工作流。

## 开始写文章

```bash
pnpm author
pnpm write "文章标题"
```

`pnpm write` 会在 `src/content/posts/` 下创建 MDX 草稿，默认包含：

```yaml
draft: true
```

草稿不会进入文章列表、RSS、sitemap 或 Pagefind 搜索索引。

## 本地预览

快速写作预览：

```bash
pnpm dev
```

验证搜索索引时使用生产预览：

```bash
pnpm build
pnpm preview
```

## 发布

发布前把文章 frontmatter 改为：

```yaml
draft: false
```

然后运行完整门禁：

```bash
pnpm quality
```

门禁通过后推送 `main`，GitHub Actions 会发布到 GitHub Pages。
