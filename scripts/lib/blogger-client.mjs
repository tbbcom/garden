// Shared Blogger API v3 client for the drafts and audit scripts.
// Env: BLOGGER_CLIENT_ID, BLOGGER_CLIENT_SECRET, BLOGGER_REFRESH_TOKEN, BLOGGER_BLOG_ID
export const API = 'https://www.googleapis.com/blogger/v3';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function checkSecrets() {
  // Secrets pasted from a phone or the OAuth Playground often carry a trailing newline or spaces,
  // which Google rejects as an unknown client.
  for (const k of ['BLOGGER_CLIENT_ID', 'BLOGGER_CLIENT_SECRET', 'BLOGGER_REFRESH_TOKEN', 'BLOGGER_BLOG_ID']) {
    process.env[k] = (process.env[k] || '').trim();
    if (!process.env[k]) throw new Error(`Missing secret ${k}`);
  }
  if (!/\.apps\.googleusercontent\.com$/.test(process.env.BLOGGER_CLIENT_ID)) {
    throw new Error('BLOGGER_CLIENT_ID should end with ".apps.googleusercontent.com". Copy the Client ID (not the secret or project ID) from Google Cloud → Credentials.');
  }
  if (!/^\d+$/.test(process.env.BLOGGER_BLOG_ID)) {
    throw new Error('BLOGGER_BLOG_ID should be digits only (the number after blogID= in your Blogger dashboard URL).');
  }
  return `${API}/blogs/${encodeURIComponent(process.env.BLOGGER_BLOG_ID)}`;
}

export async function accessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.BLOGGER_CLIENT_ID,
      client_secret: process.env.BLOGGER_CLIENT_SECRET,
      refresh_token: process.env.BLOGGER_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const hints = {
      invalid_grant: ' — the refresh token expired, was revoked, or was made with a different Client ID. If the OAuth consent screen is still in "Testing", tokens die after 7 days: publish it to "In production" and generate a new token (docs/BLOGGER-AUTOPOST.md, steps 3 and 5).',
      invalid_client: ' — Google does not recognise the Client ID / Client secret pair. Re-copy both from Google Cloud → Credentials → your OAuth client into the GitHub secrets, and make sure the refresh token was generated in the OAuth Playground with "Use your own OAuth credentials" ticked using that same client (docs/BLOGGER-AUTOPOST.md, steps 4–5).',
      unauthorized_client: ' — the refresh token belongs to a different OAuth client. Generate a new one in the OAuth Playground with your own Client ID and secret (step 5).',
    };
    const hint = hints[data.error] || '';
    throw new Error(`Token refresh failed: ${data.error || res.status}${hint}`);
  }
  return data.access_token;
}

export async function api(token, method, url, body) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return res.json();
    const text = await res.text();
    // 429/5xx are transient; back off instead of hammering the API.
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(attempt * 15000);
      continue;
    }
    throw new Error(`${method} ${url.replace(/\?.*/, '')} → ${res.status}: ${text.slice(0, 300)}`);
  }
}
