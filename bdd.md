# BDD 验证约束

## 目标

BDD 用来锁定用户可见行为，不替代单测。任何影响发布、内容可见性、搜索、RSS、sitemap、导航或写作流程的改动，都要同步更新 BDD 场景。

## 目录

- `features/**/*.feature`: Gherkin 场景，只描述业务行为。
- `features/steps/**/*.mjs`: Cucumber step definitions，验证构建后的 `dist/` 产物和 repo-local 作者入口契约。
- `pnpm bdd`: 在 `pnpm build` 后执行，读取静态产物做验收。

## 编写规则

- 场景使用 `Given / When / Then`，避免描述组件内部结构。
- BDD 断言用户可见行为：已发布文章可见、草稿不可见、搜索/RSS/sitemap 可发现、关键页面可访问、作者入口默认创建私有草稿。
- 新增用户可见能力时，先补或同步补一个失败的 BDD 场景，再实现。
- 修复 bug 时，如果 bug 影响公开行为，必须新增回归场景。
- BDD 不写入 repo 文件，不依赖外部网络，不验证 GitHub API；作者入口只能通过 `--dry-run` 或只读方式验收；线上发布状态由 GitHub Actions 和 Pages API 验证。

## 门禁

完整质量门禁是：

```bash
pnpm quality
```

该命令顺序执行：

1. `pnpm lint`
2. `pnpm check`
3. `pnpm unit:gate`
4. `pnpm build`
5. `pnpm bdd`

`pnpm bdd` 必须在 `pnpm build` 后执行；如果 `dist/` 不存在，BDD 应直接失败。
