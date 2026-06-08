## Linear

- Issue: <LINEAR-ISSUE-KEY>
- Project: AI-native qianhaoq.github.io 研发工作流

## Summary

-

## Acceptance

- <ACCEPTANCE-CRITERION-1>
- <ACCEPTANCE-CRITERION-2>

## BDD / Tests

> 默认每个 PR 都必须给出 BDD 证据。`scripts/check-pr-metadata.mjs` 会强制要求下面**二选一**：
> (1) 在 `验证结果` 围栏块里贴入真实证据（`pnpm bdd` / `pnpm quality` 输出，或 `features/**` 变更说明）；
> 或 (2) 写一行明确豁免，格式 `无需 BDD：<原因>`（原因不能是占位符）。

- [ ] 用户可见行为已同步 `features/**/*.feature` 和 step definitions，或本 PR 不改变用户可见行为
- [ ] `pnpm quality` 通过，或下方说明只运行最小检查的原因
- [ ] `pnpm quality:pr` 通过，或下方说明未运行原因

验证结果（贴 `pnpm bdd` / `pnpm quality` 输出或 `features/**` 变更；若无需 BDD 则改写为 `无需 BDD：<原因>`）：

```text

```

## Deployment Verification

- [ ] 如有 PR preview URL，已在真实部署 URL 上跑 smoke/BDD 验证并贴出链接
- [ ] 如当前只支持 production deploy，确认 merge 后必须通过 `Deployment Verification`
- [ ] 发布失败时会回写 Linear，并开 follow-up 或回退

## Review Evidence

- [ ] 已触发 Codex review，或等待自动 Codex review
- [ ] 已触发 Claude review，或等待 Claude workflow
- [ ] PR 合并前必须通过 `Quality Gate` 和 `AI Review Gate`

## Static Boundary

- [ ] 没有新增公开 `/admin`、登录态、token 保存、服务端写仓库能力或常驻后端
- [ ] 没有让 `draft: true` 内容进入公开页面、RSS、sitemap 或搜索索引
- [ ] 没有提交 secret、token、私有 URL 或凭据
