import { getUserAuthedClient, verifyBearer } from '../_lib/supabase.js';

export default async function handler(req: any, res: any) {
  try {
    const ver = await verifyBearer(req);
    if (!ver.user) return res.status(401).json({ error: 'unauthorized' });
    const user = ver.user;
    // Use user-authed anon client with RLS to read own profile (no service role required)
    const authed = getUserAuthedClient(ver.token as string);
    const { data: profile } = await authed
      .from('profiles')
      .select('user_id, email, name, role, expiration_at, revoked_at, last_login_at')
      .eq('user_id', user.id)
      .single();
    const now = new Date();
    const expired = profile?.expiration_at ? new Date(profile.expiration_at) < now : true; // default to expired if no expiration set
    const revoked = !!profile?.revoked_at;
    const status: 'active' | 'expired' | 'revoked' = revoked ? 'revoked' : (expired ? 'expired' : 'active');
    return res.status(200).json({ user: { id: user.id, email: user.email }, profile, status });
  } catch (e: any) {
    // Log for Vercel function console to aid debugging
    try { console.error('auth/me error:', e); } catch {}
    return res.status(500).json({ error: 'server_error', detail: String(e?.message || e) });
  }
}
