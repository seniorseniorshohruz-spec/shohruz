import {
  AppNotification,
  BeachService,
  Booking,
  PaymentRecord,
  PhysicalRoom,
  PhysicalRoomStatus,
  ResortEmail,
  ResortSettings,
  Room,
  UserAccount,
  UserRole,
} from '../types/resort';

const TOKEN_KEY = 'beach_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export interface BookedSlot {
  id: string;
  roomId: string;
  roomCategory: string;
  assignedUnitNumber?: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

export interface ServerStatePayload {
  rooms: Room[];
  physicalRooms: PhysicalRoom[];
  services: BeachService[];
  bookings: Booking[];
  bookedSlots: BookedSlot[];
  emails: ResortEmail[];
  notifications: AppNotification[];
  payments: PaymentRecord[];
  users: UserAccount[];
  settings: ResortSettings;
  currentUser: UserAccount | null;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    console.error('Network request error:', networkErr);
    throw new Error('Xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // ignore non-json
  }

  if (!response.ok) {
    const userMessage =
      data?.error || 'Xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.';
    throw new Error(userMessage);
  }

  return data as T;
}

export const resortApi = {
  getState: () => apiRequest<ServerStatePayload>('/api/state'),

  checkAvailability: (checkIn: string, checkOut: string, guests: number) =>
    apiRequest<{
      checkIn: string;
      checkOut: string;
      nights: number;
      availabilityByRoomId: Record<
        string,
        { available: boolean; freeUnits: string[]; reason?: string }
      >;
    }>(
      `/api/availability?checkIn=${encodeURIComponent(
        checkIn
      )}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}`
    ),

  login: async (payload: {
    email: string;
    password: string;
    mode?: 'login' | 'admin';
  }) => {
    const res = await apiRequest<{ token: string; user: UserAccount }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(res.token);
    return res.user;
  },

  register: async (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => {
    const res = await apiRequest<{ token: string; user: UserAccount }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    setAuthToken(res.token);
    return res.user;
  },

  logout: async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  updateCustomerProfile: (payload: {
    fullName: string;
    phone: string;
    newPassword?: string;
  }) =>
    apiRequest<{ user: UserAccount }>('/api/customer/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  createBooking: (payload: {
    roomId: string;
    preferredUnitNumber?: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    serviceIds: string[];
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    specialRequests?: string;
  }) =>
    apiRequest<{ booking: Booking }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  cancelBooking: (bookingId: string) =>
    apiRequest<{ booking: Booking }>(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
    }),

  confirmBooking: (bookingId: string, unitNumber?: string) =>
    apiRequest<{ booking: Booking }>(`/api/reception/bookings/${bookingId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ unitNumber }),
    }),

  rejectBooking: (bookingId: string) =>
    apiRequest<{ booking: Booking }>(`/api/reception/bookings/${bookingId}/reject`, {
      method: 'POST',
    }),

  checkInGuest: (bookingId: string, unitNumber?: string) =>
    apiRequest<{ booking: Booking }>(`/api/reception/bookings/${bookingId}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ unitNumber }),
    }),

  checkOutGuest: (bookingId: string, unitNumber?: string) =>
    apiRequest<{ booking: Booking }>(`/api/reception/bookings/${bookingId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ unitNumber }),
    }),

  updatePhysicalRoomStatus: (unitNumber: string, status: PhysicalRoomStatus) =>
    apiRequest<{ unit: PhysicalRoom }>(
      `/api/reception/physical-rooms/${unitNumber}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ status }),
      }
    ),

  assignRoomToBooking: (bookingId: string, unitNumber: string) =>
    apiRequest<{ booking: Booking }>(
      `/api/reception/bookings/${bookingId}/assign-room`,
      {
        method: 'POST',
        body: JSON.stringify({ unitNumber }),
      }
    ),

  sendMessage: (payload: {
    senderName?: string;
    senderEmail?: string;
    recipientEmail?: string;
    subject: string;
    message: string;
    bookingId?: string;
  }) =>
    apiRequest<{ email: ResortEmail }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  replyEmail: (emailId: string, message: string) =>
    apiRequest<{ email: ResortEmail }>(`/api/messages/${emailId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  markEmailRead: (emailId: string) =>
    apiRequest<{ email: ResortEmail }>(`/api/messages/${emailId}/read`, {
      method: 'POST',
    }),

  sendReceptionTemplate: (
    bookingId: string,
    templateType: 'CHECKIN_INFO' | 'CHECKOUT_INFO' | 'CONFIRMED'
  ) =>
    apiRequest<{ email: ResortEmail }>('/api/reception/send-template', {
      method: 'POST',
      body: JSON.stringify({ bookingId, templateType }),
    }),

  markNotificationRead: (id?: string, all?: boolean) =>
    apiRequest('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id, all }),
    }),

  // Admin CRUD
  adminAddRoom: (room: Partial<Room>) =>
    apiRequest<{ room: Room }>('/api/admin/rooms', {
      method: 'POST',
      body: JSON.stringify(room),
    }),

  adminUpdateRoom: (id: string, room: Partial<Room>) =>
    apiRequest<{ room: Room }>(`/api/admin/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(room),
    }),

  adminDeleteRoom: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/admin/rooms/${id}`, {
      method: 'DELETE',
    }),

  adminAddService: (srv: Partial<BeachService>) =>
    apiRequest<{ service: BeachService }>('/api/admin/services', {
      method: 'POST',
      body: JSON.stringify(srv),
    }),

  adminUpdateService: (id: string, srv: Partial<BeachService>) =>
    apiRequest<{ service: BeachService }>(`/api/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(srv),
    }),

  adminDeleteService: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/admin/services/${id}`, {
      method: 'DELETE',
    }),

  adminCreateUser: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    shift?: string;
    role?: UserRole;
  }) =>
    apiRequest<{ user: UserAccount }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminUpdateUser: (id: string, payload: Partial<UserAccount>) =>
    apiRequest<{ user: UserAccount }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  adminUpdateBooking: (id: string, payload: Partial<Booking>) =>
    apiRequest<{ booking: Booking }>(`/api/admin/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  adminUpdateSettings: (payload: Partial<ResortSettings>) =>
    apiRequest<{ settings: ResortSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
