import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const nav = useNavigate();
  const location = useLocation();
  const [msg, setMsg] = useState('正在登录…');

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const error_description = url.searchParams.get('error_description');
        if (error_description) throw new Error(error_description);

        if (code) {
          // OAuth / PKCE style callback with code
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          // Magic Link / Hash-token style callback
          const hash = window.location.hash || '';
          const sp = new URLSearchParams(hash.replace(/^#/, ''));
          const access_token = sp.get('access_token');
          const refresh_token = sp.get('refresh_token');
          if (!access_token || !refresh_token) {
            throw new Error('缺少 code 或 token');
          }
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        }

        setMsg('登录成功，正在跳转…');
        const back = sessionStorage.getItem('post_login_redirect');
        if (back) {
          sessionStorage.removeItem('post_login_redirect');
          nav(back, { replace: true });
        } else {
          nav('/ctg-mindset', { replace: true });
        }
      } catch (e: any) {
        setMsg(e?.message || '登录失败');
      }
    })();
  }, [nav, location]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">{msg}</div>
  );
}
