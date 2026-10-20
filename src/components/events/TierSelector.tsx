import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TicketTier, TierAvailability, EventItem } from '../../types';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Ticket,
  Lock,
  AlertCircle,
  Clock,
  ShieldCheck,
  Check,
  Users,
  ChevronRight,
} from 'lucide-react';

interface TierSelectorProps {
  event: EventItem;
  tiers: TicketTier[];
}

export const TierSelector: React.FC<TierSelectorProps> = ({ event, tiers }) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedTierId, setSelectedTierId] = useState<string>(tiers[0]?.id || '');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [availabilities, setAvailabilities] = useState<Record<string, TierAvailability | null>>({});
  const [isHolding, setIsHolding] = useState<boolean>(false);

  // Load and refresh live availability for each tier
  const refreshAvailability = async () => {
    const map: Record<string, TierAvailability | null> = {};
    for (const tier of tiers) {
      const avail = await eventService.getTierAvailability(tier.id);
      map[tier.id] = avail;
    }
    setAvailabilities(map);
  };

  useEffect(() => {
    refreshAvailability();
    const interval = setInterval(refreshAvailability, 4000);
    return () => clearInterval(interval);
  }, [tiers]);

  const selectedTier = tiers.find((t) => t.id === selectedTierId) || tiers[0];
  const selectedAvail = selectedTier ? availabilities[selectedTier.id] : null;
  const currentQuantity = selectedTier ? quantities[selectedTier.id] || 1 : 1;

  const handleHoldTickets = async () => {
    if (!selectedTier) return;

    if (!isAuthenticated || !user) {
      toast('Please sign in to reserve tickets.', 'warning', 'Authentication Required');
      navigate('/login');
      return;
    }

    setIsHolding(true);
    try {
      // Calls service layer with tier lock and concurrency check
      const reservation = await eventService.createReservationHold({
        ticketTierId: selectedTier.id,
        quantity: currentQuantity,
        userId: user.id,
      });

      toast(
        `Held ${currentQuantity} ${selectedTier.name} ticket(s) for 10 minutes.`,
        'success',
        'Hold Acquired'
      );

      // Redirect to checkout with active reservation ID
      navigate(`/checkout/${reservation.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to hold tickets.';
      toast(message, 'error', 'Hold Failed');
      refreshAvailability();
    } finally {
      setIsHolding(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#6D28D9]" />
            <span>Select Ticket Tier</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time atomic locking prevents overselling and duplicate bookings.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Live Sync</span>
        </div>
      </div>

      {/* Tier Options List */}
      <div className="space-y-3 mb-6">
        {tiers.map((tier) => {
          const avail = availabilities[tier.id];
          const isSelected = selectedTierId === tier.id;
          const isSoldOut = avail ? avail.available <= 0 : false;
          const isCutoff = avail ? avail.isCutoffReached : false;
          const isBlocked = isSoldOut || isCutoff;

          const remaining = avail ? avail.available : tier.totalQuantity;
          const held = avail ? avail.activeHeld : 0;

          return (
            <div
              key={tier.id}
              onClick={() => {
                if (!isBlocked) {
                  setSelectedTierId(tier.id);
                  if (!quantities[tier.id]) {
                    setQuantities((prev) => ({ ...prev, [tier.id]: 1 }));
                  }
                }
              }}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                isBlocked
                  ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-[#6D28D9] bg-purple-50/40 shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-sm">{tier.name}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#6D28D9] text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                    {tier.description}
                  </p>

                  {/* Cutoff / Limit notes */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span>Max {tier.perOrderMax} per order</span>
                    {tier.salesCutoff && (
                      <span>
                        Ends: {new Date(tier.salesCutoff).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price & Availability Column */}
                <div className="text-right shrink-0">
                  <div className="text-lg font-extrabold text-gray-900">
                    ${tier.price}
                  </div>
                  <div className="mt-1">
                    {isCutoff ? (
                      <Badge variant="danger" size="sm">
                        Sales Closed
                      </Badge>
                    ) : isSoldOut ? (
                      <Badge variant="danger" size="sm">
                        Sold Out
                      </Badge>
                    ) : remaining <= 10 ? (
                      <Badge variant="warning" size="sm">
                        Only {remaining} left
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        {remaining} Available
                      </Badge>
                    )}
                  </div>

                  {held > 0 && !isSoldOut && (
                    <div className="text-[10px] text-amber-600 font-medium mt-1 flex items-center justify-end gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{held} held in checkout</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Tier Quantity & Hold Action */}
      {selectedTier && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span>Select Quantity (Max {selectedTier.perOrderMax}):</span>
            </label>

            {/* Quantity Selector */}
            <div className="flex items-center gap-2">
              <select
                value={currentQuantity}
                onChange={(e) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [selectedTier.id]: parseInt(e.target.value, 10),
                  }))
                }
                disabled={isHolding || (selectedAvail?.available || 0) <= 0}
                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {Array.from(
                  {
                    length: Math.min(
                      selectedTier.perOrderMax,
                      Math.max(1, selectedAvail?.available || 1)
                    ),
                  },
                  (_, i) => i + 1
                ).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'ticket' : 'tickets'} (${selectedTier.price * n})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 text-sm">
            <span className="text-gray-600">Total Subtotal:</span>
            <span className="text-lg font-bold text-gray-900">
              ${selectedTier.price * currentQuantity}
            </span>
          </div>

          {/* Hold Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isHolding}
            disabled={isHolding || (selectedAvail?.available || 0) < currentQuantity || selectedAvail?.isCutoffReached}
            onClick={handleHoldTickets}
            icon={<Lock className="w-4 h-4" />}
          >
            {isHolding
              ? 'Acquiring Exclusive Tier Lock...'
              : (selectedAvail?.available || 0) <= 0
              ? 'Tier Sold Out'
              : `Lock Tickets & Proceed ($${selectedTier.price * currentQuantity})`}
          </Button>

          <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-purple-600" />
            <span>Holds inventory exclusively for 10 min while you check out.</span>
          </p>
        </div>
      )}
    </div>
  );
};
