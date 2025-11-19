import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useLocation } from 'react-router-dom';
import { Zap, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation() as any;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('请输入有效的电子邮箱地址');
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
      setError(e?.message || '发送登录链接失败，请稍后重试');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gray-50">
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-200/30 blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-200/30 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary-600 rounded-xl shadow-glow mb-4">
            <Zap className="w-8 h-8 text-white" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">CTG AI-PILOT</h1>
          <p className="text-gray-500 mt-2 text-sm">企业级爆款短视频内容生成引擎</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
          {!sent ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">欢迎回来</h2>
                <p className="text-sm text-gray-500 mt-1">请输入您的工作邮箱以继续</p>
              </div>

              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1.5">
                    电子邮箱
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-modern pl-10"
                      disabled={sending}
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 text-rose-700 rounded-lg text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full btn btn-primary group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {sending ? '发送中...' : '发送登录链接'}
                    {!sending && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
                  </span>
                </button>
              </form>

              {location?.state?.from?.pathname && (
                 <p className="text-xs text-center text-gray-400 mt-6">
                   登录后将自动跳转至之前的页面
                 </p>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-subtle">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">请检查您的邮箱</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                我们已向 <span className="font-medium text-gray-900">{email}</span> 发送了登录链接。<br/>
                请点击邮件中的链接完成登录。
              </p>
              <button 
                onClick={() => setSent(false)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                更换邮箱地址
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-400">
            © 2025 CTG AI-PILOT. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}