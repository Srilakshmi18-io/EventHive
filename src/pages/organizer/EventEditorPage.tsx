import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { eventService } from '../../services/eventService';
import { EventItem, TicketTier, EventCategory, VenueType, EventStatus } from '../../types';
import { Button } from '../../components/common/Button';
import {
  Calendar,
  Plus,
  Trash2,
  ArrowLeft,
  Check,
  Building,
  MapPin,
  Tag,
  DollarSign,
  Clock,
  Layers,
} from 'lucide-react';

interface TierDraft {
  id?: string;
  name: string;
  description: string;
  price: number;
  totalQuantity: number;
  perOrderMax: number;
  salesCutoff: string;
  sortOrder: number;
}

export const EventEditorPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const isEditing = Boolean(eventId);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Tech');
  const [venueType, setVenueType] = useState<VenueType>('IN_PERSON');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('2026-11-20T09:00');
  const [endDate, setEndDate] = useState('2026-11-20T17:00');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'
  );
  const [status, setStatus] = useState<EventStatus>('PUBLISHED');

  // Tier Builder List
  const [tiers, setTiers] = useState<TierDraft[]>([
    {
      name: 'General Admission',
      description: 'Standard event entrance and seating.',
      price: 99,
      totalQuantity: 100,
      perOrderMax: 4,
      salesCutoff: '2026-11-19T23:59',
      sortOrder: 1,
    },
    {
      name: 'VIP Executive',
      description: 'Front row seating, lounge access, and catered lunch.',
      price: 249,
      totalQuantity: 30,
      perOrderMax: 2,
      salesCutoff: '2026-11-19T23:59',
      sortOrder: 2,
    },
  ]);

  useEffect(() => {
    if (!isEditing || !eventId) return;

    eventService.getEventById(eventId).then((res) => {
      if (res) {
        const { event, tiers: eventTiers } = res;
        setTitle(event.title);
        setDescription(event.description);
        setCategory(event.category);
        setVenueType(event.venueType);
        setLocation(event.location);
        setStartDate(event.startDate.slice(0, 16));
        setEndDate(event.endDate.slice(0, 16));
        setImageUrl(event.imageUrl);
        setStatus(event.status);

        if (eventTiers.length > 0) {
          setTiers(
            eventTiers.map((t) => ({
              ...t,
              salesCutoff: t.salesCutoff ? t.salesCutoff.slice(0, 16) : '',
            }))
          );
        }
      }
      setLoading(false);
    });
  }, [eventId, isEditing]);

  const handleAddTier = () => {
    setTiers((prev) => [
      ...prev,
      {
        name: `Tier ${prev.length + 1}`,
        description: 'Standard admission perks.',
        price: 50,
        totalQuantity: 50,
        perOrderMax: 4,
        salesCutoff: startDate,
        sortOrder: prev.length + 1,
      },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (tiers.length <= 1) {
      toast('Events must have at least one ticket tier.', 'warning');
      return;
    }
    setTiers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTier = (index: number, field: keyof TierDraft, value: unknown) => {
    setTiers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title.trim() || !description.trim() || !location.trim()) {
      toast('Please fill in all event details.', 'warning');
      return;
    }

    if (tiers.length === 0) {
      toast('Please define at least one ticket tier.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedTiers = tiers.map((t, idx) => ({
        ...t,
        sortOrder: idx + 1,
        salesCutoff: t.salesCutoff ? new Date(t.salesCutoff).toISOString() : new Date(startDate).toISOString(),
      }));

      if (isEditing && eventId) {
        await eventService.updateEvent(
          user,
          eventId,
          {
            title: title.trim(),
            description: description.trim(),
            category,
            venueType,
            location: location.trim(),
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            imageUrl,
            status,
          },
          formattedTiers
        );
        toast('Event and tiers updated successfully!', 'success');
      } else {
        await eventService.createEvent(
          user,
          {
            title: title.trim(),
            description: description.trim(),
            category,
            venueType,
            location: location.trim(),
            startDate: new Date(startDate).toISOString(),
            endDate: new Date(endDate).toISOString(),
            imageUrl,
            status,
          },
          formattedTiers
        );
        toast('New event created and published!', 'success');
      }

      navigate('/organizer/events');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save event';
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-96 bg-gray-200 rounded-3xl animate-pulse" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <Link
            to="/organizer/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Events</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {isEditing ? 'Edit Event & Ticket Tiers' : 'Create New Multi-Tier Event'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Core Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#6D28D9]" />
            <span>1. Event Information</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Event Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NextGen Web & Distributed Systems Conference 2026"
                className="w-full px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white cursor-pointer"
                >
                  <option value="Tech">Tech</option>
                  <option value="Conference">Conference</option>
                  <option value="Music">Music</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Venue Type
                </label>
                <select
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value as VenueType)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white cursor-pointer"
                >
                  <option value="IN_PERSON">In Person</option>
                  <option value="ONLINE">Online Stream</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Publication Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EventStatus)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white cursor-pointer"
                >
                  <option value="PUBLISHED">PUBLISHED (Live for sales)</option>
                  <option value="DRAFT">DRAFT (Hidden from public)</option>
                  <option value="CANCELLED">CANCELLED (Sales blocked)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Venue Location Address
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Yerba Buena Center, 701 Mission St, San Francisco, CA"
                className="w-full px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Start Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  End Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Event Description
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe key speakers, agenda topics, and admission guidelines..."
                className="w-full px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cover Image URL (Unsplash)
              </label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Multi-Tier Builder */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#6D28D9]" />
                <span>2. Ticket Tiers &amp; Capacity Caps</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Each tier is assigned a dedicated atomic lock to enforce hard capacity constraints.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddTier}
            >
              Add Tier
            </Button>
          </div>

          <div className="space-y-4">
            {tiers.map((t, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4 relative"
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    Tier #{idx + 1}
                  </span>
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="text-gray-400 hover:text-rose-600 transition p-1"
                      title="Remove Tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tier Name
                    </label>
                    <input
                      type="text"
                      required
                      value={t.name}
                      onChange={(e) => handleUpdateTier(idx, 'name', e.target.value)}
                      placeholder="e.g. VIP Backstage Pass"
                      className="w-full px-3 py-1.5 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Price ($ USD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={t.price}
                      onChange={(e) =>
                        handleUpdateTier(idx, 'price', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-1.5 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Total Capacity (Hard Cap)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={t.totalQuantity}
                      onChange={(e) =>
                        handleUpdateTier(idx, 'totalQuantity', parseInt(e.target.value, 10) || 1)
                      }
                      className="w-full px-3 py-1.5 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Max Tickets Per Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      required
                      value={t.perOrderMax}
                      onChange={(e) =>
                        handleUpdateTier(idx, 'perOrderMax', parseInt(e.target.value, 10) || 1)
                      }
                      className="w-full px-3 py-1.5 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Sales Cut-Off Datetime
                    </label>
                    <input
                      type="datetime-local"
                      value={t.salesCutoff}
                      onChange={(e) => handleUpdateTier(idx, 'salesCutoff', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tier Description &amp; Inclusions
                  </label>
                  <input
                    type="text"
                    value={t.description}
                    onChange={(e) => handleUpdateTier(idx, 'description', e.target.value)}
                    placeholder="e.g. Free drinks, express badge pickup, commemorative gift"
                    className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link to="/organizer/events">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            icon={<Check className="w-4 h-4" />}
          >
            {isEditing ? 'Save Event Changes' : 'Publish Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};
