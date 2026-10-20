export type Role = 'ADMIN' | 'ORGANIZER' | 'ATTENDEE';

export type OrganizerStatus = 'APPROVED' | 'PENDING' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  organizationName?: string;
  organizerStatus?: OrganizerStatus;
  createdAt: string;
}

export type EventCategory = 'Tech' | 'Music' | 'Conference' | 'Workshop' | 'Comedy' | 'Sports';
export type VenueType = 'IN_PERSON' | 'ONLINE' | 'HYBRID';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';

export interface EventItem {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  venueType: VenueType;
  startDate: string;
  endDate: string;
  imageUrl: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TicketTier {
  id: string;
  eventId: string;
  name: string;
  description: string;
  price: number;
  totalQuantity: number;
  perOrderMax: number;
  salesCutoff: string;
  sortOrder: number;
}

export type ReservationStatus = 'ACTIVE' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED';

export interface Reservation {
  id: string;
  ticketTierId: string;
  eventId: string;
  userId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string; // ISO String
  createdAt: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface Order {
  id: string;
  reservationId: string;
  ticketTierId: string;
  tierName: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  attendeeName: string;
  attendeeEmail: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  paymentId?: string;
  idempotencyKey: string;
  createdAt: string;
}

export type PaymentStatus = 'PROCESSING' | 'APPROVED' | 'REJECTED';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  cardLast4: string;
  status: PaymentStatus;
  transactionId: string;
  errorReason?: string;
  createdAt: string;
}

export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';

export interface Ticket {
  id: string;
  orderId: string;
  ticketTierId: string;
  tierName: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  userId: string;
  ticketCode: string;
  qrData: string;
  attendeeName: string;
  status: TicketStatus;
  createdAt: string;
}

export interface TierAvailability {
  tierId: string;
  total: number;
  sold: number;
  activeHeld: number;
  available: number;
  isSoldOut: boolean;
  isCutoffReached: boolean;
}

export interface StressTestResult {
  tierId: string;
  tierName: string;
  totalCapacity: number;
  initialAvailable: number;
  requestCount: number;
  succeededCount: number;
  rejectedCount: number;
  finalSold: number;
  finalHeld: number;
  finalAvailable: number;
  oversold: boolean;
  durationMs: number;
  logs: Array<{
    requestId: number;
    timestamp: string;
    status: 'SUCCESS' | 'REJECTED';
    reservationId?: string;
    message: string;
  }>;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalTicketsSold: number;
  activeHoldsCount: number;
  totalOrders: number;
  paidOrdersCount: number;
  conversionRate: number; // percentage
  revenueOverTime: Array<{ date: string; revenue: number; tickets: number }>;
  tierSales: Array<{ tierName: string; sold: number; revenue: number; available: number; held: number }>;
  recentOrders: Order[];
}
