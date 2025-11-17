import { getAdminClient, verifyBearer } from '../_lib/supabase.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const ver = await verifyBearer(req);
    if (!ver.user) return res.status(401).json({ error: 'unauthorized' });
    const admin = getAdminClient();

    // ensure caller is admin
    const { data: me } = await admin
      .from('profiles')
      .select('role')
      .eq('user_id', ver.user.id)
      .single();
    if (me?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

    const { user_id, email, name, role } = req.body || {};
    if (!user_id) return res.status(422).json({ error: 'user_id_required' });

    // Load existing profile for comparison
    const { data: profile, error: profErr } = await admin
      .from('profiles')
      .select('email, name, role')
      .eq('user_id', user_id)
      .single();
    if (profErr) return res.status(500).json({ error: profErr.message });

    const patch: any = {};
    if (typeof name === 'string') patch.name = name || null;
    if (role === 'admin' || role === 'member') patch.role = role;

    // Handle email change: update auth user + profile.email together
    let finalEmail = profile?.email || null;
    if (typeof email === 'string' && email && email !== profile?.email) {
      const { error: updErr } = await admin.auth.admin.updateUserById(user_id, { email });
      if (updErr) return res.status(400).json({ error: updErr.message || 'update_auth_failed' });
      patch.email = email;
      finalEmail = email;
    }

    if (Object.keys(patch).length > 0) {
      const { error: upErr } = await admin
        .from('profiles')
        .update(patch)
        .eq('user_id', user_id);
      if (upErr) return res.status(500).json({ error: upErr.message });
    }

    return res.status(200).json({ ok: true, email: finalEmail, role: patch.role ?? profile?.role, name: patch.name ?? profile?.name });
  } catch (e: any) {
    return res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
}

