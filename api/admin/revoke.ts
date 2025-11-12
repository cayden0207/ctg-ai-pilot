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
    const { data: prof } = await admin.from('profiles').select('role').eq('user_id', ver.user.id).single();
    if (prof?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

    const { user_id } = req.body || {};
    if (!user_id) return res.status(422).json({ error: 'user_id_required' });
    const { error } = await admin
      .from('profiles')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', user_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
}
