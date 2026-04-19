#!/usr/bin/env node
// amem — verify manifest.json is valid + every referenced path exists.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EXT = path.join(ROOT, 'extension');
const manifestPath = path.join(EXT, 'manifest.json');

function fail(msg) {
  console.error(`[verify] FAIL: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) fail(`manifest.json missing at ${manifestPath}`);

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (err) {
  fail(`manifest.json is not valid JSON: ${err.message}`);
}

const errors = [];
const paths = [];

function add(rel, label) {
  if (!rel) return;
  paths.push({ rel, label });
}

if (manifest.background?.service_worker) add(manifest.background.service_worker, 'background.service_worker');
if (manifest.side_panel?.default_path) add(manifest.side_panel.default_path, 'side_panel.default_path');

if (manifest.action?.default_icon) {
  for (const [size, rel] of Object.entries(manifest.action.default_icon)) {
    add(rel, `action.default_icon[${size}]`);
  }
}
if (manifest.icons) {
  for (const [size, rel] of Object.entries(manifest.icons)) {
    add(rel, `icons[${size}]`);
  }
}
for (const cs of manifest.content_scripts || []) {
  for (const js of cs.js || []) add(js, 'content_scripts.js');
  for (const css of cs.css || []) add(css, 'content_scripts.css');
}
for (const war of manifest.web_accessible_resources || []) {
  for (const r of war.resources || []) add(r, 'web_accessible_resources');
}

for (const { rel, label } of paths) {
  const abs = path.join(EXT, rel);
  if (!fs.existsSync(abs)) {
    errors.push(`missing file for ${label}: ${rel} (expected at ${abs})`);
  }
}

// Forbidden keys / values
if (manifest.oauth2) errors.push('manifest contains oauth2 block (must be removed)');
if (Array.isArray(manifest.permissions) && manifest.permissions.includes('identity')) {
  errors.push('manifest contains "identity" permission (must be removed)');
}

if (errors.length) {
  for (const e of errors) console.error(`[verify] FAIL: ${e}`);
  process.exit(1);
}

// Also sanity-check that offscreen.html is present (we reference it from background)
const offscreen = path.join(EXT, 'offscreen.html');
if (!fs.existsSync(offscreen)) fail('offscreen.html missing (referenced by background)');
const offscreenJs = path.join(EXT, 'offscreen.js');
if (!fs.existsSync(offscreenJs)) fail('offscreen.js missing (referenced by offscreen.html)');

console.log(`[verify] OK — manifest valid, ${paths.length} referenced paths exist, no forbidden keys`);
