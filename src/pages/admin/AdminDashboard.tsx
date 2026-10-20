import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { AnalyticsSummary } from '../../types';
import { KpiCard } from '../../components/analytics/KpiCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  DollarSign,
  Ticket,
  Clock,
  TrendingUp,
  Shield,
  Flame,
  Users,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGlobalAnalytics = async () => {
    if (!user) return;
    const data = await eventService.getAnalytics(user);
    setAnalytics(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGlobalAnalytics();
    const interval = setInterval(fetchGlobalAnalytics, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Platform Root Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            System Overview &amp; Global Metrics
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Cross-tenant platform analytics, order throughput, and concurrency benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/stress-test">
            <Button
              variant="primary"
              size="sm"
              className="bg-gray-900 hover:bg-black text-white"
              icon={<Flame className="w-4 h-4 text-amber-400" />}
            >
              Run 100x Concurrency Stress Test
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="Global Platform Revenue"
          value={`$${analytics.totalRevenue.toLocaleString()}`}
          subtitle="Across all organizers & events"
          icon={DollarSign}
          variant="purple"
        />
        <KpiCard
          title="Total Tickets Issued"
          value={analytics.totalTicketsSold}
          subtitle="Verified active tickets in wallets"
          icon={Ticket}
          variant="emerald"
        />
        <KpiCard
          title="Concurrent Active Holds"
          value={analytics.activeHoldsCount}
          subtitle="Live 10-minute hold leases"
          icon={Clock}
          variant="amber"
        />
        <KpiCard
          title="Global Conversion Rate"
          value={`${analytics.conversionRate}%`}
          subtitle="Completed sales vs total holds"
          icon={TrendingUp}
          variant="blue"
        />
      </div>

      {/* Global Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Revenue Velocity */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Platform Gross Sales Velocity</h2>
              <p className="text-xs text-gray-500">Aggregated revenue per day ($)</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold">
              Live System State
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(value: unknown) => [`$${value}`, 'Global Revenue']}
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Tier Volume */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Top Selling Tiers</h2>
            <p className="text-xs text-gray-500">Highest volume ticket tiers</p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.tierSales} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis
                  dataKey="tierName"
                  type="category"
                  stroke="#9CA3AF"
                  fontSize={10}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(value: unknown) => [`${value} tickets`, 'Sold']}
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderRadius: '0.75rem',
                    border: 'none',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="sold" fill="#6D28D9" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Links Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/events"
          className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-purple-300 transition group shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <Calendar className="w-5 h-5 text-[#6D28D9]" />
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#6D28D9] group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-sm text-gray-900">All Published Events</h3>
          <p className="text-xs text-gray-500">
            Audit, inspect, or emergency cancel listings across all organizer tenants.
          </p>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-purple-300 transition group shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <Users className="w-5 h-5 text-emerald-600" />
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-sm text-gray-900">Organizer Approvals</h3>
          <p className="text-xs text-gray-500">
            Grant publishing permissions, review status, and suspend organizer accounts.
          </p>
        </Link>

        <Link
          to="/admin/stress-test"
          className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-purple-300 transition group shadow-xs space-y-2"
        >
          <div className="flex items-center justify-between">
            <Flame className="w-5 h-5 text-amber-500" />
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-sm text-gray-900">Stress Test Simulator</h3>
          <p className="text-xs text-gray-500">
            Launch 100 concurrent async threads against a 10-ticket inventory lock.
          </p>
        </Link>
      </div>
    </div>
  );
};
