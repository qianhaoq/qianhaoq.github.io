import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: pnpm new:post "文章标题"');
  process.exit(1);
}

const now = new Date();
const date = now.toISOString().slice(0, 10);
const asciiSlug = title
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
const slug = asciiSlug || `post-${now.getTime()}`;
const filePath = path.join(process.cwd(), 'src', 'content', 'posts', `${date}-${slug}.mdx`);

if (existsSync(filePath)) {
  console.error(`Post already exists: ${filePath}`);
  process.exit(1);
}

const body = `---
title: "${title.replace(/"/g, '\\"')}"
description: ""
pubDate: ${date}
tags: []
draft: true
---

## 背景

## 关键判断

## 证据

## 下一步
`;

await mkdir(path.dirname(filePath), { recursive: true });
await writeFile(filePath, body, 'utf8');
console.log(`Created ${filePath}`);
