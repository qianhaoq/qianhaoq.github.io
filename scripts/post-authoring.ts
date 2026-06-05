import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface DraftPostInput {
  title: string;
  cwd?: string;
  date?: string | Date;
}

export interface DraftPost {
  title: string;
  date: string;
  slug: string;
  relativePath: string;
  filePath: string;
  body: string;
}

export function normalizePostDate(date: string | Date = new Date()) {
  if (date instanceof Date) {
    return date.toISOString().slice(0, 10);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid post date: ${date}. Expected YYYY-MM-DD.`);
  }

  return date;
}

export function slugifyTitle(title: string) {
  const asciiSlug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return asciiSlug || `post-${Date.now()}`;
}

export function buildDraftPostBody(title: string, date: string) {
  return `---
title: ${JSON.stringify(title)}
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
}

export function resolveDraftPost(input: DraftPostInput): DraftPost {
  const title = input.title.trim();

  if (!title) {
    throw new Error('Post title is required.');
  }

  const cwd = input.cwd ?? process.cwd();
  const date = normalizePostDate(input.date);
  const slug = slugifyTitle(title);
  const relativePath = path.join('src', 'content', 'posts', `${date}-${slug}.mdx`);
  const filePath = path.join(cwd, relativePath);

  return {
    title,
    date,
    slug,
    relativePath,
    filePath,
    body: buildDraftPostBody(title, date)
  };
}

export async function createDraftPost(input: DraftPostInput) {
  const draft = resolveDraftPost(input);

  if (existsSync(draft.filePath)) {
    throw new Error(`Post already exists: ${draft.filePath}`);
  }

  await mkdir(path.dirname(draft.filePath), { recursive: true });
  await writeFile(draft.filePath, draft.body, 'utf8');
  return draft;
}
