import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { db } from '../services/db';
import { Order, Ticket, Payment } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { TicketPass } from '../components/tickets/TicketPass';
import {
  CheckCircle2,
  XCircle,
  Ticket as TicketIcon,
  ArrowRight,
  RefreshCw,
  Calendar,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const PaymentResultPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const ord = db.getOrderById(orderId);
    if (ord) {
      setOrder(ord);
      if (ord.paymentId) {
        const pay = db.getPayments().find((p) => p.id === ord.paymentId);
        if (pay) setPayment(pay);
      }
      const tkts = db.getTicketsByOrderId(orderId);
      setTickets(tkts);

      if (ord.status === 'PAID') {
        // Trigger celebratory confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6D28D9', '#10B981', '#F59E0B', '#3B82F6'],
          });
        } catch {
          // fallback if confetti fails
        }
      }
    }

    setLoading(false);
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#6D28D9] animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Confirming payment settlement...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
        <Link to="/events">
          <Button variant="primary">Return to Events</Button>
        </Link>
      </div>
    );
  }

  const isSuccess = order.status === 'PAID';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {isSuccess ? (
        <div className="space-y-8">
          {/* Success Banner */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 block mb-1">
                Payment Authorized &amp; Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                You&apos;re Going to {order.eventTitle}!
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Confirmation #{order.id} &bull; Transaction ID: {payment?.transactionId}
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="max-w-md mx-auto bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs space-y-2 text-left">
              <div className="flex justify-between text-gray-600">
                <span>Tier &amp; Seats:</span>
                <span className="font-bold text-gray-900">
                  {order.quantity}x {order.tierName}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Amount Charged:</span>
                <span className="font-extrabold text-emerald-700">${order.totalAmount}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Method:</span>
                <span className="font-medium text-gray-900 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Ending in &bull;&bull;&bull;&bull; {payment?.cardLast4 || '4242'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Attendee Name:</span>
                <span className="font-medium text-gray-900">{order.attendeeName}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/my-tickets">
                <Button variant="primary" icon={<TicketIcon className="w-4 h-4" />}>
                  View In Digital Ticket Wallet
                </Button>
              </Link>
              <Link to="/events">
                <Button variant="secondary">Browse More Events</Button>
              </Link>
            </div>
          </div>

          {/* Ticket Passes Render */}
          {tickets.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Your Official Admission Passes</h3>
                <p className="text-xs text-gray-500">
                  Each ticket is encoded with a unique QR code. Print or save to your phone for venue entry.
                </p>
              </div>

              <div className="space-y-6">
                {tickets.map((t) => (
                  <TicketPass key={t.id} ticket={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Failure Screen */
        <div className="bg-white rounded-3xl border border-rose-200 p-8 sm:p-12 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <XCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 block">
              Transaction Declined
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Payment Could Not Be Processed
            </h1>
            <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              {payment?.errorReason ||
                'The issuing bank declined authorization. Your temporary ticket hold has been released and returned to the public pool.'}
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Inventory Released Automatically</span>
              <p className="leading-snug">
                Because the payment was not approved, the tier lock was released to ensure other
                buyers can reserve tickets without artificial stock shortages.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to={`/events/${order.eventId}`}>
              <Button variant="primary">Re-Select Tickets &amp; Try Again</Button>
            </Link>
            <Link to="/events">
              <Button variant="secondary">Browse All Events</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
