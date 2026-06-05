import { createDraftPost, resolveDraftPost } from './post-authoring';

interface ParsedArgs {
  title: string;
  date?: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const titleParts: string[] = [];
  let date: string | undefined;
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg === '--date') {
      date = argv[index + 1];
      index += 1;
      continue;
    }

    titleParts.push(arg);
  }

  return {
    title: titleParts.join(' ').trim(),
    date,
    dryRun
  };
}

const args = parseArgs(process.argv.slice(2));

if (!args.title) {
  console.error('Usage: pnpm write "文章标题" [--date YYYY-MM-DD] [--dry-run]');
  process.exit(1);
}

try {
  if (args.dryRun) {
    const draft = resolveDraftPost({ title: args.title, date: args.date });
    console.log(JSON.stringify({
      title: draft.title,
      date: draft.date,
      slug: draft.slug,
      relativePath: draft.relativePath,
      draft: true,
      body: draft.body
    }, null, 2));
    process.exit(0);
  }

  const draft = await createDraftPost({ title: args.title, date: args.date });
  console.log(`Created draft: ${draft.relativePath}`);
  console.log('');
  console.log('Next steps:');
  console.log(`1. Edit ${draft.relativePath}`);
  console.log('2. Run pnpm dev for live preview, or pnpm build && pnpm preview for search validation');
  console.log('3. Keep draft: true until the post is ready');
  console.log('4. Change draft to false, then run pnpm quality');
  console.log('5. Push main to publish through GitHub Pages');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
