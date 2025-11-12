import { getAdminClient, verifyBearer } from './_lib/supabase';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // AuthZ: require active membership
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
      // Allow both explicit prompt object and a shorthand promptId
      prompt,
      promptId,
      input,
      messages,
      model: modelFromReq,
    } = req.body || {};

    // Choose a safe default model if none provided or obviously invalid
    const envModel = process.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
    const fallbackModel = 'gpt-4o-mini';
    const chosen = (modelFromReq || envModel || '').toString();
    const model = !chosen || /gpt-5|invalid|kp/i.test(chosen) ? fallbackModel : chosen;

    const body: any = {};
    if (prompt || promptId) body.prompt = prompt || { id: String(promptId) };
    // The Responses API does NOT accept top-level `messages`.
    // If `messages` is provided, forward it as `input`.
    if (input !== undefined) body.input = input;
    else if (messages !== undefined) body.input = messages;
    // If a Prompt is provided, don't override with a model
    if (!body.prompt) body.model = model;

    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

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
