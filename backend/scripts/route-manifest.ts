import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { createApp } from '../src/app.js';
import type {
  ApiRouteManifestDoc,
  ApiRouteManifestEntry,
  ApiRouteManifestFormat,
  ApiRouteAuth,
  ApiRouteManifestScriptArgs,
} from '../src/types/api-route-manifest.js';

function parseArgs(argv: string[]): ApiRouteManifestScriptArgs {
  const formatIndex = argv.indexOf('--format');
  const outIndex = argv.indexOf('--out');

  const formatRaw = formatIndex !== -1 ? argv[formatIndex + 1] : undefined;
  const out = outIndex !== -1 ? argv[outIndex + 1] : undefined;

  const format: ApiRouteManifestFormat = formatRaw === 'json' ? 'json' : 'md';

  return { format, out };
}

function joinPaths(basePath: string, nextPath: string): string {
  const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  const next = nextPath.startsWith('/') ? nextPath : `/${nextPath}`;
  const combined = `${base}${next}`;
  const normalized = combined === '' ? '/' : combined.replace(/\/+/g, '/');
  if (normalized !== '/' && normalized.endsWith('/')) return normalized.slice(0, -1);
  return normalized;
}

function getMountPath(layer: any): string {
  if (!layer?.regexp) return '';

  if (layer.regexp.fast_slash) return '';

  const source = String(layer.regexp.source);

  if (source === '^\\/?$') return '';

  const cleaned = source
    .replace('^\\/', '')
    .replace('\\/?(?=\\/|$)', '')
    .replace(/\\\//g, '/');

  if (!cleaned) return '';

  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

function getHandlerName(fn: any): string {
  if (!fn) return 'unknown';
  if (typeof fn !== 'function') return 'unknown';
  return fn.name || 'anonymous';
}

function getAuthFromHandlerNames(names: string[]): ApiRouteAuth {
  if (names.includes('requireAdmin')) return 'admin';
  if (names.includes('requireAuth')) return 'auth';
  return 'public';
}

function collectRoutesFromStack(stack: any[], basePath: string): ApiRouteManifestEntry[] {
  const routes: ApiRouteManifestEntry[] = [];

  for (const layer of stack) {
    if (layer?.route) {
      const routePath = joinPaths(basePath, layer.route.path);
      const methods = Object.keys(layer.route.methods || {})
        .filter((m) => Boolean(layer.route.methods[m]))
        .map((m) => m.toUpperCase());

      const handlerFns = (layer.route.stack || []).map((l: any) => l.handle);
      const handlerNames = handlerFns.map(getHandlerName);
      const auth = getAuthFromHandlerNames(handlerNames);

      for (const method of methods) {
        routes.push({
          method,
          path: routePath,
          auth,
          handlers: handlerNames,
        });
      }

      continue;
    }

    if (layer?.name === 'router' && layer?.handle?.stack) {
      const mountPath = getMountPath(layer);
      const nextBasePath = mountPath ? joinPaths(basePath, mountPath) : basePath;
      routes.push(...collectRoutesFromStack(layer.handle.stack, nextBasePath));
    }
  }

  return routes;
}

function toMarkdown(doc: ApiRouteManifestDoc): string {
  const lines: string[] = [];

  lines.push('# API Routes (generated)');
  lines.push('');
  lines.push(`Generated: ${doc.generatedAt}`);
  lines.push('');
  lines.push('| method | path | auth | handlers |');
  lines.push('|---|---|---|---|');

  for (const route of doc.routes) {
    lines.push(
      `| ${route.method} | ${route.path} | ${route.auth} | ${route.handlers.join(', ')} |`
    );
  }

  lines.push('');
  return lines.join('\n');
}

async function run() {
  const { format, out } = parseArgs(process.argv);

  const app = createApp();
  const stack = (app as any)?._router?.stack || [];

  const routes = collectRoutesFromStack(stack, '');
  routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  const doc: ApiRouteManifestDoc = {
    generatedAt: new Date().toISOString(),
    routes,
  };

  const content =
    format === 'json' ? JSON.stringify(doc, null, 2) : toMarkdown(doc);

  if (out) {
    const outPath = resolvePath(process.cwd(), out);
    writeFileSync(outPath, content, { encoding: 'utf8' });
    console.log(`Wrote ${format} route manifest to ${outPath}`);
    return;
  }

  console.log(content);
}

run().catch((error) => {
  console.error('Failed to generate route manifest', error);
  process.exit(1);
});
