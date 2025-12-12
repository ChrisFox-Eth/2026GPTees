import { writeFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { ANALYTICS_EVENT_CATALOG } from '../src/types/analytics-event-catalog.ts';

function toMarkdown(eventNames: string[]): string {
  const lines: string[] = [];

  lines.push('# Analytics Events (generated)');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('| Event |');
  lines.push('| --- |');

  for (const name of eventNames) {
    lines.push(`| \`${name}\` |`);
  }

  lines.push('');
  return lines.join('\n');
}

async function run() {
  const out = resolvePath(process.cwd(), '../docs/analytics-events.generated.md');

  const eventNames = Object.keys(ANALYTICS_EVENT_CATALOG).sort((a, b) => a.localeCompare(b));
  const content = toMarkdown(eventNames);

  writeFileSync(out, content, { encoding: 'utf8' });
  console.log(`Wrote analytics event catalog to ${out}`);
}

run().catch((error) => {
  console.error('Failed to generate analytics event docs', error);
  process.exit(1);
});
