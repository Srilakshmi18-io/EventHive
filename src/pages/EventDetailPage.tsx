import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { EventItem, TicketTier } from '../types';
import { TierSelector } from '../components/events/TierSelector';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Calendar,
  MapPin,
  Building2,
  Clock,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Tag,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [data, setData] = useState<{ event: EventItem; tiers: TicketTier[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    eventService.getEventById(eventId).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [eventId]);

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast('Event link copied to clipboard.', 'success');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-96 bg-gray-200 rounded-3xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Event Not Found</h2>
        <p className="text-sm text-gray-500">
          The requested event may have been cancelled, archived, or does not exist.
        </p>
        <Link to="/events">
          <Button variant="primary">Return to Events</Button>
        </Link>
      </div>
    );
  }

  const { event, tiers } = data;

  const startDateFormatted = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const startTimeFormatted = new Date(event.startDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Events</span>
        </Link>

        <button
          onClick={handleCopyShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-gray-500" />
          <span>Share Event</span>
        </button>
      </div>

      {/* Hero Banner with Title Overlay */}
      <div className="relative rounded-3xl overflow-hidden h-72 sm:h-96 w-full shadow-md bg-gray-900">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="purple" size="md">
              {event.category}
            </Badge>
            <Badge variant="neutral" size="md" className="bg-white/20 text-white border-white/30">
              {event.venueType.replace('_', ' ')}
            </Badge>
            {event.status === 'CANCELLED' && (
              <Badge variant="danger" size="md">
                Event Cancelled
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-2">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-purple-400" />
              {startDateFormatted} at {startTimeFormatted}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Building2 className="w-4 h-4 text-purple-400" />
              Organized by {event.organizerName}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: Details on left, Tier Selector on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Event Description, Logistics */}
        <div className="lg:col-span-7 space-y-8">
          {/* About Section */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-xl font-bold text-gray-900">About This Event</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <ShieldCheck className="w-5 h-5 text-[#6D28D9] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-0.5">Guaranteed Unique Seats</h4>
                  <p className="text-gray-600 leading-snug">
                    Tier allocations are locked atomically via in-memory mutex to prevent double-booking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-gray-900 mb-0.5">Instant Digital Pass</h4>
                  <p className="text-gray-600 leading-snug">
                    Unique serial QR codes issued immediately upon card payment confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Venue */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#6D28D9]" />
              <span>Location &amp; Venue</span>
            </h2>
            <p className="text-sm text-gray-700 font-medium">{event.location}</p>

            {/* Stylized Venue Mockup Map */}
            <div className="h-40 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#6D28D9_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
              <div className="relative text-center p-4 bg-white/90 backdrop-blur-xs rounded-xl shadow-xs border border-gray-200 max-w-xs">
                <MapPin className="w-6 h-6 text-[#6D28D9] mx-auto mb-1 animate-bounce" />
                <span className="text-xs font-bold text-gray-900 block truncate">
                  {event.location.split(',')[0]}
                </span>
                <span className="text-[11px] text-gray-500">
                  Venue doors open 1 hour before scheduled start.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tier Selector & Checkout Hold Trigger */}
        <div className="lg:col-span-5 sticky top-20">
          <TierSelector event={event} tiers={tiers} />
        </div>
      </div>
    </div>
  );
};
