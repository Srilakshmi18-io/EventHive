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
  PlusCircle,
  Edit,
  Eye,
  XCircle,
  BarChart2,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export const OrganizerEventsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    if (!user) return;
    const all = await eventService.getAllEvents(user);
    setEvents(all);
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, [user]);

  const handleCancelEvent = async (eventId: string, title: string) => {
    if (!user) return;
    if (confirm(`Are you sure you want to cancel "${title}"? Ticket sales will stop immediately.`)) {
      try {
        await eventService.cancelEvent(user, eventId);
        toast(`Event "${title}" has been cancelled.`, 'info');
        loadEvents();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to cancel event';
        toast(msg, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-[#6D28D9]" />
            <span>My Organized Events</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your draft and published event listings, ticket tier structures, and sales rosters.
          </p>
        </div>

        <Link to="/organizer/events/new">
          <Button variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
            Create New Event
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
          <Calendar className="w-12 h-12 text-purple-600 mx-auto" />
          <h3 className="font-bold text-lg text-gray-900">No events found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You haven&apos;t created any events yet. Create your first conference, concert, or workshop now!
          </p>
          <div className="pt-2">
            <Link to="/organizer/events/new">
              <Button variant="primary">Create an Event</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date &amp; Venue</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((evt) => {
                  const dateStr = new Date(evt.startDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={evt.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={evt.imageUrl}
                            alt={evt.title}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                          <div>
                            <div className="font-bold text-sm text-gray-900 hover:text-[#6D28D9] transition">
                              <Link to={`/events/${evt.id}`}>{evt.title}</Link>
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">ID: {evt.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <Badge variant="purple" size="sm">
                          {evt.category}
                        </Badge>
                      </td>

                      <td className="py-4 px-4 text-gray-600">
                        <div className="font-medium text-gray-900">{dateStr}</div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[180px]">
                          {evt.location}
                        </div>
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
                          to={`/organizer/events/sales/${evt.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold transition"
                          title="Sales Breakdown"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>Sales</span>
                        </Link>

                        <Link
                          to={`/organizer/events/edit/${evt.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 hover:bg-purple-100 font-semibold transition"
                          title="Edit Event"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>

                        {evt.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancelEvent(evt.id, evt.title)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Cancel Event"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
