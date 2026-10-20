/**
 * ============================================================================
 * PAYMENT GATEWAY MOCK & IDEMPOTENCY ENGINE
 * ============================================================================
 * REAL-WORLD EQUIVALENT:
 * 1. Stripe Payment Intents API:
 *    Stripe processes payments with an `Idempotency-Key: <UUID>` header.
 *    If a network hiccup or double-click re-submits the exact same key,
 *    Stripe replays the original response without double-charging the customer.
 * 2. Webhook / Asynchronous Settlement:
 *    Transactions return a `PROCESSING` status while communicating with
 *    banking rails (3D Secure, Visa/Mastercard networks), followed by an
 *    event-driven transition to `succeeded` or `failed`.
 * ============================================================================
 */

import { db } from './db';
import { runTransaction } from './mutex';
import { systemCache } from './cache';
import { Order, Payment, Ticket } from '../types';

export interface CardDetails {
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface PaymentProcessInput {
  orderId: string;
  cardDetails: CardDetails;
  idempotencyKey: string;
}

export interface PaymentResult {
  success: boolean;
  status: 'APPROVED' | 'REJECTED';
  order: Order;
  payment: Payment;
  tickets?: Ticket[];
  error?: string;
  replayedFromIdempotency?: boolean;
}

// In-memory idempotency response ledger (simulating Redis/DB idempotency table)
const idempotencyStore = new Map<string, PaymentResult>();

/**
 * Validates and records idempotency key to prevent double charging on network retry
 */
export function checkIdempotency(key: string): PaymentResult | null {
  return idempotencyStore.get(key) || null;
}

/**
 * Core Payment Processing Mock
 */
export async function processPayment(
  input: PaymentProcessInput,
  onStatusUpdate?: (status: 'PROCESSING' | 'APPROVED' | 'REJECTED') => void
): Promise<PaymentResult> {
  const { orderId, cardDetails, idempotencyKey } = input;

  // 1. IDEMPOTENCY CHECK
  const cachedResult = checkIdempotency(idempotencyKey);
  if (cachedResult) {
    console.warn(`[Idempotency] Replaying cached response for key: ${idempotencyKey}`);
    return { ...cachedResult, replayedFromIdempotency: true };
  }

  // 2. RETRIEVE ORDER & RESERVATION
  const order = db.getOrderById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  const reservation = db.getReservationById(order.reservationId);
  if (!reservation) {
    throw new Error('Associated ticket reservation not found');
  }

  // Check if reservation is still active
  const now = new Date();
  if (reservation.status !== 'ACTIVE' || new Date(reservation.expiresAt) <= now) {
    throw new Error('Ticket reservation hold has expired. Please select tickets again.');
  }

  // 3. EMIT IMMEDIATE "PROCESSING" STATUS
  if (onStatusUpdate) {
    onStatusUpdate('PROCESSING');
  }

  // 4. ARTIFICIAL NETWORK & BANKING LATENCY (2.5 seconds)
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Clean credit card number
  const cleanNumber = cardDetails.cardNumber.replace(/\s+/g, '');
  const last4 = cleanNumber.slice(-4) || '4242';

  // 5. DETERMINE APPROVAL / REJECTION
  let isApproved = false;
  let errorReason: string | undefined = undefined;

  if (cleanNumber === '4242424242424242') {
    isApproved = true;
  } else if (cleanNumber === '4000000000000002') {
    isApproved = false;
    errorReason = 'Card declined: Insufficient funds or test card forced rejection.';
  } else {
    // 80% approve, 20% reject for realistic randomness
    const random = Math.random();
    if (random < 0.8) {
      isApproved = true;
    } else {
      isApproved = false;
      errorReason = 'Card declined: Processor rejected authorization code.';
    }
  }

  // 6. ATOMIC ORDER TRANSITION UNDER TIER LOCK
  const lockKey = `tier_lock_${reservation.ticketTierId}`;

  const result = await runTransaction(lockKey, async () => {
    // Re-verify reservation hasn't expired during processing latency
    const freshRes = db.getReservationById(reservation.id);
    if (!freshRes || freshRes.status !== 'ACTIVE') {
      const failedPayment: Payment = {
        id: `pay_${Date.now()}_fail`,
        orderId: order.id,
        amount: order.totalAmount,
        cardLast4: last4,
        status: 'REJECTED',
        transactionId: `txn_err_${Math.random().toString(36).substring(2, 9)}`,
        errorReason: 'Reservation expired during payment processing window.',
        createdAt: new Date().toISOString(),
      };
      db.savePayment(failedPayment);
      order.status = 'FAILED';
      db.saveOrder(order);

      const res: PaymentResult = {
        success: false,
        status: 'REJECTED',
        order,
        payment: failedPayment,
        error: 'Hold expired during payment authorization.',
      };
      idempotencyStore.set(idempotencyKey, res);
      return res;
    }

    if (isApproved) {
      // Create Payment Record
      const payment: Payment = {
        id: `pay_${Date.now()}`,
        orderId: order.id,
        amount: order.totalAmount,
        cardLast4: last4,
        status: 'APPROVED',
        transactionId: `txn_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        createdAt: new Date().toISOString(),
      };
      db.savePayment(payment);

      // Update Order
      order.status = 'PAID';
      order.paymentId = payment.id;
      db.saveOrder(order);

      // Complete Reservation
      freshRes.status = 'COMPLETED';
      db.saveReservation(freshRes);

      // Generate Unique Tickets with QR codes
      const event = db.getEventById(order.eventId);
      const generatedTickets: Ticket[] = [];
      const tierShort = order.tierName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GA';
      const year = new Date().getFullYear();

      for (let i = 0; i < order.quantity; i++) {
        const serial = Math.floor(1000 + Math.random() * 9000);
        const ticketCode = `EH-${tierShort}-${year}-${serial}${i > 0 ? `-${i + 1}` : ''}`;
        const ticket: Ticket = {
          id: `tkt_${Date.now()}_${i}`,
          orderId: order.id,
          ticketTierId: order.ticketTierId,
          tierName: order.tierName,
          eventId: order.eventId,
          eventTitle: order.eventTitle,
          eventDate: event?.startDate || new Date().toISOString(),
          eventLocation: event?.location || 'Main Venue',
          userId: order.userId,
          ticketCode,
          qrData: `EVENTHIVE:TKT:${ticketCode}:${order.eventId}:${order.userId}:${i + 1}`,
          attendeeName: i === 0 ? order.attendeeName : `${order.attendeeName} (Guest ${i + 1})`,
          status: 'VALID',
          createdAt: new Date().toISOString(),
        };
        generatedTickets.push(ticket);
      }
      db.saveTickets(generatedTickets);

      // Invalidate relevant caches
      systemCache.invalidatePrefix('events');
      systemCache.invalidatePrefix('tier');
      systemCache.invalidatePrefix('organizer');

      const res: PaymentResult = {
        success: true,
        status: 'APPROVED',
        order,
        payment,
        tickets: generatedTickets,
      };
      idempotencyStore.set(idempotencyKey, res);
      return res;
    } else {
      // Payment Failed: release the hold immediately so inventory is restored
      freshRes.status = 'CANCELLED';
      db.saveReservation(freshRes);

      const payment: Payment = {
        id: `pay_${Date.now()}_fail`,
        orderId: order.id,
        amount: order.totalAmount,
        cardLast4: last4,
        status: 'REJECTED',
        transactionId: `txn_fail_${Math.random().toString(36).substring(2, 9)}`,
        errorReason,
        createdAt: new Date().toISOString(),
      };
      db.savePayment(payment);

      order.status = 'FAILED';
      order.paymentId = payment.id;
      db.saveOrder(order);

      // Invalidate cache since hold was freed
      systemCache.invalidatePrefix('events');
      systemCache.invalidatePrefix('tier');

      const res: PaymentResult = {
        success: false,
        status: 'REJECTED',
        order,
        payment,
        error: errorReason,
      };
      idempotencyStore.set(idempotencyKey, res);
      return res;
    }
  });

  if (onStatusUpdate) {
    onStatusUpdate(result.status);
  }

  return result;
}
