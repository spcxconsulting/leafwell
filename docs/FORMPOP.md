# Connecting the real Formpop enquiry form

Current status: **placeholder only, deliberately disabled**, per the owner's instruction. Delivery and provider success/error behaviour cannot be validated until a genuine embed is supplied. No test enquiries have been sent.

## What to supply from Formpop

Create/publish the Leafing Well form in the correct workspace and provide its generated HTML integration from the Install screen. It must include:

- The exact HTTPS POST action URL.
- Exact generated `name` attributes for full name, email, optional phone, enquiry type, optional organisation, message and required privacy acknowledgement.
- All generated hidden inputs and any required provider attributes.
- Generated Formpop script/style tags, spam protection and Turnstile instructions, including the correct public site key if the generated integration uses one. Never supply secret verification keys.
- Provider-supported acceptance, success and validation/error behaviour. Prefer the provider's inline confirmation, or its hosted confirmation; do not add a generic local thank-you page that anyone can visit as proof of delivery.
- The website origin allowed for the form and the hostname allowed by its Turnstile configuration, if applicable.

The enquiry type choices are Individual gardening visit; Community gardening group; Workplace wellbeing workshop; School or organisation program; Partnership or sponsorship; General enquiry. Keep the privacy notice link and required acknowledgement. Do not add health questions, uploads, payment fields or marketing subscriptions.

## Generated HTML POST integration

1. Copy the **complete verified generated integration** into `config/formpop-embed.html` (ignored in Git). Add the wrapper classes used by Academica (`form-control`, `form-select`, `btn-send`, `row`, `col-*`) where the generated instructions permit styling, preserving all provider attributes, names, hidden fields, validation and scripts.
2. Replace only the literal generated form action URL with the local build token `{{FORMPOP_ENDPOINT}}`. This token belongs to this site's build system, not Formpop.
3. Put the real action URL in `formpop.endpoint` in `config/site.json`; leave `enabled: false` until the embed and policy are reviewed. No provider hostname or endpoint pattern is assumed, because Formpop can be hosted by its owner.
4. Set `formpop.enabled: true` and rebuild. The build requires an HTTPS URL, the local endpoint token, and a POST form, then replaces the complete placeholder slot. Missing or incomplete configuration fails the build. These checks are setup checks, not submission validation.
5. Keep Formpop's generated response handling. A plain POST can navigate to Formpop's response; if its generated integration uses JavaScript, keep that generated script and its error/Turnstile handling. Do not implement another submission fetch, proxy, token verification, spam detection, database or mail pipeline here.

The integration replaces the entire `FORMPOP_START` / `FORMPOP_END` region inside `#formpop-slot`. The default native card styling applies to `.form-control` and `.btn-send`; native Formpop DOM also has limited scoped typography/control overrides under `.form-card .formpop-embed`. Verify the actual generated DOM when installing; no CSS can guarantee compatibility with an unseen embed.

## Existing native embed documentation

Read-only inspection of the adjacent `formpop.work/docs/NATIVE_EMBEDS.md` found that its Install screen can also generate a native loader (`data-formpop`), supports `data-formpop-theme="inherit"`, owns Turnstile and renders server-confirmed inline success/errors. Its per-form allowed origin and environment Turnstile hostname must include the website. The older adjacent `formpop/README.md` describes a different same-origin renderer. Neither source provides a published Leafing Well form or verifies the running deployment's contract. Do not transplant example form identifiers or use the older same-origin proxy approach.

If the live Install screen provides a native loader rather than an HTML POST form, preserve that generated integration and replace the slot directly in `public/index.html`; keep `formpop.enabled: false` so the HTML POST build path is unused. Install only the real snippet, using the supported inherit theme. The native loader owns field generation, processing, errors and inline success; no guessed POST action is necessary. This is a separate supported integration shape, not an interchangeable HTML POST endpoint. Review/update browser tests at activation to reflect actual fields and intercept all outbound submission requests until a real staging test is approved.

## Before opening enquiries

Confirm a working privacy contact, who is responsible for information, retention arrangements, actual providers/processing locations, and the published privacy wording. Configure recipient notifications in Formpop, never here. Add the exact preview origin and Turnstile hostname according to the live generated instructions; each changed preview hostname may need updating.

First run layout, labels, validation, form-load failures and provider-error tests with intercepted requests or provider-supported staging tools. With explicit approval, send a clearly marked synthetic staging enquiry and confirm the actual record in Formpop and email notification delivery. A button click or UI success alone is not delivery evidence. Verify required fields and consent, CAPTCHA failure/retry, network failure and repeat submissions. Do not log field values or send them to analytics. Never put a real person's enquiry into a test.
