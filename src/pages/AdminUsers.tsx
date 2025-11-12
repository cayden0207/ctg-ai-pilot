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
  const [months, setMonths] = useState<number>(12);
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
      // 计算到期时间：从当前时间起 months 个月，设为当天 23:59:59.999（UTC）
      let expiration_at: string | null = null;
      if (months && months > 0) {
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        d.setHours(23, 59, 59, 999);
        expiration_at = d.toISOString();
      }
      const resp = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, name, expiration_at }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || '创建失败');
      setMagicLink(json?.magicLink || null);
      setEmail('');
      setName('');
      setMonths(12);
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
          <select
            className="border px-3 py-2 rounded"
            value={months}
            onChange={(e)=>setMonths(Number(e.target.value) || 1)}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>会员期限：{m} 个月</option>
            ))}
          </select>
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
              <th className="text-left p-3">操作</th>
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
              const renew = async (days?: number) => {
                try {
                  const { data } = await supabase.auth.getSession();
                  const token = data.session?.access_token;
                  const body: any = { user_id: r.id };
                  if (typeof days === 'number') body.days = days;
                  const resp = await fetch('/api/admin/renew', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(body)
                  });
                  if (!resp.ok) throw new Error(await resp.text());
                  fetchUsers();
                } catch (e: any) { alert(e?.message || '续期失败'); }
              };
              const renewToDate = async () => {
                const date = prompt('设置到期日 (YYYY-MM-DD)');
                if (!date) return;
                try {
                  const { data } = await supabase.auth.getSession();
                  const token = data.session?.access_token;
                  const resp = await fetch('/api/admin/renew', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ user_id: r.id, expiration_at: date })
                  });
                  if (!resp.ok) throw new Error(await resp.text());
                  fetchUsers();
                } catch (e: any) { alert(e?.message || '续期失败'); }
              };
              const revoke = async () => {
                if (!confirm('确认撤销此用户的访问权限？')) return;
                try {
                  const { data } = await supabase.auth.getSession();
                  const token = data.session?.access_token;
                  const resp = await fetch('/api/admin/revoke', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ user_id: r.id })
                  });
                  if (!resp.ok) throw new Error(await resp.text());
                  fetchUsers();
                } catch (e: any) { alert(e?.message || '撤销失败'); }
              };
              const restore = async () => {
                try {
                  const { data } = await supabase.auth.getSession();
                  const token = data.session?.access_token;
                  const resp = await fetch('/api/admin/restore', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ user_id: r.id })
                  });
                  if (!resp.ok) throw new Error(await resp.text());
                  fetchUsers();
                } catch (e: any) { alert(e?.message || '恢复失败'); }
              };
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.name || '-'}</td>
                  <td className="p-3">{r.role || 'member'}</td>
                  <td className="p-3">{r.expiration_at ? new Date(r.expiration_at).toLocaleDateString() : '-'}</td>
                  <td className="p-3">{status}</td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => renew(30)} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100">+30天</button>
                    <button onClick={renewToDate} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100">设日期</button>
                    {!revoked ? (
                      <button onClick={revoke} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">撤销</button>
                    ) : (
                      <button onClick={restore} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">恢复</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
