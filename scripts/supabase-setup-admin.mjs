import { createClient } from '@supabase/supabase-js';

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.ADMIN;
  const EXPIRATION = process.env.ADMIN_EXPIRATION || '2030-12-31T00:00:00Z';
  const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
  if (!ADMIN_EMAIL) throw new Error('ADMIN_EMAIL missing');

  const client = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Ensure user exists and get magic link (safe for both new/existing users)
  const { data: linkData, error: linkErr } = await client.auth.admin.generateLink({
    type: 'magiclink',
    email: ADMIN_EMAIL,
    options: { redirectTo: `${PUBLIC_BASE_URL}/auth/callback` },
  });
  if (linkErr) throw linkErr;
  const userId = linkData?.user?.id;
  const magicLink = linkData && linkData.properties && linkData.properties.action_link;
  if (!userId) throw new Error('Failed to create/find user for admin');

  // Upsert profile as admin
  const { error: upErr } = await client
    .from('profiles')
    .upsert({
      user_id: userId,
      email: ADMIN_EMAIL,
      name: 'Admin',
      role: 'admin',
      expiration_at: new Date(EXPIRATION).toISOString(),
      revoked_at: null,
    }, { onConflict: 'user_id' });
  if (upErr) throw upErr;

  console.log(JSON.stringify({ ok: true, userId, magicLink }, null, 2));
}

main().catch((e) => {
  console.error('setup-admin error:', e?.message || e);
  process.exit(1);
});

