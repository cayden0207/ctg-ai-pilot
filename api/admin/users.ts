import { getAdminClient, verifyBearer } from '../_lib/supabase';

export default async function handler(req: any, res: any) {
  try {
    const ver = await verifyBearer(req);
    if (!ver.user) return res.status(401).json({ error: 'unauthorized' });
    const admin = getAdminClient();
    // ensure admin role
    const { data: prof } = await admin.from('profiles').select('role').eq('user_id', ver.user.id).single();
    if (prof?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { data, error } = await admin
      .from('profiles')
      .select('user_id as id, email, name, role, expiration_at, revoked_at, last_login_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ users: data });
  } catch (e: any) {
    return res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
}

