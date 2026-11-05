import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build, installEmbed, validateConfig } from '../scripts/build.mjs';
const placeholder = {
  siteUrl: '',
  indexable: false,
  formpop: { enabled: false, endpoint: '', embedFile: '' },
};
test('previews cannot accidentally be indexed or publish an invented domain', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'leafing-well-test-'));
  try {
    await build({ directory, config: placeholder });
    const html = await readFile(path.join(directory, 'index.html'), 'utf8');
    assert.match(html, /name="robots" content="noindex, nofollow"/);
    assert.doesNotMatch(html, /rel="canonical"|leafingwell\.org/);
    assert.match(html, /<fieldset disabled>/);
    assert.doesNotMatch(html, /action=|name="email"/);
    assert.match(await readFile(path.join(directory, 'robots.txt'), 'utf8'), /Disallow: \//);
    assert.match(await readFile(path.join(directory, '_headers'), 'utf8'), /X-Robots-Tag: noindex/);
    assert.doesNotMatch(await readFile(path.join(directory, 'sitemap.xml'), 'utf8'), /<loc>/);
    const schema = JSON.parse(
      html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1],
    );
    assert.equal(schema.areaServed.name, 'South Australia');
    assert.match(schema.description, /in development/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test('verified site URL populates canonical, sharing and sitemap links', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'leafing-well-test-'));
  try {
    await build({
      directory,
      config: { ...placeholder, siteUrl: 'https://preview.example.test', indexable: true },
    });
    const html = await readFile(path.join(directory, 'index.html'), 'utf8');
    assert.match(html, /rel="canonical" href="https:\/\/preview.example.test\/"/);
    assert.match(html, /property="og:image"/);
    assert.doesNotMatch(html, /noindex/);
    assert.match(
      await readFile(path.join(directory, 'sitemap.xml'), 'utf8'),
      /https:\/\/preview.example.test\/privacy\//,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
test('unsafe and incomplete configuration fails before build', () => {
  assert.throws(() => validateConfig({ ...placeholder, indexable: true }), /siteUrl/);
  assert.throws(() => validateConfig({ ...placeholder, siteUrl: 'http://example.test' }), /HTTPS/);
  assert.throws(
    () => validateConfig({ ...placeholder, siteUrl: 'https://example.test/path' }),
    /origin/,
  );
  assert.throws(
    () =>
      validateConfig({
        ...placeholder,
        formpop: { enabled: true, endpoint: 'javascript:void(0)' },
      }),
    /HTTPS/,
  );
  assert.throws(
    () =>
      validateConfig({
        ...placeholder,
        formpop: { enabled: true, endpoint: 'https://example.test/post' },
      }),
    /embed/,
  );
});
test('embed activation preserves generated fields and only changes the configured action', () => {
  const page = 'before<!-- FORMPOP_START -->disabled<!-- FORMPOP_END -->after';
  // A synthetic fixture tests substitution; it is not Formpop integration documentation.
  const embed =
    '<form method="post" action="{{FORMPOP_ENDPOINT}}"><input name="fixture-field"><input type="hidden" name="fixture-token" value="$&"></form>';
  const html = installEmbed(page, embed, 'https://example.test/post?a=1&b=2');
  assert.match(html, /action="https:\/\/example.test\/post\?a=1&amp;b=2"/);
  assert.match(html, /name="fixture-token" value="\$&"/);
  assert.doesNotMatch(html, /disabled/);
  assert.throws(
    () => installEmbed(page, '<form></form>', 'https://example.test'),
    /verified embed/,
  );
  assert.throws(
    () => installEmbed(page, '<form action="{{FORMPOP_ENDPOINT}}"></form>', 'https://example.test'),
    /POST/,
  );
});
