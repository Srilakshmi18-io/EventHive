import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { eventService } from '../../services/eventService';
import { User } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Users,
  Shield,
  Briefcase,
  UserCheck,
  CheckCircle,
  Ban,
  Clock,
  Search,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const loadUsers = async () => {
    if (!user) return;
    const all = await eventService.getAllUsers(user);
    setUsers(all);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, [user]);

  const handleStatusChange = async (
    targetUserId: string,
    userName: string,
    newStatus: 'APPROVED' | 'PENDING' | 'SUSPENDED'
  ) => {
    if (!user) return;
    try {
      await eventService.updateOrganizerStatus(user, targetUserId, newStatus);
      toast(`Organizer status for ${userName} updated to ${newStatus}.`, 'success');
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      toast(msg, 'error');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      (u.organizationName && u.organizationName.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Platform Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            User Accounts &amp; Organizer Approvals
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage roles, verify organizer credentials, and enforce publishing permissions.
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users or organizations..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Organization &amp; Status</th>
                  <th className="py-3 px-4 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
                        />
                        <div>
                          <div className="font-bold text-gray-900">{u.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-gray-600">{u.email}</td>

                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          u.role === 'ADMIN'
                            ? 'danger'
                            : u.role === 'ORGANIZER'
                            ? 'purple'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>

                    <td className="py-4 px-4">
                      {u.role === 'ORGANIZER' ? (
                        <div>
                          <div className="font-semibold text-gray-900">{u.organizationName}</div>
                          <div className="mt-1">
                            <Badge
                              variant={
                                u.organizerStatus === 'APPROVED'
                                  ? 'success'
                                  : u.organizerStatus === 'PENDING'
                                  ? 'warning'
                                  : 'danger'
                              }
                              size="sm"
                            >
                              {u.organizerStatus || 'APPROVED'}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Attendee</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right space-x-1.5">
                      {u.role === 'ORGANIZER' ? (
                        <>
                          {u.organizerStatus !== 'APPROVED' && (
                            <button
                              onClick={() => handleStatusChange(u.id, u.name, 'APPROVED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition cursor-pointer"
                              title="Approve Organizer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {u.organizerStatus !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleStatusChange(u.id, u.name, 'SUSPENDED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold transition cursor-pointer"
                              title="Suspend Organizer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 text-[11px]">&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
