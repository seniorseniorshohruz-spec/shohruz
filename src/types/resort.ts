export type Language = 'uz' | 'ru' | 'en';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RECEPTION = 'RECEPTION',
  ADMIN = 'ADMIN',
}

export type RoomCategory = 'Standard' | 'Deluxe' | 'Family' | 'Luxury' | 'VIP';

export type PhysicalRoomStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'CLEANING'
  | 'MAINTENANCE';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED';

export type EmailCategory =
  | 'NEW_BOOKINGS'
  | 'CUSTOMER_QUESTIONS'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface LocalizedText {
  uz: string;
  ru: string;
  en: string;
}

export interface Room {
  id: string;
  category: RoomCategory;
  name: LocalizedText;
  description: LocalizedText;
  pricePerNight: number;
  rating: number;
  maxGuests: number;
  bedType: LocalizedText;
  sizeSqm: number;
  hasWifi: boolean;
  hasAc: boolean;
  bathroomCount: number;
  seaView: LocalizedText;
  available: boolean;
  image: string;
  VisualTheme?: 'coastal' | 'suite' | 'villa' | 'family' | 'penthouse';
}

export interface PhysicalRoom {
  unitNumber: string;
  roomTypeId: string;
  category: RoomCategory;
  floor: number;
  status: PhysicalRoomStatus;
  currentGuestName?: string;
  currentBookingId?: string;
}

export interface BeachService {
  id: string;
  code: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  duration: LocalizedText;
  available: boolean;
  image: string;
  categoryTag: LocalizedText;
}

export interface Booking {
  id: string;
  customerId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  roomCategory: RoomCategory;
  assignedUnitNumber?: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  nights: number;
  guests: number;
  serviceIds: string[];
  roomTotal: number;
  servicesTotal: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  active: boolean;
  requirePasswordChange?: boolean;
  shift?: string;
  createdAt: string;
}

export interface EmailReply {
  id: string;
  senderName: string;
  senderEmail?: string;
  receiverEmail?: string;
  senderRole: UserRole;
  message: string;
  date: string;
  time?: string;
  read?: boolean;
}

export interface ResortEmail {
  id: string;
  category: EmailCategory;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: LocalizedText;
  message: LocalizedText;
  date: string;
  time?: string;
  read: boolean;
  bookingId?: string;
  replies: EmailReply[];
}

export interface AppNotification {
  id: string;
  targetRole: 'ALL' | UserRole;
  targetUserId?: string;
  targetEmail?: string;
  type:
    | 'NEW_BOOKING'
    | 'BOOKING_CONFIRMED'
    | 'BOOKING_CANCELLED'
    | 'BOOKING_REJECTED'
    | 'GUEST_CHECKIN'
    | 'GUEST_CHECKOUT'
    | 'NEW_MESSAGE';
  title: LocalizedText;
  description: LocalizedText;
  createdAt: string;
  read: boolean;
  bookingId?: string;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  customerId: string;
  guestName: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  createdAt: string;
}

export interface CheckInOutRecord {
  id: string;
  bookingId: string;
  guestName: string;
  unitNumber: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  handledBy: string;
}

export interface ResortSettings {
  resortName: string;
  supportEmail: string;
  supportPhone: string;
  address: LocalizedText;
  checkInTime: string;
  checkOutTime: string;
  currency: string;
  taxPercent: number;
}
