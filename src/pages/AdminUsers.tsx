import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { supabase } from '../lib/supabaseClient';
import { cn } from '../utils/cn';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface UserRow {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  expiration_at?: string | null;
  revoked_at?: string | null;
  last_login_at?: string | null;
}

interface Toast {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
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
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'member'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'revoked'>('all');
  const [sortKey, setSortKey] = useState<'email' | 'expiration' | 'status' | 'lastLogin'>('expiration');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'member'>('member');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [moreOpenId, setMoreOpenId] = useState<string | null>(null);

  const showToast = (type: Toast['type'], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const resp = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await resp.json();
      if (!resp.ok) {
        showToast('error', json?.error || '加载用户失败');
        setRows([]);
      } else {
        setRows(json?.users || []);
      }
      setSelectedIds([]);
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
      showToast('success', `已创建会员：${email}`);
      setEmail('');
      setName('');
      setMonths(12);
      fetchUsers();
    } catch (e: any) {
      showToast('error', e?.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const updateUser = async (userId: string, payload: any) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const resp = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, ...payload }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || '更新失败');
      showToast('success', '用户资料已更新');
      await fetchUsers();
    } catch (e: any) {
      showToast('error', e?.message || '更新失败');
      throw e;
    }
  };

  const runBulk = async (action: 'renew30' | 'revoke' | 'restore') => {
    if (!selectedIds.length) {
      alert('请先勾选要操作的用户');
      return;
    }
    if (action === 'revoke' && !window.confirm(`确认撤销 ${selectedIds.length} 个用户的访问权限？`)) return;
    if (action === 'restore' && !window.confirm(`确认恢复 ${selectedIds.length} 个用户的访问权限？`)) return;
    setBulkBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const errs: string[] = [];
      for (const id of selectedIds) {
        try {
          if (action === 'renew30') {
            const resp = await fetch('/api/admin/renew', {
              method: 'POST', headers, body: JSON.stringify({ user_id: id, days: 30 }),
            });
            if (!resp.ok) errs.push(await resp.text());
          } else if (action === 'revoke') {
            const resp = await fetch('/api/admin/revoke', {
              method: 'POST', headers, body: JSON.stringify({ user_id: id }),
            });
            if (!resp.ok) errs.push(await resp.text());
          } else if (action === 'restore') {
            const resp = await fetch('/api/admin/restore', {
              method: 'POST', headers, body: JSON.stringify({ user_id: id }),
            });
            if (!resp.ok) errs.push(await resp.text());
          }
        } catch (e: any) {
          errs.push(String(e?.message || e));
        }
      }
      if (errs.length) {
        showToast('error', `部分操作失败：${errs[0]}`);
      } else {
        showToast('success', '批量操作已完成');
      }
      setSelectedIds([]);
      await fetchUsers();
    } finally {
      setBulkBusy(false);
    }
  };

  const computeStatus = (row: UserRow) => {
    const expired = row.expiration_at && new Date(row.expiration_at) < new Date();
    const revoked = !!row.revoked_at;
    return revoked ? 'revoked' : expired ? 'expired' : 'active';
  };

  const filteredAndSorted = rows
    .filter((r) => {
      const term = search.trim().toLowerCase();
      if (term) {
        const inEmail = r.email?.toLowerCase().includes(term);
        const inName = (r.name || '').toLowerCase().includes(term);
        if (!inEmail && !inName) return false;
      }
      if (filterRole !== 'all') {
        const roleNorm = (r.role || 'member') as 'admin' | 'member';
        if (roleNorm !== filterRole) return false;
      }
      if (filterStatus !== 'all') {
        if (computeStatus(r) !== filterStatus) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'email') {
        return (a.email || '').localeCompare(b.email || '') * dir;
      }
      if (sortKey === 'expiration') {
        const da = a.expiration_at ? new Date(a.expiration_at).getTime() : 0;
        const db = b.expiration_at ? new Date(b.expiration_at).getTime() : 0;
        return (da - db) * dir;
      }
      if (sortKey === 'status') {
        const sa = computeStatus(a);
        const sb = computeStatus(b);
        return sa.localeCompare(sb) * dir;
      }
      if (sortKey === 'lastLogin') {
        const da = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
        const db = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
        return (da - db) * dir;
      }
      return 0;
    });

  const toggleSort = (key: 'email' | 'expiration' | 'status' | 'lastLogin') => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortLabel = (key: 'email' | 'expiration' | 'status' | 'lastLogin') => {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="p-6 space-y-4">
      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                'px-4 py-2 rounded-lg shadow text-sm flex items-center gap-2 max-w-xs',
                t.type === 'success' && 'bg-green-50 text-green-800 border border-green-100',
                t.type === 'error' && 'bg-red-50 text-red-800 border border-red-100',
                t.type === 'info' && 'bg-gray-50 text-gray-800 border border-gray-200',
              )}
            >
              <span className="text-xs">
                {t.type === 'success' ? '✓' : t.type === 'error' ? '⚠' : 'ℹ'}
              </span>
              <span className="flex-1 break-words">{t.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1" /> Active
          </span>
          <span className="inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1" /> Expired
          </span>
          <span className="inline-flex items-center">
            <span className="w-2 h-2 rounded-full bg-red-500 mr-1" /> Revoked
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-2">
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
          <div className="mt-3 space-y-1 text-sm">
            {sentEmail ? (
              <div className="px-3 py-2 rounded bg-green-50 text-green-700">登录邮件已发送至 {email || '该用户邮箱'}。</div>
            ) : sentEmail === false ? (
              <div className="px-3 py-2 rounded bg-yellow-50 text-yellow-700">邮件发送未确认，请手动复制 Magic Link 发给用户。</div>
            ) : null}
            {magicLink && (
              <div className="px-3 py-2 rounded bg-purple-50 text-purple-800 break-all">
                Magic Link：
                <a className="ml-1 underline" href={magicLink} target="_blank" rel="noreferrer">{magicLink}</a>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="border px-3 py-2 rounded w-full sm:w-64"
          placeholder="搜索邮箱或姓名"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 text-sm items-center">
          <select
            className="border px-2 py-1 rounded"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
          >
            <option value="all">全部角色</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>
          <select
            className="border px-2 py-1 rounded"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">全部状态</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
          <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => runBulk('renew30')}
                      disabled={bulkBusy || selectedIds.length === 0}
                      className="px-2 py-1 text-xs rounded border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 disabled:opacity-40"
                    >
                      批量+30天
                    </button>
            <button
              onClick={() => runBulk('revoke')}
              disabled={bulkBusy || selectedIds.length === 0}
              className="px-2 py-1 text-xs rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40"
            >
              批量撤销
            </button>
            <button
              onClick={() => runBulk('restore')}
              disabled={bulkBusy || selectedIds.length === 0}
              className="px-2 py-1 text-xs rounded border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-40"
            >
              批量恢复
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={filteredAndSorted.length > 0 && selectedIds.length === filteredAndSorted.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(filteredAndSorted.map((u) => u.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                />
              </th>
              <th className="text-left p-3 cursor-pointer" onClick={() => toggleSort('email')}>
                邮箱{sortLabel('email')}
              </th>
              <th className="text-left p-3">姓名</th>
              <th className="text-left p-3">角色</th>
              <th className="text-left p-3 cursor-pointer" onClick={() => toggleSort('lastLogin')}>
                最后登录{sortLabel('lastLogin')}
              </th>
              <th className="text-left p-3 cursor-pointer" onClick={() => toggleSort('expiration')}>
                到期{sortLabel('expiration')}
              </th>
              <th className="text-left p-3 cursor-pointer" onClick={() => toggleSort('status')}>
                状态{sortLabel('status')}
              </th>
              <th className="text-left p-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-gray-500">
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <LoadingSpinner size="sm" />
                    <span>正在加载会员列表...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500 text-sm">
                  暂无用户。
                  {search || filterRole !== 'all' || filterStatus !== 'all' ? (
                    <span className="ml-1">尝试清除上方的搜索或筛选条件。</span>
                  ) : (
                    <span className="ml-1">在上方输入邮箱并点击「创建用户并生成Magic Link」来创建首位会员。</span>
                  )}
                </td>
              </tr>
            ) : filteredAndSorted.map(r => {
              const statusKey = computeStatus(r);
              const revoked = !!r.revoked_at;
              const status = statusKey === 'revoked' ? 'Revoked' : statusKey === 'expired' ? 'Expired' : 'Active';
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
                  showToast('success', '已为该用户续期');
                } catch (e: any) { showToast('error', e?.message || '续期失败'); }
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
                  showToast('success', '到期时间已更新');
                } catch (e: any) { showToast('error', e?.message || '续期失败'); }
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
                  showToast('success', '已撤销该用户访问权限');
                } catch (e: any) { showToast('error', e?.message || '撤销失败'); }
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
                  showToast('success', '已恢复该用户访问权限');
                } catch (e: any) { showToast('error', e?.message || '恢复失败'); }
              };
              const editUser = () => {
                setEditingUser(r);
                setEditEmail(r.email || '');
                setEditName(r.name || '');
                setEditRole(r.role === 'admin' ? 'admin' : 'member');
              };
              const toggleRole = async () => {
                const nextRole = r.role === 'admin' ? 'member' : 'admin';
                if (!window.confirm(`确认将该用户设为 ${nextRole === 'admin' ? '管理员' : '普通会员'}？`)) return;
                await updateUser(r.id, { role: nextRole });
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
                    showToast('info', msg);
                  } else {
                    showToast('info', msg);
                  }
                } catch (e: any) { showToast('error', e?.message || '重发失败'); }
              };
              const checked = selectedIds.includes(r.id);
              const statusClass = statusKey === 'revoked'
                ? 'bg-red-50 text-red-700'
                : statusKey === 'expired'
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'bg-green-50 text-green-700';

              return (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((prev) => prev.includes(r.id) ? prev : [...prev, r.id]);
                        } else {
                          setSelectedIds((prev) => prev.filter((id) => id !== r.id));
                        }
                      }}
                    />
                  </td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.name || '-'}</td>
                  <td className="p-3">{roleLabel}</td>
                  <td className="p-3">{r.last_login_at ? new Date(r.last_login_at).toLocaleString() : '-'}</td>
                  <td className="p-3">{r.expiration_at ? new Date(r.expiration_at).toLocaleDateString() : '-'}</td>
                  <td className="p-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs ${statusClass}`}>{status}</span>
                  </td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => renew(30)} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100">+30天</button>
                    <button onClick={renewToDate} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100">设日期</button>
                    {!revoked ? (
                      <button onClick={revoke} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">撤销</button>
                    ) : (
                      <button onClick={restore} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">恢复</button>
                    )}
                    <button onClick={() => renew(30)} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100">+30天</button>
                    {!revoked ? (
                      <button onClick={revoke} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100">撤销</button>
                    ) : (
                      <button onClick={restore} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">恢复</button>
                    )}
                    <button
                      onClick={() => setMoreOpenId(moreOpenId === r.id ? null : r.id)}
                      className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded hover:bg-gray-100 relative"
                    >
                      更多
                    </button>
                    {moreOpenId === r.id && (
                      <div className="absolute mt-1 right-3 z-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg text-xs text-gray-700">
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onClick={() => { setMoreOpenId(null); renewToDate(); }}
                        >
                          设定到期日
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onClick={() => { setMoreOpenId(null); editUser(); }}
                        >
                          编辑资料
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onClick={async () => {
                            setMoreOpenId(null);
                            await toggleRole();
                          }}
                        >
                          {r.role === 'admin' ? '降为 Member' : '设为 Admin'}
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onClick={async () => {
                            setMoreOpenId(null);
                            await resendMagic();
                          }}
                        >
                          重发登录邮件
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => !savingEdit && setEditingUser(null)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">编辑用户</h2>
              <button
                onClick={() => { if (!savingEdit) { setEditingUser(null); setEditError(null); } }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-gray-500">
              {editingUser.email} · {editingUser.role === 'admin' ? 'Admin' : 'Member'}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">邮箱</label>
                <input
                  className="w-full border px-3 py-2 rounded"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="user@example.com"
                />
                {editError && (
                  <div className="mt-1 text-xs text-red-600">{editError}</div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">姓名</label>
                <input
                  className="w-full border px-3 py-2 rounded"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="姓名（可选）"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">角色</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'member')}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => !savingEdit && setEditingUser(null)}
                className="px-4 py-2 text-sm rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!editingUser) return;
                  const payload: any = {};
                  const emailTrim = editEmail.trim();
                  if (!emailTrim) {
                    setEditError('邮箱不能为空');
                    return;
                  }
                  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailTrim);
                  if (!emailValid) {
                    setEditError('请输入有效邮箱');
                    return;
                  }
                  setEditError(null);
                  if (emailTrim !== editingUser.email) payload.email = emailTrim;
                  const nameTrim = editName.trim();
                  if (nameTrim !== (editingUser.name || '')) payload.name = nameTrim;
                  if (editRole !== (editingUser.role === 'admin' ? 'admin' : 'member')) payload.role = editRole;
                  if (Object.keys(payload).length === 0) {
                    setEditingUser(null);
                    return;
                  }
                  try {
                    setSavingEdit(true);
                    await updateUser(editingUser.id, payload);
                    setEditingUser(null);
                  } finally {
                    setSavingEdit(false);
                  }
                }}
                disabled={savingEdit}
                className="px-4 py-2 text-sm rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {savingEdit ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
