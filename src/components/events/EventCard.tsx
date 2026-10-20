import React from 'react';
import { Link } from 'react-router-dom';
import { EventItem, TicketTier } from '../../types';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';
import { Calendar, MapPin, Tag, ArrowRight } from 'lucide-react';

interface EventCardProps {
  event: EventItem;
  tiers?: TicketTier[];
}

export const EventCard: React.FC<EventCardProps> = ({ event, tiers: propTiers }) => {
  const tiers = propTiers || db.getTiersByEventId(event.id);

  // Calculate price range
  const prices = tiers.map((t) => t.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  // Calculate total remaining tickets across tiers
  let totalAvailable = 0;
  let isSoldOut = true;
  tiers.forEach((t) => {
    const avail = db.calculateTierAvailability(t.id);
    if (avail && avail.available > 0) {
      totalAvailable += avail.available;
      isSoldOut = false;
    }
  });

  const formattedDate = new Date(event.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
      {/* Event Image Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <Badge variant="purple" size="sm">
            {event.category}
          </Badge>
          <Badge variant="neutral" size="sm">
            {event.venueType.replace('_', ' ')}
          </Badge>
        </div>

        <div className="absolute top-3 right-3">
          {event.status === 'CANCELLED' ? (
            <Badge variant="danger" size="sm">
              Cancelled
            </Badge>
          ) : isSoldOut ? (
            <Badge variant="danger" size="sm">
              Sold Out
            </Badge>
          ) : totalAvailable <= 15 ? (
            <Badge variant="warning" size="sm">
              Only {totalAvailable} left
            </Badge>
          ) : (
            <Badge variant="success" size="sm">
              Available
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1 font-medium text-purple-700">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
            <span>&bull;</span>
            <span className="truncate max-w-[150px]">{event.organizerName}</span>
          </div>

          <Link to={`/events/${event.id}`}>
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#6D28D9] transition-colors line-clamp-1 mb-2">
              {event.title}
            </h3>
          </Link>

          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
            {event.description}
          </p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
            <span className="truncate">{event.location}</span>
          </div>

          {/* Pricing & CTA Footer */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-gray-400 block font-semibold">
                Tickets From
              </span>
              <span className="text-base font-extrabold text-gray-900">
                ${minPrice}
                {maxPrice > minPrice && (
                  <span className="text-xs text-gray-500 font-normal"> - ${maxPrice}</span>
                )}
              </span>
            </div>

            <Link
              to={`/events/${event.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-[#6D28D9] group-hover:bg-[#6D28D9] group-hover:text-white text-xs font-semibold transition"
            >
              <span>View Tiers</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
