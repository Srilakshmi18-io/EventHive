import React from 'react';
import { Ticket as TicketType } from '../../types';
import { Badge } from '../common/Badge';
import {
  Calendar,
  MapPin,
  QrCode,
  User,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Sparkles,
} from 'lucide-react';

interface TicketPassProps {
  ticket: TicketType;
}

export const TicketPass: React.FC<TicketPassProps> = ({ ticket }) => {
  const formattedDate = new Date(ticket.eventDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden transition-all hover:shadow-lg max-w-lg mx-auto">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-[#6D28D9] to-[#7C3AED] text-white p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-[11px] font-bold tracking-widest uppercase text-purple-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> EventHive Verified Pass
          </span>
          <Badge
            variant={
              ticket.status === 'VALID'
                ? 'success'
                : ticket.status === 'USED'
                ? 'neutral'
                : 'danger'
            }
            size="sm"
            className="bg-white/20 text-white border-white/30 backdrop-blur-xs"
          >
            {ticket.status}
          </Badge>
        </div>

        <h3 className="font-extrabold text-xl leading-tight mb-2 relative z-10">
          {ticket.eventTitle}
        </h3>

        <div className="inline-block bg-white/20 backdrop-blur-xs px-3 py-1 rounded-lg text-xs font-semibold text-white relative z-10">
          {ticket.tierName}
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* Perforated Notch Divider */}
      <div className="relative flex items-center justify-between bg-gray-50 py-2 border-y border-dashed border-gray-200">
        <div className="w-4 h-6 bg-[#F9FAFB] rounded-r-full -ml-0.5 border-r border-y border-gray-200" />
        <div className="flex-1 border-t border-dashed border-gray-300 mx-3" />
        <div className="w-4 h-6 bg-[#F9FAFB] rounded-l-full -mr-0.5 border-l border-y border-gray-200" />
      </div>

      {/* Ticket Details & QR Code */}
      <div className="p-6 bg-white space-y-6">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-400 block font-medium mb-1">Attendee</span>
            <div className="font-bold text-gray-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>{ticket.attendeeName}</span>
            </div>
          </div>

          <div>
            <span className="text-gray-400 block font-medium mb-1">Date &amp; Time</span>
            <div className="font-bold text-gray-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="col-span-2">
            <span className="text-gray-400 block font-medium mb-1">Venue Location</span>
            <div className="font-bold text-gray-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">{ticket.eventLocation}</span>
            </div>
          </div>
        </div>

        {/* QR Simulation Card */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {/* Mock QR SVG */}
          <div className="w-24 h-24 bg-white p-2 rounded-xl border border-gray-200 shrink-0 flex items-center justify-center shadow-xs">
            <svg
              className="w-full h-full text-gray-900"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" fill="#111827" stroke="none" />
              <rect x="14" y="3" width="7" height="7" rx="1" fill="#111827" stroke="none" />
              <rect x="3" y="14" width="7" height="7" rx="1" fill="#111827" stroke="none" />
              <rect x="14" y="14" width="3" height="3" fill="#6D28D9" stroke="none" />
              <rect x="18" y="14" width="3" height="3" fill="#111827" stroke="none" />
              <rect x="14" y="18" width="3" height="3" fill="#111827" stroke="none" />
              <rect x="18" y="18" width="3" height="3" fill="#6D28D9" stroke="none" />
              <rect x="10" y="5" width="2" height="6" fill="#111827" stroke="none" />
              <rect x="5" y="10" width="6" height="2" fill="#111827" stroke="none" />
            </svg>
          </div>

          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-0.5">
              Unique Verification Code
            </span>
            <div className="font-mono text-sm font-extrabold text-gray-900 tracking-wider">
              {ticket.ticketCode}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 leading-snug">
              Present this pass at the venue entrance scanner for admission.
            </p>
          </div>
        </div>

        {/* Print / Save Trigger */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Guaranteed Unique Seat</span>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass</span>
          </button>
        </div>
      </div>
    </div>
  );
};
