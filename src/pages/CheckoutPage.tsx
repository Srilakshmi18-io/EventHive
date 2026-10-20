import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { processPayment } from '../services/payment';
import { Reservation, TicketTier, EventItem, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Lock,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  User,
  Mail,
  CheckCircle2,
  Calendar,
  MapPin,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    reservation: Reservation;
    tier: TicketTier;
    event: EventItem;
  } | null>(null);

  // Form states
  const [attendeeName, setAttendeeName] = useState(user?.name || 'Alex Rivera');
  const [attendeeEmail, setAttendeeEmail] = useState(user?.email || 'alex.rivera@example.com');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardHolder, setCardHolder] = useState(user?.name || 'Alex Rivera');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');

  // Payment states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  // Idempotency Key unique to this checkout instance
  const idempotencyKeyRef = useRef<string>(
    `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  useEffect(() => {
    if (!reservationId) return;

    eventService.getReservationById(reservationId).then((res) => {
      if (!res || res.reservation.status !== 'ACTIVE') {
        setIsExpired(true);
      } else {
        setData(res);
        if (user) {
          setAttendeeName(user.name);
          setAttendeeEmail(user.email);
          setCardHolder(user.name);
        }
      }
      setLoading(false);
    });
  }, [reservationId, user]);

  const handleTimerExpired = () => {
    setIsExpired(true);
    toast('Your ticket hold has expired and tickets were restored to the pool.', 'error', 'Hold Expired');
  };

  const handleQuickFillCard = (type: 'APPROVE' | 'REJECT') => {
    if (type === 'APPROVE') {
      setCardNumber('4242 4242 4242 4242');
      setCvv('123');
      toast('Filled Test Card: Always Approves', 'info');
    } else {
      setCardNumber('4000 0000 0000 0002');
      setCvv('999');
      toast('Filled Test Card: Forces Card Decline', 'info');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    if (isExpired) {
      toast('Cannot process payment: Ticket reservation hold has expired.', 'error');
      return;
    }

    setIsProcessing(true);
    setPaymentPhase('Verifying inventory hold lease & creating pending order...');

    try {
      // 1. Create or retrieve PENDING order with idempotency token
      const order = await eventService.createPendingOrder({
        reservationId: data.reservation.id,
        attendeeName,
        attendeeEmail,
        idempotencyKey: idempotencyKeyRef.current,
      });

      setPaymentPhase('Contacting payment processing gateway (2.5s delay)...');

      // 2. Dispatch payment with idempotency key
      const result = await processPayment(
        {
          orderId: order.id,
          cardDetails: {
            cardNumber,
            cardHolder,
            expiryMonth: expiry.split('/')[0] || '12',
            expiryYear: expiry.split('/')[1] || '28',
            cvv,
          },
          idempotencyKey: idempotencyKeyRef.current,
        },
        (status) => {
          if (status === 'PROCESSING') {
            setPaymentPhase('Authorizing credit card and issuing secure digital tickets...');
          }
        }
      );

      // Navigate to payment result page
      navigate(`/payment-result/${order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment error occurred';
      toast(msg, 'error', 'Payment Unsuccessful');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#6D28D9] animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Retrieving locked reservation lease...</p>
      </div>
    );
  }

  if (isExpired || !data) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Reservation Hold Expired</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          The 10-minute checkout window has elapsed. To prevent inventory hoarding, your held tickets
          have been automatically released and restored to the public pool.
        </p>
        <div className="pt-2">
          <Link to="/events">
            <Button variant="primary">Return to Events &amp; Re-select</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { reservation, tier, event } = data;
  const subtotal = tier.price * reservation.quantity;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Link */}
      <Link
        to={`/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Event Details</span>
      </Link>

      {/* Live Hold Countdown Timer */}
      <CountdownTimer
        expiresAt={reservation.expiresAt}
        onExpire={handleTimerExpired}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Checkout Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#6D28D9]" />
              <span>Checkout &amp; Payment</span>
            </h2>
            <div className="flex items-center gap-1 text-[11px] font-mono text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Idempotent SSL</span>
            </div>
          </div>

          <form onSubmit={handleSubmitPayment} className="space-y-6">
            {/* Attendee Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                1. Attendee Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Primary Attendee Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={attendeeName}
                      onChange={(e) => setAttendeeName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ticket Delivery Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={attendeeEmail}
                      onChange={(e) => setAttendeeEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  2. Payment Method
                </h3>
                <span className="text-[11px] text-purple-700 font-semibold">Simulated Stripe Gateway</span>
              </div>

              {/* Quick Fill Test Cards */}
              <div className="bg-purple-50/50 rounded-xl p-3 border border-purple-100 space-y-2">
                <span className="text-[11px] font-semibold text-purple-900 block">
                  Quick-Fill Test Cards:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFillCard('APPROVE')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-xs font-mono font-medium text-emerald-800 hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>4242 4242 (Always Approves)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFillCard('REJECT')}
                    className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-xs font-mono font-medium text-rose-800 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>4000 0002 (Always Rejects)</span>
                  </button>
                </div>
              </div>

              {/* Card Inputs */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="12/28"
                    className="w-full px-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Idempotency Token Note */}
            <div className="text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-xl font-mono flex items-center justify-between">
              <span>Token: {idempotencyKeyRef.current}</span>
              <span className="text-emerald-600 font-sans font-medium">Double-click protected</span>
            </div>

            {/* Pay Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isProcessing}
              disabled={isProcessing || isExpired}
              icon={<Lock className="w-4 h-4" />}
            >
              {isProcessing ? 'Processing Transaction...' : `Pay $${subtotal} & Issue Tickets`}
            </Button>
          </form>

          {/* Processing Overlay Message */}
          {isProcessing && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center animate-pulse">
              <span className="text-xs font-semibold text-purple-900 block">
                {paymentPhase}
              </span>
              <span className="text-[11px] text-purple-700">
                Please do not close or refresh this tab.
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
          <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
            Order Summary
          </h3>

          <div className="flex gap-4">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-gray-900 line-clamp-2">
                {event.title}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{new Date(event.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-900">{tier.name}</span>
              <span className="font-bold text-purple-900">${tier.price} &times; {reservation.quantity}</span>
            </div>
            <p className="text-[11px] text-purple-700 leading-snug">
              {tier.description}
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Ticket Subtotal:</span>
              <span className="font-semibold text-gray-900">${subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Platform Service Fee:</span>
              <span className="font-semibold text-emerald-600">$0.00 (Waived)</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total Due:</span>
              <span className="text-[#6D28D9]">${subtotal}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Your seats are held securely. Completing payment will issue your printable QR ticket pass immediately.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
