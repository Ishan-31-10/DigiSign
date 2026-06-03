'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import useSWR from '@/lib/useSWR';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { User } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const me = useAuth();
  const [q, setQ] = useState('');
  const { data, loading, refetch } = useSWR<{ users: User[] }>(
    `/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`,
    [q]
  );

  const update = async (id: string, patch: { role?: string; status?: string }) => {
    try {
      await api(`/admin/users/${id}`, { method: 'PATCH', body: patch });
      toast.success('User updated');
      refetch();
    } catch (e) {
      toast.error((e as ApiError).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500">Manage roles and account status.</p>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name or email"
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <CardBody className="p-0">
          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 hidden md:table-cell">Joined</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.users || []).map((u) => {
                    const uid = u.id;
                    const isSelf = me.user?.id === uid;
                    return (
                      <tr key={uid}>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200">{u.role}</Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            className={
                              u.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                            }
                          >
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-slate-500 hidden md:table-cell">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            {u.role === 'user' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => update(uid, { role: 'admin' })}
                              >
                                Make admin
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isSelf}
                                onClick={() => update(uid, { role: 'user' })}
                              >
                                Demote to user
                              </Button>
                            )}
                            {u.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={isSelf}
                                onClick={() => update(uid, { status: 'disabled' })}
                              >
                                Disable
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => update(uid, { status: 'active' })}
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && !(data?.users || []).length && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
