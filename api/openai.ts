import { getAdminClient, verifyBearer } from './_lib/supabase.js';

async function retryFetch(input: any, init: any, attempts = 3) {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(input, init);
      if (res.status >= 500) {
        lastErr = new Error(`upstream ${res.status}`);
      } else {
        return res;
      }
    } catch (e: any) {
      lastErr = e;
    }
    const backoff = Math.min(1000, 150 * Math.pow(2, i)) + Math.floor(Math.random() * 100);
    await new Promise(r => setTimeout(r, backoff));
  }
  throw lastErr || new Error('upstream error');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Require active membership
    try {
      const ver = await verifyBearer(req);
      if (!ver.user) return res.status(401).json({ error: 'unauthorized' });
      const admin = getAdminClient();
      const { data: profile } = await admin
        .from('profiles')
        .select('expiration_at, revoked_at')
        .eq('user_id', ver.user.id)
        .single();
      const now = new Date();
      const expired = profile?.expiration_at ? new Date(profile.expiration_at) < now : true;
      const revoked = !!profile?.revoked_at;
      if (revoked || expired) return res.status(403).json({ error: 'membership_inactive' });
    } catch (e) {
      return res.status(500).json({ error: 'auth_check_failed' });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }

    const {
      model = 'gpt-4o-mini',
      messages = [],
      max_tokens = 800,
      temperature = 0.7,
      stream = false,
    } = req.body || {};

    const upstream = await retryFetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens, temperature, stream }),
    }, 3);

    const text = await upstream.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { /* keep text */ }

    if (!upstream.ok) {
      return res.status(upstream.status).send(data || text);
    }
    return res.status(200).send(data || text);
  } catch (err: any) {
    return res.status(500).json({ error: 'Proxy error', detail: String(err?.message || err || 'unknown') });
  }
}
