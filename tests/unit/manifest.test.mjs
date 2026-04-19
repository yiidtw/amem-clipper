import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'extension/manifest.json'), 'utf8'));

describe('manifest.json', () => {
  it('uses manifest v3', () => {
    expect(manifest.manifest_version).toBe(3);
  });
  it('is named amem', () => {
    expect(manifest.name).toBe('amem');
  });
  it('has no oauth2 block', () => {
    expect(manifest.oauth2).toBeUndefined();
  });
  it('has no identity permission', () => {
    expect(manifest.permissions).not.toContain('identity');
  });
  it('declares the expected recording permissions', () => {
    expect(manifest.permissions).toContain('tabCapture');
    expect(manifest.permissions).toContain('offscreen');
    expect(manifest.permissions).toContain('downloads');
  });
  it('references existing icons', () => {
    for (const size of ['16', '48', '128']) {
      const rel = manifest.icons[size];
      expect(fs.existsSync(path.join(ROOT, 'extension', rel))).toBe(true);
    }
  });
});
