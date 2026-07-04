# OSAF Website

Static launch site for the Open Sovereign AI Federation, with a serverless Resend-powered membership expression-of-interest form.

## Files

- `index.html` — landing page and application form
- `press-release.html` — launch press release page
- `charter.html` — OSAF charter page
- `api/apply.js` — serverless email endpoint for Vercel-compatible hosting
- `CNAME` — custom domain for `osaf.ai`
- `assets/` — logo and hero image assets

## Hosting

GitHub is the source repository. To send email securely, deploy the repo to a host that supports serverless functions, such as Vercel.

Required environment variables:

- `RESEND_API_KEY` — Resend API key. Do not commit this value.
- `OSAF_APPLICATION_TO` — recipient address. Defaults to `contact@osaf.ai`.
- `OSAF_APPLICATION_FROM` — sender address. Defaults to `OSAF Secretariat <applications@osaf.ai>`.

The form posts to `/api/apply`, which sends the expression of interest to the Secretariat via Resend.
