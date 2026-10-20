import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { EventItem } from '../types';
import { EventCard } from '../components/events/EventCard';
import { Button } from '../components/common/Button';
import {
  Ticket,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  TrendingUp,
  Cpu,
  CheckCircle,
  Users,
  Compass,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService.getPublishedEvents().then((data) => {
      setEvents(data.slice(0, 4));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-900 via-[#3B0764] to-[#1E1B4B] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-purple-200 border border-white/20 text-xs font-semibold backdrop-blur-xs animate-in fade-in duration-700">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Zero Double-Bookings Guarantee &bull; In-Memory Mutex Locking</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Reserve In-Demand Tickets With{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200">
              Zero Race Conditions
            </span>
          </h1>

          <p className="text-base sm:text-xl text-purple-100/90 max-w-2xl mx-auto leading-relaxed">
            EventHive is a high-concurrency multi-tenant event ticketing platform engineered with
            atomic row-level locks, 10-minute hold reservation leases, idempotency protection, and
            real-time inventory reconciliation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/events">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-[#6D28D9] hover:bg-purple-50 shadow-lg shadow-purple-950/50"
                icon={<Compass className="w-5 h-5" />}
              >
                Browse Live Events
              </Button>
            </Link>

            <Link to="/architecture">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-xs"
                icon={<Cpu className="w-5 h-5" />}
              >
                View Locking Architecture
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 text-left">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
              <span className="block text-2xl font-black text-white">100%</span>
              <span className="text-xs text-purple-200 font-medium">Atomic Tier Mutex</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
              <span className="block text-2xl font-black text-emerald-300">10 Min</span>
              <span className="text-xs text-purple-200 font-medium">Live Hold Window</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
              <span className="block text-2xl font-black text-amber-300">30s TTL</span>
              <span className="text-xs text-purple-200 font-medium">In-Memory Cache</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
              <span className="block text-2xl font-black text-pink-300">Idempotent</span>
              <span className="text-xs text-purple-200 font-medium">Double-Click Proof</span>
            </div>
          </div>
        </div>

        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      </section>

      {/* Featured Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6D28D9] mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Trending Now</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Popular Live Events
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Real-time ticket quantities update instantly as attendees lock tiers.
            </p>
          </div>

          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6D28D9] hover:text-[#7C3AED]"
          >
            <span>View All 8 Seeded Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* How EventHive Prevents Race Conditions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 shadow-sm">
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6D28D9] block mb-2">
              Engineering Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
              Why Flash Sales Never Oversell On EventHive
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              When thousands of users click &ldquo;Reserve VIP Ticket&rdquo; at the exact same millisecond, standard
              web applications suffer from race conditions (dirty reads and overselling). Here is how
              our simulated backend solves it:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6D28D9] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900">
                1. Tier-Keyed Mutex Lock
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mimics SQL <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded">SELECT FOR UPDATE</code>.
                Any hold request acquires an exclusive lock for that tier, calculates
                <code className="text-gray-800 font-mono text-[11px] block mt-1">
                  available = total - sold - activeHeld
                </code>
                and rejects if capacity is insufficient before releasing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#10B981] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900">
                2. Automated Expiry Worker
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mimics a BullMQ repeatable cron worker. A background ticker checks every 10 seconds for holds past
                <code className="text-purple-700 bg-purple-50 px-1 py-0.5 rounded">expires_at</code>,
                marks them <span className="font-semibold text-rose-600">EXPIRED</span> atomically, restores available seats, and broadcasts cache purges.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900">
                3. Idempotent Checkout Tokens
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mimics Stripe idempotency headers. Checkout calls submit a unique UUID token. If an impatient
                attendee double-clicks &ldquo;Pay Now&rdquo;, the duplicate request replays the existing state without
                double-billing or creating duplicate tickets.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-gray-500">
              Want to see 100 concurrent reservation requests battle for 10 tickets?
            </span>
            <Link to="/admin/stress-test">
              <Button variant="primary" size="sm" icon={<Zap className="w-3.5 h-3.5" />}>
                Launch Concurrency Stress Test &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
