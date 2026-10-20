import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { db } from '../../services/db';
import { EventItem, TicketTier, Order, TierAvailability } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Ticket,
  Clock,
  Users,
  Download,
  ShieldCheck,
} from 'lucide-react';

export const EventSalesDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [tierAvails, setTierAvails] = useState<Record<string, TierAvailability | null>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    eventService.getEventById(eventId).then((res) => {
      if (res) {
        setEvent(res.event);
        setTiers(res.tiers);

        const avails: Record<string, TierAvailability | null> = {};
        res.tiers.forEach((t) => {
          avails[t.id] = db.calculateTierAvailability(t.id);
        });
        setTierAvails(avails);

        const eventOrders = db
          .getOrders()
          .filter((o) => o.eventId === eventId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(eventOrders);
      }
      setLoading(false);
    });
  }, [eventId]);

  if (loading) {
    return <div className="h-96 bg-gray-200 rounded-3xl animate-pulse" />;
  }

  if (!event) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Event not found</h2>
        <Link to="/organizer/events">
          <Button variant="primary">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const paidOrders = orders.filter((o) => o.status === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalSold = paidOrders.reduce((sum, o) => sum + o.quantity, 0);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Events</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Sales Breakdown &amp; Roster: {event.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Event Date: {new Date(event.startDate).toLocaleDateString()} &bull; Venue: {event.location}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/organizer/events/edit/${event.id}`}>
              <Button variant="secondary" size="sm">
                Edit Event &amp; Tiers
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">Event Revenue</span>
          <div className="text-2xl font-extrabold text-[#6D28D9] mt-1">
            ${totalRevenue.toLocaleString()}
          </div>
          <span className="text-xs text-gray-400 mt-1 block">From {paidOrders.length} completed transactions</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">Tickets Sold</span>
          <div className="text-2xl font-extrabold text-[#10B981] mt-1">
            {totalSold} tickets
          </div>
          <span className="text-xs text-gray-400 mt-1 block">Across {tiers.length} tier allocations</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">Status</span>
          <div className="mt-1">
            <Badge variant={event.status === 'PUBLISHED' ? 'success' : 'neutral'} size="md">
              {event.status}
            </Badge>
          </div>
          <span className="text-xs text-gray-400 mt-2 block">ID: {event.id}</span>
        </div>
      </div>

      {/* Tiers Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900">Tier Capacity Status</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Tier Name</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Total Cap</th>
                <th className="py-3 px-4">Sold</th>
                <th className="py-3 px-4">Held (Checkout)</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tiers.map((t) => {
                const avail = tierAvails[t.id];
                const tierOrders = paidOrders.filter((o) => o.ticketTierId === t.id);
                const tierRev = tierOrders.reduce((sum, o) => sum + o.totalAmount, 0);

                return (
                  <tr key={t.id} className="hover:bg-gray-50/60">
                    <td className="py-3 px-4 font-bold text-gray-900">{t.name}</td>
                    <td className="py-3 px-4 font-mono font-semibold">${t.price}</td>
                    <td className="py-3 px-4 font-mono">{t.totalQuantity}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {avail?.sold ?? 0}
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-600">
                      {avail?.activeHeld ?? 0}
                    </td>
                    <td className="py-3 px-4 font-bold text-purple-700">
                      {avail?.available ?? t.totalQuantity}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900">
                      ${tierRev.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendee Order Roster */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Attendee Ticket Orders</h2>
          <span className="text-xs text-gray-500">{orders.length} order(s) logged</span>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-gray-500 py-4">No attendee orders have been recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Attendee Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Total Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/60">
                    <td className="py-3 px-4 font-bold text-gray-900">{ord.attendeeName}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">{ord.attendeeEmail}</td>
                    <td className="py-3 px-4 text-purple-700 font-medium">{ord.tierName}</td>
                    <td className="py-3 px-4 font-semibold">{ord.quantity}x</td>
                    <td className="py-3 px-4 font-bold text-gray-900">${ord.totalAmount}</td>
                    <td className="py-3 px-4">
                      <Badge variant={ord.status === 'PAID' ? 'success' : 'danger'} size="sm">
                        {ord.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
