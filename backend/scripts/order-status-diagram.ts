import 'dotenv/config';
import { writeFileSync } from 'fs';
import { resolve as resolvePath } from 'path';
import { ORDER_POLICY_ACTIONS, ORDER_STATUS_TRANSITIONS } from '../src/policies/order-policy.js';
import { ORDER_STATUSES } from '../src/types/order-policy.js';
import type { OrderPolicyDiagramFormat, OrderPolicyDiagramScriptArgs } from '../src/types/order-policy-diagram.js';

function parseArgs(argv: string[]): OrderPolicyDiagramScriptArgs {
  const formatIndex = argv.indexOf('--format');
  const outIndex = argv.indexOf('--out');

  const formatRaw = formatIndex !== -1 ? argv[formatIndex + 1] : undefined;
  const out = outIndex !== -1 ? argv[outIndex + 1] : undefined;

  const format: OrderPolicyDiagramFormat = formatRaw === 'mmd' ? 'mmd' : 'md';

  return { format, out };
}

function toMermaid(): string {
  const lines: string[] = [];
  lines.push('stateDiagram-v2');

  lines.push('  [*] --> PENDING_PAYMENT');

  for (const from of ORDER_STATUSES) {
    const next = ORDER_STATUS_TRANSITIONS[from] || [];
    for (const to of next) {
      lines.push(`  ${from} --> ${to}`);
    }
  }

  return lines.join('\n');
}

function toMarkdown(): string {
  const lines: string[] = [];
  lines.push('# Order Status State Machine (generated)');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('```mermaid');
  lines.push(toMermaid());
  lines.push('```');
  lines.push('');
  lines.push('## Allowed Actions');
  lines.push('');
  lines.push('| Action | Allowed statuses |');
  lines.push('| --- | --- |');

  const actions = Object.keys(ORDER_POLICY_ACTIONS).sort((a, b) => a.localeCompare(b));
  for (const action of actions) {
    const allowed = ORDER_POLICY_ACTIONS[action as keyof typeof ORDER_POLICY_ACTIONS].allowedStatuses;
    lines.push(`| \`${action}\` | ${allowed.map((s) => `\`${s}\``).join(', ')} |`);
  }

  lines.push('');
  return lines.join('\n');
}

async function run() {
  const { format, out } = parseArgs(process.argv);
  const defaultOut = resolvePath(process.cwd(), '../docs/order-status-state-machine.generated.md');
  const outPath = out ? resolvePath(process.cwd(), out) : defaultOut;

  if (format === 'mmd') {
    writeFileSync(outPath, `${toMermaid()}\n`, { encoding: 'utf8' });
    console.log(`Wrote order status Mermaid diagram to ${outPath}`);
    return;
  }

  writeFileSync(outPath, toMarkdown(), { encoding: 'utf8' });
  console.log(`Wrote order status state machine doc to ${outPath}`);
}

run().catch((error) => {
  console.error('Failed to generate order status state machine', error);
  process.exit(1);
});
