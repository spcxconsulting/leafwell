import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export function validateConfig(config) {
  if (typeof config.indexable !== 'boolean') throw new Error('indexable must be a boolean');
  if (config.siteUrl) {
    const url = new URL(config.siteUrl);
    if (
      url.protocol !== 'https:' ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      throw new Error('siteUrl must be a verified HTTPS origin');
    }
  }
  if (config.indexable && !config.siteUrl)
    throw new Error('An indexable site needs a verified siteUrl');
  if (config.formpop.enabled) {
    const endpoint = new URL(config.formpop.endpoint);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.hash) {
      throw new Error('Formpop endpoint must be a verified HTTPS URL');
    }
    if (!config.formpop.embedFile) throw new Error('Supply the generated Formpop HTML embed');
  }
  return config;
}
const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
export function installEmbed(html, embed, endpoint) {
  if (!embed.includes('{{FORMPOP_ENDPOINT}}'))
    throw new Error('Replace only the verified embed action URL with {{FORMPOP_ENDPOINT}}');
  const installed = embed.replaceAll('{{FORMPOP_ENDPOINT}}', escapeHtml(endpoint));
  if (!/<form\b[^>]*\bmethod\s*=\s*["']post["']/i.test(installed))
    throw new Error('A generated POST form is required');
  if (
    !installed.includes(`action="${escapeHtml(endpoint)}"`) &&
    !installed.includes(`action='${escapeHtml(endpoint)}'`)
  ) {
    throw new Error('The verified endpoint must be the form action');
  }
  return html.replace(/<!-- FORMPOP_START -->[\s\S]*?<!-- FORMPOP_END -->/, () => installed);
}
export async function build({ directory = path.join(root, 'dist'), config: supplied } = {}) {
  const config = validateConfig(
    supplied ?? JSON.parse(await readFile(path.join(root, 'config/site.json'), 'utf8')),
  );
  await mkdir(directory, { recursive: true });
  await cp(path.join(root, 'public'), directory, { recursive: true });
  for (const [file, route] of [
    ['index.html', '/'],
    ['privacy/index.html', '/privacy/'],
  ]) {
    let html = await readFile(path.join(directory, file), 'utf8');
    let metadata = config.indexable ? '' : '<meta name="robots" content="noindex, nofollow">';
    if (config.siteUrl) {
      const pageUrl = new URL(route, config.siteUrl).href;
      metadata += `<link rel="canonical" href="${escapeHtml(pageUrl)}"><meta property="og:url" content="${escapeHtml(pageUrl)}">`;
      if (route === '/') {
        metadata += `<meta property="og:image" content="${escapeHtml(new URL('/assets/images/gardening-together-1280.webp', config.siteUrl).href)}"><meta property="og:image:alt" content="Two women enjoying potting plants together">`;
      }
    }
    if (route === '/') {
      const organisation = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Leafing Well',
        slogan: 'A little gardening. A lot of good.',
        description:
          'A proposed South Australian not-for-profit and community wellbeing initiative in development, bringing people together through gardening.',
        areaServed: { '@type': 'State', name: 'South Australia' },
        ...(config.siteUrl ? { url: config.siteUrl } : {}),
      };
      metadata += `<script type="application/ld+json">${JSON.stringify(organisation).replaceAll('<', '\\u003c')}</script>`;
      if (config.formpop.enabled) {
        const embed = await readFile(path.resolve(root, config.formpop.embedFile), 'utf8');
        html = installEmbed(html, embed, config.formpop.endpoint);
      }
    }
    await writeFile(path.join(directory, file), html.replace('<!-- SITE_METADATA -->', metadata));
  }
  const urls = config.siteUrl
    ? ['/', '/privacy/']
        .map((route) => `<url><loc>${escapeHtml(new URL(route, config.siteUrl).href)}</loc></url>`)
        .join('')
    : '';
  await writeFile(
    path.join(directory, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`,
  );
  await writeFile(
    path.join(directory, 'robots.txt'),
    `User-agent: *\n${config.indexable ? 'Allow: /' : 'Disallow: /'}\n${config.siteUrl ? `Sitemap: ${new URL('/sitemap.xml', config.siteUrl).href}\n` : ''}`,
  );
  await writeFile(
    path.join(directory, '_headers'),
    `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  X-Frame-Options: SAMEORIGIN\n${config.indexable ? '' : '  X-Robots-Tag: noindex, nofollow\n'}\n/assets/*\n  Cache-Control: public, max-age=86400\n`,
  );
  return directory;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build();
  console.log(
    'Built Leafing Well static assets. Formpop configuration is read from config/site.json.',
  );
}
