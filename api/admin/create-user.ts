import { getAdminClient, verifyBearer } from '../_lib/supabase';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const ver = await verifyBearer(req);
    if (!ver.user) return res.status(401).json({ error: 'unauthorized' });
    const admin = getAdminClient();
    const { data: prof } = await admin.from('profiles').select('role').eq('user_id', ver.user.id).single();
    if (prof?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

    const { email, name, expiration_at } = req.body || {};
    if (!email) return res.status(422).json({ error: 'email_required' });

    // Create or fetch user, and generate magic link
    const redirectTo = `${process.env.PUBLIC_BASE_URL || ''}/auth/callback` || undefined;
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    } as any);
    if (linkErr) return res.status(500).json({ error: linkErr.message });

    const userId = linkData?.user?.id;
    const magicLink = (linkData as any)?.properties?.action_link || null;

    if (!userId) return res.status(500).json({ error: 'user_creation_failed' });

    // Upsert profile
    const { error: upErr } = await admin.from('profiles').upsert({
      user_id: userId,
      email,
      name: name || null,
      role: 'member',
      expiration_at: expiration_at ? new Date(expiration_at).toISOString() : null,
      revoked_at: null,
    }, { onConflict: 'user_id' });
    if (upErr) return res.status(500).json({ error: upErr.message });

    return res.status(200).json({ ok: true, userId, magicLink });
  } catch (e: any) {
    return res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
}

