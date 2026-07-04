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

## Receiving email

Resend can receive mail for `osaf.ai` once the Resend MX record is added to DNS and a receiving webhook is configured.

Inbound webhook URL:

`https://www.osaf.ai/api/inbound?token=YOUR_INBOUND_WEBHOOK_TOKEN`

Additional environment variables:

- `INBOUND_WEBHOOK_TOKEN` — random shared token used in the webhook URL.
- `INBOUND_FORWARD_TO` — where inbound mail should be forwarded. Suggested: `david.keane@southerncrossai.com.au`.

If Resend's MX record is placed on the root `osaf.ai` domain, Resend will receive mail for any address at `@osaf.ai`.
