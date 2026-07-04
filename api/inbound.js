export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookToken = process.env.INBOUND_WEBHOOK_TOKEN;
  if (!webhookToken) {
    return res.status(500).json({ error: 'Inbound webhook token is not configured.' });
  }

  if (req.query.token !== webhookToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.resend_api_key;
  const forwardTo = process.env.INBOUND_FORWARD_TO || process.env.OSAF_APPLICATION_TO || 'david.keane@southerncrossai.com.au';
  const fromEmail = process.env.OSAF_APPLICATION_FROM || 'OSAF Secretariat <applications@osaf.ai>';

  if (!apiKey) {
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  const event = req.body || {};
  const type = event.type || event.event || '';
  const data = event.data || event.email || event;

  if (type && type !== 'email.received') {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const originalFrom = getAddress(data.from) || 'unknown sender';
  const originalTo = listAddresses(data.to).join(', ') || 'unknown recipient';
  const originalSubject = clean(data.subject || '(no subject)', 300);
  const textBody = clean(data.text || data.text_body || data.plain || '', 20000);
  const htmlBody = data.html || data.html_body || '';
  const receivedAt = data.created_at || data.received_at || new Date().toISOString();

  const subject = `[OSAF inbound] ${originalSubject}`;
  const text = [
    `Inbound email received for OSAF`,
    `From: ${originalFrom}`,
    `To: ${originalTo}`,
    `Received: ${receivedAt}`,
    `Subject: ${originalSubject}`,
    '',
    '--- Message ---',
    textBody || stripHtml(htmlBody) || '(No text body provided)'
  ].join('\n');

  const html = `
    <h2>Inbound email received for OSAF</h2>
    <p><strong>From:</strong> ${escapeHtml(originalFrom)}</p>
    <p><strong>To:</strong> ${escapeHtml(originalTo)}</p>
    <p><strong>Received:</strong> ${escapeHtml(receivedAt)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(originalSubject)}</p>
    <hr>
    ${htmlBody ? `<div>${sanitizeBasicHtml(htmlBody)}</div>` : `<pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(textBody || '(No text body provided)')}</pre>`}
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [forwardTo],
      reply_to: originalFrom.includes('@') ? originalFrom : undefined,
      subject,
      text,
      html
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Inbound forward error', result);
    return res.status(502).json({ error: 'Could not forward inbound email.' });
  }

  return res.status(200).json({ ok: true });
}

function clean(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function getAddress(value) {
  if (!value) return '';
  if (typeof value === 'string') return clean(value, 300);
  if (value.email) return clean(value.email, 300);
  if (value.address) return clean(value.address, 300);
  if (Array.isArray(value)) return getAddress(value[0]);
  return clean(JSON.stringify(value), 300);
}

function listAddresses(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(getAddress).filter(Boolean);
  return [getAddress(value)].filter(Boolean);
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeBasicHtml(value) {
  // Resend already parses inbound email; this strips script/style blocks before forwarding.
  return String(value || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
