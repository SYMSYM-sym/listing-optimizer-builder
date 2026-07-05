#!/usr/bin/env node
/**
 * Fail CI if known secret patterns appear in the Next.js client bundle.
 * Run after `npm run build`.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CLIENT_DIRS = [join(ROOT, ".next", "static")];

const FORBIDDEN = [
  "ANTHROPIC_API_KEY",
  "RAINFOREST_API_KEY",
  "FIRECRAWL_API_KEY",
  "sk-ant-",
  "process.env.ANTHROPIC",
  "process.env.RAINFOREST",
  "process.env.FIRECRAWL",
];

function collectFiles(dir, acc = []) {
  if (!statSync(dir, { throwIfNoEntry: false })) {
    return acc;
  }
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) collectFiles(path, acc);
    else if (/\.(js|css|map)$/.test(entry)) acc.push(path);
  }
  return acc;
}

const files = CLIENT_DIRS.flatMap((dir) => collectFiles(dir));
if (files.length === 0) {
  console.error("No client bundle files found under .next/static — run npm run build first.");
  process.exit(1);
}

const hits = [];
for (const file of files) {
  const content = readFileSync(file, "utf8");
  for (const pattern of FORBIDDEN) {
    if (content.includes(pattern)) {
      hits.push(`${pattern} in ${file.replace(ROOT + "\\", "").replace(ROOT + "/", "")}`);
    }
  }
}

if (hits.length > 0) {
  console.error("Client bundle secret check FAILED:");
  for (const hit of hits) console.error(`  - ${hit}`);
  process.exit(1);
}

console.log(`Client bundle secret check passed (${files.length} files scanned).`);
