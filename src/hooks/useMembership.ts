import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useMembership() {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'expired' | 'revoked' | 'unauthorized'>('unauthorized');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'member' | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) { if (mounted) { setStatus('unauthorized'); setEmail(null); setRole(null); } return; }
        const resp = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) { if (mounted) { setStatus('unauthorized'); setRole(null); } return; }
        const me = await resp.json();
        if (mounted) {
          setEmail(me?.user?.email || null);
          const roleFromProfile = (me?.profile?.role || null) as 'admin' | 'member' | null;
          setRole(roleFromProfile);
          setStatus(me?.status || 'unauthorized');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const isAdmin = role === 'admin';

  return { email, status, role, isAdmin, loading, logout };
}
