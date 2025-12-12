import { readdirSync, readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { ANALYTICS_EVENT_CATALOG } from '../src/types/analytics-event-catalog.ts';

function listFilesRecursive(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = resolvePath(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
      continue;
    }

    if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractTrackEventNames(source: string): string[] {
  const names: string[] = [];
  const pattern = /trackEvent\(\s*['\"]([^'\"]+)['\"]/g;

  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(source))) {
    const name = match[1];
    if (name) names.push(name);
  }

  return names;
}

function extractFiresNames(source: string): string[] {
  const names: string[] = [];
  const pattern = /@fires\s+([a-z0-9_.-]+)/gi;

  let match: RegExpExecArray | null = null;
  while ((match = pattern.exec(source))) {
    const name = match[1];
    if (name) names.push(name);
  }

  return names;
}

async function run() {
  const srcDir = resolvePath(process.cwd(), 'src');
  const files = listFilesRecursive(srcDir);

  const usedNames = new Set<string>();

  for (const filePath of files) {
    const content = readFileSync(filePath, { encoding: 'utf8' });

    for (const name of extractTrackEventNames(content)) {
      usedNames.add(name);
    }

    for (const name of extractFiresNames(content)) {
      usedNames.add(name);
    }
  }

  const knownNames = new Set<string>(Object.keys(ANALYTICS_EVENT_CATALOG));

  const unknown = Array.from(usedNames)
    .filter((name) => !knownNames.has(name))
    .sort((a, b) => a.localeCompare(b));

  if (unknown.length > 0) {
    console.error('Unknown analytics events detected (not in catalog):');
    for (const name of unknown) {
      console.error(`- ${name}`);
    }
    process.exit(1);
  }

  console.log(`Analytics events check passed (${usedNames.size} used; ${knownNames.size} cataloged). Unused: ${unknown.length}`);
}

run().catch((error) => {
  console.error('Analytics events check failed', error);
  process.exit(1);
});
