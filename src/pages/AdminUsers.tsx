import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';

interface UserRow {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  expiration_at?: string | null;
  revoked_at?: string | null;
  last_login_at?: string | null;
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AdminUsers />
    </ProtectedRoute>
  );
}

function AdminUsers() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [expiration, setExpiration] = useState('');
  const [creating, setCreating] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const resp = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await resp.json();
      setRows(json?.users || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    setMagicLink(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const resp = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, name, expiration_at: expiration || null }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || '创建失败');
      setMagicLink(json?.magicLink || null);
      setEmail('');
      setName('');
      setExpiration('');
      fetchUsers();
    } catch (e: any) {
      alert(e?.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">用户管理</h1>
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid gap-3 sm:grid-cols-4">
          <input className="border px-3 py-2 rounded" placeholder="邮箱" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="border px-3 py-2 rounded" placeholder="姓名(可选)" value={name} onChange={(e)=>setName(e.target.value)} />
          <input className="border px-3 py-2 rounded" type="date" value={expiration} onChange={(e)=>setExpiration(e.target.value)} />
          <button onClick={handleCreate} disabled={creating} className="bg-purple-600 text-white rounded px-4 py-2 hover:bg-purple-700 disabled:opacity-60">{creating ? '创建中…' : '创建用户并生成Magic Link'}</button>
        </div>
        {magicLink && (
          <div className="text-sm text-gray-700 mt-3 break-all">
            Magic Link（复制发给用户）: <a className="text-purple-700 underline" href={magicLink} target="_blank" rel="noreferrer">{magicLink}</a>
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">邮箱</th>
              <th className="text-left p-3">姓名</th>
              <th className="text-left p-3">角色</th>
              <th className="text-left p-3">到期</th>
              <th className="text-left p-3">状态</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-3 text-gray-500">加载中…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="p-3 text-gray-500">暂无用户</td></tr>
            ) : rows.map(r => {
              const expired = r.expiration_at && new Date(r.expiration_at) < new Date();
              const revoked = !!r.revoked_at;
              const status = revoked ? 'Revoked' : (expired ? 'Expired' : 'Active');
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.name || '-'}</td>
                  <td className="p-3">{r.role || 'member'}</td>
                  <td className="p-3">{r.expiration_at ? new Date(r.expiration_at).toLocaleDateString() : '-'}</td>
                  <td className="p-3">{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

