import { createDraftPost } from './post-authoring';

const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: pnpm new:post "文章标题"');
  process.exit(1);
}

try {
  const draft = await createDraftPost({ title });
  console.log(`Created ${draft.filePath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
