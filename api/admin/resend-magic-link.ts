import { getAdminClient, getAnonServerClient, verifyBearer } from '../_lib/supabase.js';

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

    const { user_id } = req.body || {};
    if (!user_id) return res.status(422).json({ error: 'user_id_required' });

    const { data: profile, error: profErr } = await admin
      .from('profiles')
      .select('email')
      .eq('user_id', user_id)
      .single();
    if (profErr) return res.status(500).json({ error: profErr.message });
    if (!profile?.email) return res.status(422).json({ error: 'email_missing' });

    const redirectTo = `${process.env.PUBLIC_BASE_URL || ''}/auth/callback` || undefined;

    // Generate fresh magic link for manual sending / debug
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
      options: { redirectTo },
    } as any);
    if (linkErr) return res.status(500).json({ error: linkErr.message });

    const magicLink = (linkData as any)?.properties?.action_link || null;

    // Best-effort: trigger sign-in email using anon client. Failure does not abort.
    let sentEmail = false;
    try {
      const anon = getAnonServerClient();
      const { error: mailErr } = await anon.auth.signInWithOtp({
        email: profile.email,
        options: { emailRedirectTo: redirectTo, shouldCreateUser: false },
      } as any);
      if (!mailErr) sentEmail = true;
    } catch {}

    return res.status(200).json({ ok: true, magicLink, sentEmail });
  } catch (e: any) {
    return res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
}

