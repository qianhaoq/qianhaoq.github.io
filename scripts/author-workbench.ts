import { pathToFileURL } from 'node:url';
import path from 'node:path';

const workbenchPath = path.resolve(process.cwd(), 'tools', 'author-workbench.html');
const workbenchUrl = pathToFileURL(workbenchPath).href;

console.log(`Hao Qian Blog local authoring workbench

Open this local HTML file in your browser:
  ${workbenchUrl}

Purpose:
  - Edit src/content/posts/*.mdx fields defined in src/content.config.ts
  - Preview the post locally in the page
  - Generate or update an MDX file
  - Prepare a publishing PR that reuses .github/workflows/deploy.yml after merge to main

Boundary:
  - No public /admin route
  - No GitHub token storage
  - No server-side repository writes from GitHub Pages
`);
