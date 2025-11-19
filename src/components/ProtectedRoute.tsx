import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

interface MeResponse {
  user: { id: string; email?: string | null } | null;
  profile?: { role?: string | null; expiration_at?: string | null; revoked_at?: string | null } | null;
  status: 'active' | 'expired' | 'revoked' | 'unauthorized';
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          if (mounted) setAllowed(false);
          return;
        }
        const resp = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          if (mounted) setAllowed(false);
          return;
        }
        const me: MeResponse = await resp.json();
        const isAdmin = me.profile?.role === 'admin';
        const active = me.status === 'active';
        if (requireAdmin) {
          if (mounted) setAllowed(active && isAdmin);
        } else {
          if (mounted) setAllowed(active);
        }
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => { mounted = false; };
  }, [requireAdmin]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        <div className="flex items-center gap-3">
          <LoadingSpinner size="md" />
          <span className="text-sm">正在验证登录状态...</span>
        </div>
      </div>
    );
  }
  if (!allowed) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}
