# 首页 GitHub 项目与快照

首页仍是 `https://qianhaoq.github.io/`，原有文章、标签、归档、RSS、搜索与写作入口保持原结构。项目展示和图表是首页的原生 Astro/CSS 模块，不使用第三方统计图片、图库或运行时 GitHub 请求。

## 数据口径

- 唯一数据源：`https://api.github.com/users/qianhaoq/repos?type=owner&per_page=100&sort=full_name`，分页读取公开仓库。命令不发送 Authorization，也不读取 token。
- 范围：qianhaoq 所有公开、非 fork、非归档仓库；排除停用的 `qianhao-ai-site`。快照仅保存名称、公开仓库 URL、描述、主语言和最近推送时间，以及来源、采集时刻和 schema 版本。
- 主语言分布是 `language` 字段的**仓库数量**，不是语言字节数、代码量、个人贡献或能力评分；`null` 计入“未标注”。
- 推送分组使用每个仓库的 `pushed_at` 距采集时刻的实际时长，≤7×24 小时、>7 到 ≤30×24 小时、>30×24 小时分别计一次；无日期单独计数。它不是 events、提交数、全年热力图或个人活跃度。
- `src/lib/github.ts` 的 `SELECTED_PROJECTS` 是人工选读清单，不宣称实时置顶排名。简介依据各项目公开 README 整理。项目只有存在于有效快照中才展示。

## 更新

在仓库根目录运行：

```bash
pnpm github:refresh
git diff -- src/data/github.json
pnpm quality
pnpm browser:smoke
```

将快照差异随关联真实 Linear issue 的 PR 一起审查。建议每月以及项目公开状态变化后更新；没有新增自动提交、定时任务或部署触发。普通 `pnpm build`/`pnpm quality` 仅使用已提交快照，可在无 GitHub 网络访问的环境构建。脚本最多取 20 页，每次请求 15 秒超时；遇到公开 API 限流应稍后重试，不要为本功能增加私有权限或凭证。

## 降级与隐私

刷新命令先完成所有请求和校验，再用临时文件原子替换。请求失败、异常分页、非公开数据、重复仓库或空结果都会以非零码退出，保留现有快照；不把失败变成零活动。缺失、损坏、结构不符的快照会在构建时显示 GitHub 链接与“数据暂不可用”，博客仍可正常构建。

所有图表和数字都在静态 HTML 中，有文字数值与口径，不依赖颜色或 JavaScript 才可阅读。采集时间明确为 UTC。超过 30 天显示“历史快照”；浏览器只计算快照年龄，以便长期未重建的 Pages 也能更新提示，不请求 API。无 JavaScript 时仍有绝对采集日期及“超过 30 天请以 GitHub 为准”的提示。

快照是公开历史记录。仓库后来改为私有、归档或删除时，旧快照不会自动撤回；应主动刷新，并按需要清理历史记录。页面不会获取或披露非公开仓库，但无法据静态快照保证项目始终保持公开。

## 与 PR #22 的关系

基于 `main` 的独立分支，仅新增首页组件、数据、刷新命令、验证与本文档。PR #22 是本地作者工作台，变更 `AUTHORING.md`、作者脚本、authoring 页面与其 BDD；本次没有修改这些文件。双方只在 `package.json` 的 scripts 中各加一条独立命令，可以并存。不要为本次任务采用或修改 #22 的作者工作台实现。

PR #22 的历史 review 涉及 shell quoting、真实换行、Linear issue key、frontmatter 转义及 Markdown 预览；本次不生成 shell 发布清单、不解析文章 frontmatter、不改发布流程，也不绕过原有门禁。
