import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { Order } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Layers,
  Calendar,
  CreditCard,
  Ticket,
  ArrowRight,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';

export const MyOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      eventService.getUserOrders(user.id).then((res) => {
        setOrders(res);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Sign in to view orders</h2>
        <Link to="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-[#6D28D9]" />
            <span>My Orders &amp; Receipts</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track your order history, transaction identifiers, and receipt invoices.
          </p>
        </div>

        <Link to="/my-tickets">
          <Button variant="secondary" size="sm" icon={<Ticket className="w-4 h-4 text-purple-600" />}>
            Go to Ticket Wallet
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#6D28D9] mx-auto flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">No orders placed yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Explore live conferences, concerts, and workshops to reserve your first tickets.
          </p>
          <div className="pt-2">
            <Link to="/events">
              <Button variant="primary">Browse Events</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID &amp; Date</th>
                  <th className="py-3 px-4">Event &amp; Tier</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((ord) => {
                  const dateStr = new Date(ord.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                      <td className="py-4 px-4 font-mono font-medium text-gray-900">
                        <div>{ord.id}</div>
                        <div className="text-[11px] text-gray-400 font-sans">{dateStr}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">{ord.eventTitle}</div>
                        <div className="text-[11px] text-purple-700 font-medium">{ord.tierName}</div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-700">
                        {ord.quantity}x
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-900">
                        ${ord.totalAmount}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            ord.status === 'PAID'
                              ? 'success'
                              : ord.status === 'PENDING'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {ord.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {ord.status === 'PAID' ? (
                          <Link
                            to={`/payment-result/${ord.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg transition"
                          >
                            <span>Receipt &amp; Passes</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <Link
                            to={`/events/${ord.eventId}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg transition"
                          >
                            <span>Re-Order</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
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
