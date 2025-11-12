import { createClient } from '@supabase/supabase-js';

export function getAdminClient() {
  const url = process.env.SUPABASE_URL as string | undefined;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!url || !serviceKey) throw new Error('Supabase admin env not configured');
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export function getAnonServerClient() {
  const url = process.env.SUPABASE_URL as string | undefined;
  const anon = process.env.SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anon) throw new Error('Supabase anon env not configured');
  return createClient(url, anon, { auth: { persistSession: false } });
}

export async function verifyBearer(req: any) {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return { user: null, error: 'missing_token' } as const;
  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return { user: null, error: 'invalid_token' } as const;
  return { user: data.user, error: null } as const;
}

