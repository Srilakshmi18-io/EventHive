import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { eventService } from '../../services/eventService';
import { EventItem } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Calendar,
  Building2,
  XCircle,
  Eye,
  Shield,
  Search,
} from 'lucide-react';

export const AdminEventsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadAllEvents = async () => {
    if (!user) return;
    const all = await eventService.getAllEvents(user);
    setEvents(all);
    setLoading(false);
  };

  useEffect(() => {
    loadAllEvents();
  }, [user]);

  const handleAdminCancel = async (eventId: string, title: string) => {
    if (!user) return;
    if (confirm(`ADMIN ACTION: Are you sure you want to forcibly cancel "${title}"?`)) {
      try {
        await eventService.cancelEvent(user, eventId);
        toast(`Event "${title}" has been cancelled by platform admin.`, 'info');
        loadAllEvents();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Action failed';
        toast(msg, 'error');
      }
    }
  };

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.organizerName.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase())
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
            All Platform Events
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Cross-tenant inspection of all live, draft, and cancelled events across all registered organizers.
          </p>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or organizer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Organizer Tenant</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={evt.imageUrl}
                          alt={evt.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div>
                          <div className="font-bold text-gray-900">{evt.title}</div>
                          <div className="text-[11px] text-gray-400 font-mono">ID: {evt.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-semibold text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>{evt.organizerName}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <Badge variant="purple" size="sm">
                        {evt.category}
                      </Badge>
                    </td>

                    <td className="py-4 px-4 text-gray-600 font-medium">
                      {new Date(evt.startDate).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          evt.status === 'PUBLISHED'
                            ? 'success'
                            : evt.status === 'DRAFT'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {evt.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-4 text-right space-x-2">
                      <Link
                        to={`/events/${evt.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>

                      {evt.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleAdminCancel(evt.id, evt.title)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition font-medium cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
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
