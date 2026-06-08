console.log(`Hao Qian Blog authoring entry

Reader entry:
  https://qianhaoq.github.io
  pnpm build && pnpm preview

Writer entry:
  pnpm author:workbench
  pnpm write "文章标题"

Draft workflow:
  1. Open tools/author-workbench.html for visual edit + preview, or edit the generated file under src/content/posts/
  2. Keep draft: true while writing
  3. Run pnpm dev for fast preview
  4. Change draft to false when ready to publish
  5. Run pnpm quality
  6. Create a PR with the Linear issue key, pass Quality Gate + AI Review Gate, then merge to main to publish (do not push straight to main)

Reference:
  AUTHORING.md
`);
