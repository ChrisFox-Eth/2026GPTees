export type ApiRouteAuth = 'public' | 'auth' | 'admin';

export interface ApiRouteManifestEntry {
  method: string;
  path: string;
  auth: ApiRouteAuth;
  handlers: string[];
}

export interface ApiRouteManifestDoc {
  generatedAt: string;
  routes: ApiRouteManifestEntry[];
}

export type ApiRouteManifestFormat = 'json' | 'md';

export interface ApiRouteManifestScriptArgs {
  format: ApiRouteManifestFormat;
  out?: string;
}
