console.log(`Hao Qian Blog authoring entry

Reader entry:
  https://qianhaoq.github.io
  pnpm build && pnpm preview

Writer entry:
  pnpm write "文章标题"

Draft workflow:
  1. Edit the generated file under src/content/posts/
  2. Keep draft: true while writing
  3. Run pnpm dev for fast preview
  4. Change draft to false when ready to publish
  5. Run pnpm quality
  6. Push main to publish

Reference:
  AUTHORING.md
`);
