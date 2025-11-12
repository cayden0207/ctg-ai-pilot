import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useMembership() {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'expired' | 'revoked' | 'unauthorized'>('unauthorized');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) { if (mounted) { setStatus('unauthorized'); setEmail(null); } return; }
        const resp = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) { if (mounted) setStatus('unauthorized'); return; }
        const me = await resp.json();
        if (mounted) {
          setEmail(me?.user?.email || null);
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

  return { email, status, loading, logout };
}

