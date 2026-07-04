export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.resend_api_key;
  const toEmail = process.env.OSAF_APPLICATION_TO || 'contact@osaf.ai';
  const fromEmail = process.env.OSAF_APPLICATION_FROM || 'OSAF Secretariat <applications@osaf.ai>';

  if (!apiKey) {
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  const data = req.body || {};
  const organisation = clean(data.organisation);
  const name = clean(data.name);
  const email = clean(data.email);
  const region = clean(data.region);
  const type = clean(data.type);
  const interest = clean(data.interest, 3000);

  if (!organisation || !name || !email || !region || !type) {
    return res.status(400).json({ error: 'Please complete all required fields.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const subject = `OSAF membership expression of interest — ${organisation}`;
  const text = [
    'New OSAF membership expression of interest',
    '',
    `Organisation: ${organisation}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Country / region: ${region}`,
    `Organisation type: ${type}`,
    '',
    'Interest in OSAF:',
    interest || '(not provided)',
    '',
    'Next step: send the formal OSAF membership application pack.'
  ].join('\n');

  const html = `
    <h2>New OSAF membership expression of interest</h2>
    <p><strong>Organisation:</strong> ${escapeHtml(organisation)}</p>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
    <p><strong>Country / region:</strong> ${escapeHtml(region)}</p>
    <p><strong>Organisation type:</strong> ${escapeHtml(type)}</p>
    <h3>Interest in OSAF</h3>
    <p>${escapeHtml(interest || '(not provided)').replace(/\n/g, '<br>')}</p>
    <hr>
    <p><strong>Next step:</strong> send the formal OSAF membership application pack.</p>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject,
      text,
      html
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Resend error', result);
    return res.status(502).json({ error: 'Could not send your application. Please email contact@osaf.ai directly.' });
  }

  return res.status(200).json({ ok: true });
}

function clean(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
