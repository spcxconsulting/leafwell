# Leafing Well

A welcoming pre-launch landing page for a proposed South Australian not-for-profit. **A little gardening. A lot of good.**

Built by adapting the supplied Academica Pro template: its Bootstrap grid, header/navigation, hero, program cards, about section, contact form card and colour variables. No frontend framework, runtime dependencies, Worker enquiry handler, database, queue, mail service or analytics. The Cloudflare Worker consists of static assets.

## Local development

Use Node.js 22.12 or newer, npm and Chrome (for browser tests).

```sh
npm ci
npm run dev
```

Open http://localhost:8787. HTML, CSS and JavaScript live in `public/`; edit those source files and rerun `npm run build` after edits. Wrangler reloads changes in `dist/`. The build copies the prepared responsive WebP images and creates crawler metadata. `dist/` is generated and ignored.

```sh
npm test          # configuration, metadata and embed activation tests
npm run lint     # JavaScript syntax and JSON checks
npm run test:ui  # local Wrangler + Chrome: mobile/tablet/desktop, axe, smoke tests
npm run check    # syntax, unit tests, build and Wrangler deployment dry run
```

Browser tests launch installed Chrome; change `channel` in `playwright.config.mjs` if using another installed Chromium browser. Screenshots are saved to `test-results/`. Tests never submit to Formpop; the default site has no external network requests. The local-only POST smoke test verifies that no enquiry API exists.

## Formpop: intentionally not connected

As requested, the enquiry form is a **disabled, clearly labelled placeholder**. It cannot accept or submit details. There is no endpoint, invented form identifier, provider field name, hidden field or CAPTCHA key. No success is simulated. User-facing controls have IDs for labels, but no submission names until the genuine generated integration is supplied.

See [docs/FORMPOP.md](docs/FORMPOP.md) for the exact setup checklist. Do not enable the form merely by removing `disabled`: install the verified Formpop embed, check its privacy arrangements and test delivery with an explicitly approved staging enquiry first.

Public configuration is in `config/site.json`. All configuration placed here is shipped to browsers as needed; never put credentials in it. `config/formpop-embed.html` is intentionally ignored so generated integration details can be supplied locally.

## Cloudflare Workers preview

`wrangler.jsonc` uses Cloudflare Workers Static Assets. Assets are served directly by Cloudflare; there is no Worker JavaScript backend to run or maintain. Only the built `dist/` directory is uploaded, so template demo pages and PHP forms are never served. There are no routes or custom domains. `workers_dev: false` keeps the normal Worker URL disabled; `preview_urls: true` enables URLs for uploaded versions.

No cloud resources have been deployed by this project setup. Authenticate Wrangler using your Cloudflare account when you are ready:

```sh
npx wrangler login
npm run check
npm run deploy:preview
```

`deploy:preview` runs `wrangler versions upload --preview-alias leafing-well`, which uploads a version without promoting it to production traffic. Cloudflare returns the actual preview URL; do not guess it. See [Cloudflare Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/). For this asset-only site there are no shared production database or storage bindings. If first-time version upload requires an existing Worker, create/initialise the preview Worker deliberately in your Cloudflare account before retrying; do not fall back to a production deployment automatically.

After the actual URL is known, put its HTTPS origin in `siteUrl` in `config/site.json`, leaving `indexable: false`, then rebuild/upload. This enables absolute Open Graph image/URL metadata, canonical links and a sitemap using a verified host. Until then the sitemap has no URL entries and no domain is invented. Previews emit `noindex` in HTML and response headers, plus `Disallow: /` in robots.txt. These are crawler controls, not access control; a preview URL can be visited by anyone who has it.

`npm run deploy` is provided for eventual deployment and promotes a version to the configured Worker. **Run it only with explicit production approval.** Do not add `leafingwell.org` routes or DNS until ownership is confirmed. At launch, confirm the legal/operator name and privacy contact, Formpop delivery and provider arrangements, image rights and template licence entitlement; set the verified public `siteUrl`, enable indexing, and obtain deployment approval. No GitHub Actions or CI workflows are included.

## Content and privacy

The site describes an initiative in development, with expressions of interest rather than confirmed availability. It makes no claims of registration, funding eligibility, qualifications, partnerships or clinical treatment. The [privacy page](public/privacy/index.html) states that the form is disabled and describes the intended collection once connected. Confirm the responsible operator, direct privacy contact, provider locations and retention arrangements before collection starts; update the policy to match the real settings.

## Template and asset provenance

The original `template/` directory is preserved locally and ignored in Git because it contains a commercial template and unrelated PHP processing scripts. It is not required for building: the relevant adapted CSS and Bootstrap assets are included in `public/`. Academica CSS is reduced from the supplied stylesheet to the sections used here; `leafing-well.css` supplies the visual and accessibility adaptations. The original JavaScript was adapted into a small accessible navigation script; unused carousel, animation, counter, icon-font and PHP-form dependencies are omitted.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for licences and photograph credits. The supplied archive points to the vendor licence but contains no purchase receipt. Keep your licence evidence privately; the original commercial archive must not be committed to this public repository.

## Repository workflow

The remote repository was empty when work began, with no `main` branch. A minimal `chore/repository-baseline` branch provides a review base for the feature PR without a direct push to `main`. Do not merge without explicit instruction. All supplied template files remain unchanged in the local checkout.
