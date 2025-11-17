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
  const [sentEmail, setSentEmail] = useState<boolean | null>(null);

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
      setSentEmail(!!json?.sentEmail);
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
        {(magicLink || sentEmail !== null) && (
          <div className="text-sm text-gray-700 mt-3 break-all">
            {sentEmail ? (
              <span className="text-green-700">登录邮件已发送至 {email || '该用户邮箱'}。</span>
            ) : sentEmail === false ? (
              <span className="text-yellow-700">邮件发送未确认，请手动复制 Magic Link 发给用户。</span>
            ) : null}
            {magicLink && (
              <>
                <br />
                Magic Link（复制发给用户）: <a className="text-purple-700 underline" href={magicLink} target="_blank" rel="noreferrer">{magicLink}</a>
              </>
            )}
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
              const roleLabel = r.role === 'admin' ? 'Admin' : 'Member';
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
              const updateUser = async (payload: any) => {
                try {
                  const { data } = await supabase.auth.getSession();
                  const token = data.session?.access_token;
                  const resp = await fetch('/api/admin/update-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ user_id: r.id, ...payload }),
                  });
                  const json = await resp.json().catch(() => ({}));
                  if (!resp.ok) throw new Error(json?.error || '更新失败');
                  fetchUsers();
                } catch (e: any) { alert(e?.message || '更新失败'); }
              };
              const editUser = async () => {
                const newEmail = window.prompt('修改邮箱（留空则不变）', r.email || '');
                const newName = window.prompt('修改姓名（留空则不变）', r.name || '');
                const payload: any = {};
                if (newEmail && newEmail !== r.email) payload.email = newEmail;
                if (newName !== null && newName !== r.name) payload.name = newName;
                if (Object.keys(payload).length === 0) return;
                await updateUser(payload);
              };
              const toggleRole = async () => {
                const nextRole = r.role === 'admin' ? 'member' : 'admin';
                if (!window.confirm(`确认将该用户设为 ${nextRole === 'admin' ? '管理员' : '普通会员'}？`)) return;
                await updateUser({ role: nextRole });
              };
              const resendMagic = async () => {
                try {
                  const { data } = await supabase.auth.getSession();
                  const token = data.session?.access_token;
                  const resp = await fetch('/api/admin/resend-magic-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ user_id: r.id }),
                  });
                  const json = await resp.json().catch(() => ({}));
                  if (!resp.ok) throw new Error(json?.error || '重发失败');
                  const msg = json?.sentEmail
                    ? '登录邮件已重新发送给用户。'
                    : '已生成新的 Magic Link，请手动发送给用户。';
                  if (json?.magicLink) {
                    alert(`${msg}\n\nMagic Link: ${json.magicLink}`);
                  } else {
                    alert(msg);
                  }
                } catch (e: any) { alert(e?.message || '重发失败'); }
              };
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.name || '-'}</td>
                  <td className="p-3">{roleLabel}</td>
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
                    <button onClick={editUser} className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded hover:bg-gray-100">编辑</button>
                    <button onClick={toggleRole} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">
                      {r.role === 'admin' ? '降为Member' : '设为Admin'}
                    </button>
                    <button onClick={resendMagic} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded hover:bg-orange-100">重发邮件</button>
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
