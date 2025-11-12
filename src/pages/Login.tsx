import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLocation } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation() as any;

  const handleSend = async () => {
    setError(null);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('请输入有效邮箱');
      return;
    }
    setSending(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (err) throw err;
      setSent(true);
    } catch (e: any) {
      setError(e?.message || '发送登录链接失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">登录</h1>
        <p className="text-gray-600 mb-4">输入邮箱，我们会发送一次性登录链接</p>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={sending || sent}
        />
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {sent ? (
          <div className="text-green-600 text-sm">登录链接已发送，请检查邮箱</div>
        ) : (
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 disabled:opacity-60"
          >
            {sending ? '发送中…' : '发送登录链接'}
          </button>
        )}
        {location?.state?.from?.pathname && (
          <div className="text-xs text-gray-400 mt-3">登录后将跳回 {location.state.from.pathname}</div>
        )}
      </div>
    </div>
  );
}

