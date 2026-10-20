import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventService, GetEventsFilters } from '../services/eventService';
import { EventItem, EventCategory } from '../types';
import { EventCard } from '../components/events/EventCard';
import { Button } from '../components/common/Button';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Compass,
  Calendar,
  DollarSign,
  ArrowUpDown,
  X,
} from 'lucide-react';

const CATEGORIES: Array<EventCategory | 'ALL'> = [
  'ALL',
  'Tech',
  'Music',
  'Conference',
  'Workshop',
  'Comedy',
  'Sports',
];

export const EventsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<EventCategory | 'ALL'>(
    (searchParams.get('cat') as EventCategory) || 'ALL'
  );
  const [sortBy, setSortBy] = useState<GetEventsFilters['sortBy']>('date_asc');
  const [maxPrice, setMaxPrice] = useState<number>(1000);

  const fetchEvents = async () => {
    setLoading(true);
    const data = await eventService.getPublishedEvents({
      query: query.trim() || undefined,
      category,
      maxPrice: maxPrice < 1000 ? maxPrice : undefined,
      sortBy,
    });
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [category, sortBy, maxPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleClearFilters = () => {
    setQuery('');
    setCategory('ALL');
    setSortBy('date_asc');
    setMaxPrice(1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <Compass className="w-8 h-8 text-[#6D28D9]" />
          <span>Explore Events</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse upcoming conferences, concerts, workshops, and sports with real-time ticket availability.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search input + Sort */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by event title, location, or organizer..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white transition"
            />
          </div>

          <Button type="submit" variant="primary" size="md">
            Search
          </Button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as GetEventsFilters['sortBy'])}
              className="bg-transparent font-medium text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="date_asc">Date: Upcoming First</option>
              <option value="date_desc">Date: Latest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </form>

        {/* Category Pills & Price Slider */}
        <div className="pt-2 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  category === cat
                    ? 'bg-[#6D28D9] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          {/* Max Price Range Slider */}
          <div className="flex items-center gap-3 text-xs text-gray-600 self-end sm:self-auto">
            <span className="font-medium whitespace-nowrap">Max Price:</span>
            <input
              type="range"
              min="30"
              max="1000"
              step="20"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
              className="w-28 sm:w-36 accent-[#6D28D9] cursor-pointer"
            />
            <span className="font-mono font-bold text-gray-900 w-12 text-right">
              {maxPrice >= 1000 ? 'Any' : `$${maxPrice}`}
            </span>

            {(query || category !== 'ALL' || maxPrice < 1000) && (
              <button
                onClick={handleClearFilters}
                className="text-rose-600 hover:text-rose-700 ml-2 p-1 rounded-md text-xs font-medium flex items-center gap-0.5"
                title="Clear all filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Events Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-80 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#6D28D9] mx-auto flex items-center justify-center">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">No events matched your filters</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Try adjusting your search terms, changing the category, or raising the maximum price filter.
          </p>
          <div className="pt-2">
            <Button variant="secondary" size="sm" onClick={handleClearFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4 px-1">
            <span>Showing {events.length} event(s)</span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
              Live capacity sync enabled
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
