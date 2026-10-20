import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { Ticket } from '../types';
import { TicketPass } from '../components/tickets/TicketPass';
import { Button } from '../components/common/Button';
import {
  Ticket as TicketIcon,
  Compass,
  Calendar,
  CheckCircle2,
  Printer,
  Sparkles,
} from 'lucide-react';

export const MyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      eventService.getUserTickets(user.id).then((res) => {
        setTickets(res);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Sign in to view your tickets</h2>
        <Link to="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <TicketIcon className="w-7 h-7 text-[#6D28D9]" />
            <span>Digital Ticket Wallet</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Display your admission passes with scannable QR verification codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/events">
            <Button variant="secondary" size="sm" icon={<Compass className="w-4 h-4" />}>
              Find More Events
            </Button>
          </Link>
          {tickets.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print All Passes
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-96 bg-gray-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-[#6D28D9] mx-auto flex items-center justify-center">
            <TicketIcon className="w-8 h-8 -rotate-12" />
          </div>
          <h3 className="font-bold text-xl text-gray-900">Your ticket wallet is empty</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            You haven&apos;t booked tickets to any events yet. Check out upcoming tech summits, music festivals, and workshops!
          </p>
          <div className="pt-2">
            <Link to="/events">
              <Button variant="primary">Explore Events Now</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>{tickets.length} Active Admission Pass(es)</span>
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cryptographically Verified</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {tickets.map((t) => (
              <TicketPass key={t.id} ticket={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
