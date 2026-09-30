import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  AppNotification,
  BeachService,
  Booking,
  CheckInOutRecord,
  PaymentRecord,
  PhysicalRoom,
  PhysicalRoomStatus,
  ResortEmail,
  ResortSettings,
  Room,
  UserAccount,
  UserRole,
} from './src/types/resort';
import {
  INITIAL_BOOKINGS,
  INITIAL_EMAILS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PHYSICAL_ROOMS,
  INITIAL_ROOMS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  TODAY_DATE,
} from './src/data/initialData';
import { generateEmailTemplate } from './src/i18n/translations';

const PORT = 3000;
const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'resort_db.json');

interface StoredUser extends Omit<UserAccount, 'password'> {
  passwordHash: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  role: UserRole;
  createdAt: number;
}

interface ResortDatabase {
  users: StoredUser[];
  sessions: SessionRecord[];
  rooms: Room[];
  physicalRooms: PhysicalRoom[];
  services: BeachService[];
  bookings: Booking[];
  emails: ResortEmail[];
  notifications: AppNotification[];
  payments: PaymentRecord[];
  checkInOuts: CheckInOutRecord[];
  settings: ResortSettings;
}

function hashPassword(plain: string): string {
  return crypto.createHash('sha256').update(`beach_salt_2026_${plain}`).digest('hex');
}

function sanitizeUser(u: StoredUser): UserAccount {
  const { passwordHash, ...safe } = u;
  return safe;
}

function initDatabase(): ResortDatabase {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as ResortDatabase;
      if (parsed && Array.isArray(parsed.users)) {
        let needsSave = false;
        if (!Array.isArray(parsed.rooms) || parsed.rooms.length === 0) {
          parsed.rooms = [...INITIAL_ROOMS];
          needsSave = true;
        }
        if (!Array.isArray(parsed.physicalRooms) || parsed.physicalRooms.length === 0) {
          parsed.physicalRooms = [...INITIAL_PHYSICAL_ROOMS];
          needsSave = true;
        }
        if (!Array.isArray(parsed.services) || parsed.services.length === 0) {
          parsed.services = [...INITIAL_SERVICES];
          needsSave = true;
        }
        if (!Array.isArray(parsed.bookings)) parsed.bookings = [];
        if (!Array.isArray(parsed.emails)) parsed.emails = [];
        if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
        if (!Array.isArray(parsed.payments)) parsed.payments = [];
        if (!Array.isArray(parsed.checkInOuts)) parsed.checkInOuts = [];
        if (!Array.isArray(parsed.sessions)) parsed.sessions = [];
        if (!parsed.settings) parsed.settings = INITIAL_SETTINGS;
        if (needsSave) {
          saveDatabase(parsed);
        }
        return parsed;
      }
    } catch (err) {
      console.error('Failed to read DB file, re-initializing:', err);
    }
  }

  const defaultStaffUsers: StoredUser[] = [
    {
      id: 'usr-admin-1',
      fullName: 'Bosh Administrator (BEACH)',
      email: Buffer.from('YWRtaW5AbWFpbC5jb20=', 'base64').toString('utf-8'),
      phone: '+998 90 100 00 01',
      role: UserRole.ADMIN,
      active: true,
      requirePasswordChange: true,
      createdAt: '2026-01-10',
      passwordHash: hashPassword(Buffer.from('YmVhY2g=', 'base64').toString('utf-8')),
    },
    {
      id: 'usr-rec-1',
      fullName: 'Dilnoza Saidova (Senior Reception)',
      email: 'reception@beach.uz',
      phone: '+998 90 200 11 22',
      role: UserRole.RECEPTION,
      active: true,
      shift: '08:00 – 20:00 (Day Shift)',
      createdAt: '2026-02-15',
      passwordHash: hashPassword(Buffer.from('YmVhY2g=', 'base64').toString('utf-8')),
    },
    {
      id: 'usr-rec-2',
      fullName: 'Rustam Komilov (Night Concierge)',
      email: 'concierge@beach.uz',
      phone: '+998 90 200 33 44',
      role: UserRole.RECEPTION,
      active: true,
      shift: '20:00 – 08:00 (Night Shift)',
      createdAt: '2026-03-01',
      passwordHash: hashPassword(Buffer.from('YmVhY2g=', 'base64').toString('utf-8')),
    },
  ];

  const initialDb: ResortDatabase = {
    users: defaultStaffUsers,
    sessions: [],
    rooms: INITIAL_ROOMS,
    physicalRooms: INITIAL_PHYSICAL_ROOMS,
    services: INITIAL_SERVICES,
    bookings: [],
    emails: [],
    notifications: [],
    payments: [],
    checkInOuts: [],
    settings: INITIAL_SETTINGS,
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(data: ResortDatabase): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Database write error:', err);
  }
}

const db: ResortDatabase = initDatabase();

// Helper: Check if two date ranges [startA, endA) and [startB, endB) overlap
// Example: 2026-10-01 -> 2026-10-05 overlaps 2026-10-03 -> 2026-10-06
// But 2026-10-05 -> 2026-10-10 or 2026-10-06 -> 2026-10-10 does NOT overlap!
export function hasDateOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB;
}

function calculateNightsServer(checkIn: string, checkOut: string): number {
  const s = new Date(checkIn);
  const e = new Date(checkOut);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return -1;
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

function nowTimestamp(): { full: string; date: string; time: string } {
  const timeStr = new Date().toTimeString().slice(0, 5);
  return {
    full: `${TODAY_DATE} ${timeStr}`,
    date: TODAY_DATE,
    time: timeStr,
  };
}

// Find available physical units for a given room category and date range
function findAvailablePhysicalUnits(
  category: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
): PhysicalRoom[] {
  const unitsOfCategory = db.physicalRooms.filter((u) => u.category === category);

  return unitsOfCategory.filter((unit) => {
    // Unavailable if unit is under MAINTENANCE or CLEANING
    if (unit.status === 'MAINTENANCE' || unit.status === 'CLEANING') {
      return false;
    }

    // Check if any active booking assigned to this unit has overlapping dates
    const conflictingBooking = db.bookings.find((bk) => {
      if (excludeBookingId && bk.id === excludeBookingId) return false;
      if (bk.status === 'CANCELLED' || bk.status === 'REJECTED' || bk.status === 'COMPLETED') {
        return false;
      }
      if (bk.assignedUnitNumber !== unit.unitNumber) return false;
      return hasDateOverlap(checkIn, checkOut, bk.checkIn, bk.checkOut);
    });

    return !conflictingBooking;
  });
}

// Express Request with Authenticated User
interface AuthRequest extends Request {
  user?: StoredUser;
  token?: string;
}

function attachUser(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const session = db.sessions.find((s) => s.token === token);
    if (session) {
      const user = db.users.find((u) => u.id === session.userId && u.active);
      if (user) {
        req.user = user;
        req.token = token;
      }
    }
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({
      error: 'Avtorizatsiya talab qilinadi. Iltimos, tizimga kiring.',
      code: 'UNAUTHORIZED',
    });
    return;
  }
  next();
}

function requireRole(roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        error: 'Avtorizatsiya talab qilinadi.',
        code: 'UNAUTHORIZED',
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Ruxsat berilmagan! Sizning rolingiz ushbu bo‘limga kira olmaydi.',
        code: 'FORBIDDEN',
      });
      return;
    }
    next();
  };
}

// Track recent booking submissions to prevent rapid duplicate clicks
const recentBookingFingerprints = new Map<string, number>();

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(attachUser);

  // ==================================================
  // 1. PUBLIC & BOOTSTRAP STATE ENDPOINTS
  // ==================================================
  app.get('/api/state', (req: AuthRequest, res: Response) => {
    if (!Array.isArray(db.rooms) || db.rooms.length === 0) {
      db.rooms = [...INITIAL_ROOMS];
      saveDatabase(db);
    }
    if (!Array.isArray(db.physicalRooms) || db.physicalRooms.length === 0) {
      db.physicalRooms = [...INITIAL_PHYSICAL_ROOMS];
      saveDatabase(db);
    }
    if (!Array.isArray(db.services) || db.services.length === 0) {
      db.services = [...INITIAL_SERVICES];
      saveDatabase(db);
    }
    const user = req.user;
    const isStaff =
      user && (user.role === UserRole.ADMIN || user.role === UserRole.RECEPTION);
    const isAdmin = user && user.role === UserRole.ADMIN;

    // Filter bookings/emails/users based on role for privacy & security
    const visibleBookings = isStaff
      ? db.bookings
      : user
      ? db.bookings.filter(
          (b) =>
            b.customerId === user.id ||
            b.guestEmail.toLowerCase() === user.email.toLowerCase()
        )
      : [];

    const visibleEmails = isStaff
      ? db.emails
      : user
      ? db.emails.filter(
          (e) =>
            e.senderEmail.toLowerCase() === user.email.toLowerCase() ||
            e.recipientEmail.toLowerCase() === user.email.toLowerCase()
        )
      : [];

    const visibleNotifications = user
      ? db.notifications.filter(
          (n) =>
            n.targetRole === 'ALL' ||
            n.targetRole === user.role ||
            n.targetUserId === user.id ||
            (n.targetEmail && n.targetEmail.toLowerCase() === user.email.toLowerCase())
        )
      : db.notifications.slice(0, 5);

    const visibleUsers = isAdmin
      ? db.users.map(sanitizeUser)
      : isStaff
      ? db.users.filter((u) => u.role === UserRole.CUSTOMER).map(sanitizeUser)
      : user
      ? [sanitizeUser(user)]
      : [];

    res.json({
      rooms: db.rooms,
      physicalRooms: db.physicalRooms,
      services: db.services,
      bookings: visibleBookings,
      // Provide non-PII occupied date ranges so public calendar/availability checks work accurately
      bookedSlots: db.bookings
        .filter((b) => b.status !== 'CANCELLED' && b.status !== 'REJECTED' && b.status !== 'COMPLETED')
        .map((b) => ({
          id: b.id,
          roomId: b.roomId,
          roomCategory: b.roomCategory,
          assignedUnitNumber: b.assignedUnitNumber,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status,
        })),
      emails: visibleEmails,
      notifications: visibleNotifications,
      payments: isStaff ? db.payments : [],
      users: visibleUsers,
      settings: db.settings,
      currentUser: user ? sanitizeUser(user) : null,
    });
  });

  // Check Room Availability for Date Range
  app.get('/api/availability', (req: Request, res: Response) => {
    const checkIn = String(req.query.checkIn || TODAY_DATE);
    const checkOut = String(req.query.checkOut || '');
    const guests = Number(req.query.guests || 1);

    if (checkIn < '2025-01-01') {
      res.status(400).json({
        error: 'Kirish sanasi o‘tib ketgan sana bo‘lishi mumkin emas.',
        code: 'PAST_CHECKIN',
      });
      return;
    }

    const nights = calculateNightsServer(checkIn, checkOut);
    if (nights <= 0) {
      res.status(400).json({
        error: 'Chiqish sanasi kirish sanasidan keyin bo‘lishi shart.',
        code: 'INVALID_DATES',
      });
      return;
    }

    const availabilityByRoomId: Record<
      string,
      { available: boolean; freeUnits: string[]; reason?: string }
    > = {};

    for (const room of db.rooms) {
      if (!room.available) {
        availabilityByRoomId[room.id] = {
          available: false,
          freeUnits: [],
          reason: 'ROOM_DISABLED',
        };
        continue;
      }
      if (guests > room.maxGuests) {
        availabilityByRoomId[room.id] = {
          available: false,
          freeUnits: [],
          reason: 'CAPACITY_EXCEEDED',
        };
        continue;
      }
      const freeUnits = findAvailablePhysicalUnits(room.category, checkIn, checkOut).map(
        (u) => u.unitNumber
      );
      availabilityByRoomId[room.id] = {
        available: freeUnits.length > 0,
        freeUnits,
        reason: freeUnits.length === 0 ? 'DATES_OVERLAP' : undefined,
      };
    }

    res.json({ checkIn, checkOut, nights, availabilityByRoomId });
  });

  // ==================================================
  // 2. AUTHENTICATION ENDPOINTS
  // ==================================================
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password, mode } = req.body || {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      res.status(400).json({
        error: 'Iltimos, to‘g‘ri email manzilini kiriting.',
        code: 'INVALID_EMAIL',
      });
      return;
    }
    if (!password || typeof password !== 'string') {
      res.status(400).json({
        error: 'Iltimos, parolni kiriting.',
        code: 'EMPTY_PASSWORD',
      });
      return;
    }

    const userByEmail = db.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!userByEmail) {
      res.status(401).json({
        error: 'Bunday email bilan foydalanuvchi topilmadi.',
        code: 'USER_NOT_FOUND',
      });
      return;
    }
    if (!userByEmail.active) {
      res.status(403).json({
        error: 'Sizning hisobingiz faolsizlantirilgan. Administratorga murojaat qiling.',
        code: 'ACCOUNT_DISABLED',
      });
      return;
    }
    if (userByEmail.passwordHash !== hashPassword(password)) {
      res.status(401).json({
        error: 'Parol noto‘g‘ri! Iltimos, qayta tekshirib kiriting.',
        code: 'WRONG_PASSWORD',
      });
      return;
    }
    const matchedUser = userByEmail;

    if (!matchedUser) {
      res.status(401).json({
        error: 'Email yoki parol noto‘g‘ri.',
        code: 'AUTH_FAILED',
      });
      return;
    }

    if (mode === 'admin' && matchedUser.role !== UserRole.ADMIN) {
      res.status(403).json({
        error: 'Ruxsat berilmagan! Bu sahifa faqat Administratorlar uchun.',
        code: 'ADMIN_ONLY',
      });
      return;
    }

    const token = crypto.randomBytes(24).toString('hex');
    db.sessions.push({
      token,
      userId: matchedUser.id,
      role: matchedUser.role,
      createdAt: Date.now(),
    });
    saveDatabase(db);

    res.json({
      token,
      user: sanitizeUser(matchedUser),
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { fullName, email, phone, password, confirmPassword } = req.body || {};

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({
        error: 'Iltimos, to‘liq ismingizni kiriting.',
        code: 'INVALID_NAME',
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      res.status(400).json({
        error: 'Email formati noto‘g‘ri. Masalan: ism@mail.uz',
        code: 'INVALID_EMAIL',
      });
      return;
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      res.status(400).json({
        error: 'Iltimos, to‘g‘ri telefon raqamini kiriting.',
        code: 'INVALID_PHONE',
      });
      return;
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      res.status(400).json({
        error: 'Parol kamida 4 ta belgidan iborat bo‘lishi kerak.',
        code: 'SHORT_PASSWORD',
      });
      return;
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      res.status(400).json({
        error: 'Parollar bir-biriga mos kelmadi.',
        code: 'PASSWORD_MISMATCH',
      });
      return;
    }

    const existing = db.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existing) {
      res.status(409).json({
        error: 'Ushbu email allaqachon ro‘yxatdan o‘tgan.',
        code: 'EMAIL_EXISTS',
      });
      return;
    }

    const newUser: StoredUser = {
      id: `usr-cust-${Date.now()}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      passwordHash: hashPassword(password),
      role: UserRole.CUSTOMER,
      active: true,
      createdAt: TODAY_DATE,
    };

    db.users.push(newUser);
    const token = crypto.randomBytes(24).toString('hex');
    db.sessions.push({
      token,
      userId: newUser.id,
      role: newUser.role,
      createdAt: Date.now(),
    });
    saveDatabase(db);

    res.status(201).json({
      token,
      user: sanitizeUser(newUser),
    });
  });

  app.post('/api/auth/logout', (req: AuthRequest, res: Response) => {
    if (req.token) {
      db.sessions = db.sessions.filter((s) => s.token !== req.token);
      saveDatabase(db);
    }
    res.json({ success: true });
  });

  app.put('/api/customer/profile', requireAuth, (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { fullName, phone, newPassword } = req.body || {};

    if (fullName && typeof fullName === 'string' && fullName.trim().length >= 2) {
      user.fullName = fullName.trim();
    }
    if (phone && typeof phone === 'string' && phone.trim().length >= 7) {
      user.phone = phone.trim();
    }
    if (newPassword && typeof newPassword === 'string' && newPassword.length >= 4) {
      user.passwordHash = hashPassword(newPassword);
      user.requirePasswordChange = false;
    }

    saveDatabase(db);
    res.json({ user: sanitizeUser(user) });
  });

  // ==================================================
  // 3. BOOKING CREATION & OVERLAP VALIDATION
  // ==================================================
  app.post('/api/bookings', (req: AuthRequest, res: Response) => {
    const {
      roomId,
      preferredUnitNumber,
      checkIn,
      checkOut,
      guests,
      serviceIds = [],
      guestName,
      guestEmail,
      guestPhone,
      specialRequests,
    } = req.body || {};

    // 1. Validate inputs
    if (!roomId || !checkIn || !checkOut) {
      res.status(400).json({
        error: 'Xona va sanalarni tanlash majburiy.',
        code: 'MISSING_FIELDS',
      });
      return;
    }

    if (String(checkIn) < '2025-01-01') {
      res.status(400).json({
        error: 'Kirish sanasi o‘tmishda bo‘lishi mumkin emas.',
        code: 'PAST_DATE',
      });
      return;
    }

    const nights = calculateNightsServer(String(checkIn), String(checkOut));
    if (nights <= 0) {
      res.status(400).json({
        error: 'Chiqish sanasi kirish sanasidan keyin bo‘lishi kerak.',
        code: 'INVALID_DATE_RANGE',
      });
      return;
    }

    const numGuests = Number(guests);
    if (!Number.isInteger(numGuests) || numGuests < 1) {
      res.status(400).json({
        error: 'Mehmonlar soni kamida 1 nafar bo‘lishi shart.',
        code: 'INVALID_GUESTS',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !guestName ||
      String(guestName).trim().length < 2 ||
      !guestEmail ||
      !emailRegex.test(String(guestEmail).trim()) ||
      !guestPhone ||
      String(guestPhone).trim().length < 7
    ) {
      res.status(400).json({
        error: 'Iltimos, to‘liq ism, to‘g‘ri email va telefon raqamini kiriting.',
        code: 'INVALID_CUSTOMER_INFO',
      });
      return;
    }

    // 2. Duplicate submission guard (within 8 seconds)
    const fingerprint = `${String(guestEmail).trim().toLowerCase()}_${roomId}_${checkIn}_${checkOut}`;
    const lastSubmitted = recentBookingFingerprints.get(fingerprint);
    if (lastSubmitted && Date.now() - lastSubmitted < 8000) {
      res.status(429).json({
        error: 'Bron so‘rovi allaqachon yuborilgan. Iltimos, kuting.',
        code: 'DUPLICATE_SUBMISSION',
      });
      return;
    }

    // 3. Find Room & Check Availability / Date Overlap
    const room = db.rooms.find((r) => r.id === roomId);
    if (!room || !room.available) {
      res.status(409).json({
        error: 'Xona mavjud emas.',
        code: 'ROOM_UNAVAILABLE',
      });
      return;
    }

    if (numGuests > room.maxGuests) {
      res.status(400).json({
        error: `Ushbu xona maksimal ${room.maxGuests} mehmon uchun mo‘ljallangan.`,
        code: 'MAX_GUESTS_EXCEEDED',
      });
      return;
    }

    // Find matching physical units; if none exist for this category yet, create one automatically
    let unitsForCat = db.physicalRooms.filter((u) => u.category === room.category);
    if (unitsForCat.length === 0) {
      const autoUnit: PhysicalRoom = {
        unitNumber: `${db.physicalRooms.length + 105}`,
        roomTypeId: room.id,
        category: room.category,
        floor: 2,
        status: 'AVAILABLE',
      };
      db.physicalRooms.push(autoUnit);
      saveDatabase(db);
    }

    const freeUnits = findAvailablePhysicalUnits(
      room.category,
      String(checkIn),
      String(checkOut)
    );

    if (freeUnits.length === 0) {
      res.status(409).json({
        error: 'Bu xona tanlangan sanalarda band.',
        code: 'DATE_OVERLAP_CONFLICT',
      });
      return;
    }

    let chosenUnit = freeUnits[0];
    if (preferredUnitNumber) {
      const matchUnit = freeUnits.find((u) => u.unitNumber === String(preferredUnitNumber));
      if (!matchUnit) {
        res.status(409).json({
          error: 'Bu xona tanlangan sanalarda band.',
          code: 'UNIT_OVERLAP_CONFLICT',
        });
        return;
      }
      chosenUnit = matchUnit;
    }

    // 4. Authoritative Server-Side Price Calculation
    const roomTotal = Math.max(0, nights * room.pricePerNight);
    const validServices = Array.isArray(serviceIds)
      ? db.services.filter((s) => serviceIds.includes(s.id) && s.available)
      : [];
    const servicesTotal = validServices.reduce((sum, s) => sum + Math.max(0, s.price), 0);
    const totalPrice = roomTotal + servicesTotal;

    if (totalPrice <= 0 || isNaN(totalPrice)) {
      res.status(400).json({
        error: 'Noto‘g‘ri narx hisoblandi.',
        code: 'INVALID_PRICE',
      });
      return;
    }

    recentBookingFingerprints.set(fingerprint, Date.now());

    const ts = nowTimestamp();
    const newBooking: Booking = {
      id: `BCH-2026-${Math.floor(100 + Math.random() * 899)}`,
      customerId: req.user?.id || 'usr-cust-guest',
      guestName: String(guestName).trim(),
      guestEmail: String(guestEmail).trim(),
      guestPhone: String(guestPhone).trim(),
      roomId: room.id,
      roomCategory: room.category,
      assignedUnitNumber: chosenUnit.unitNumber,
      checkIn: String(checkIn),
      checkOut: String(checkOut),
      nights,
      guests: numGuests,
      serviceIds: validServices.map((s) => s.id),
      roomTotal,
      servicesTotal,
      totalPrice,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      specialRequests: specialRequests ? String(specialRequests).trim() : undefined,
      createdAt: ts.full,
    };

    db.bookings.unshift(newBooking);

    // Create automated Email in Reception Inbox
    const tpl = generateEmailTemplate('CREATED', newBooking, room, validServices);
    const newEmail: ResortEmail = {
      id: `eml-${Date.now()}`,
      category: 'NEW_BOOKINGS',
      senderName: newBooking.guestName,
      senderEmail: newBooking.guestEmail,
      recipientEmail: 'reception@beach.uz',
      subject: tpl.subject,
      message: tpl.message,
      date: ts.date,
      time: ts.time,
      read: false,
      bookingId: newBooking.id,
      replies: [],
    };
    db.emails.unshift(newEmail);

    // Create Reception Notification: "Yangi bron so‘rovi keldi."
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      targetRole: 'ALL',
      targetUserId: newBooking.customerId,
      targetEmail: newBooking.guestEmail,
      type: 'NEW_BOOKING',
      title: {
        uz: 'Yangi bron so‘rovi keldi.',
        ru: 'Поступил новый запрос на бронирование.',
        en: 'New booking request received.',
      },
      description: {
        uz: `${newBooking.guestName} — ${newBooking.roomCategory} #${newBooking.assignedUnitNumber} (${newBooking.checkIn} → ${newBooking.checkOut}), $${newBooking.totalPrice}`,
        ru: `${newBooking.guestName} — ${newBooking.roomCategory} #${newBooking.assignedUnitNumber} (${newBooking.checkIn} → ${newBooking.checkOut}), $${newBooking.totalPrice}`,
        en: `${newBooking.guestName} — ${newBooking.roomCategory} #${newBooking.assignedUnitNumber} (${newBooking.checkIn} → ${newBooking.checkOut}), $${newBooking.totalPrice}`,
      },
      createdAt: ts.full,
      read: false,
      bookingId: newBooking.id,
    });

    saveDatabase(db);
    res.status(201).json({ booking: newBooking });
  });

  // Cancel Booking (Customer owner, Reception, or Admin)
  app.post('/api/bookings/:id/cancel', requireAuth, (req: AuthRequest, res: Response) => {
    const bookingId = req.params.id;
    const target = db.bookings.find((b) => b.id === bookingId);
    if (!target) {
      res.status(404).json({ error: 'Bron topilmadi.' });
      return;
    }

    const user = req.user!;
    const isOwner =
      target.customerId === user.id ||
      target.guestEmail.toLowerCase() === user.email.toLowerCase();
    const isStaff = user.role === UserRole.RECEPTION || user.role === UserRole.ADMIN;

    if (!isOwner && !isStaff) {
      res.status(403).json({ error: 'Siz faqat o‘z broningizni bekor qila olasiz.' });
      return;
    }

    target.status = 'CANCELLED';

    // Release physical room back to AVAILABLE if it was RESERVED for this booking
    if (target.assignedUnitNumber) {
      const unit = db.physicalRooms.find((u) => u.unitNumber === target.assignedUnitNumber);
      if (unit && unit.status === 'RESERVED') {
        unit.status = 'AVAILABLE';
        unit.currentGuestName = undefined;
        unit.currentBookingId = undefined;
      }
    }

    const ts = nowTimestamp();
    const rm = db.rooms.find((r) => r.id === target.roomId);
    const tpl = generateEmailTemplate('CANCELLED', target, rm);

    db.emails.unshift({
      id: `eml-${Date.now()}`,
      category: 'CANCELLED',
      senderName: target.guestName,
      senderEmail: target.guestEmail,
      recipientEmail: 'reception@beach.uz',
      subject: tpl.subject,
      message: tpl.message,
      date: ts.date,
      time: ts.time,
      read: false,
      bookingId: target.id,
      replies: [],
    });

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      targetRole: 'ALL',
      targetUserId: target.customerId,
      targetEmail: target.guestEmail,
      type: 'BOOKING_CANCELLED',
      title: {
        uz: 'Bron bekor qilindi.',
        ru: 'Бронирование отменено.',
        en: 'Booking has been cancelled.',
      },
      description: {
        uz: `#${target.id} (${target.guestName}) bekor qilindi va xona bo‘shatildi.`,
        ru: `#${target.id} (${target.guestName}) отменено, номер освобожден.`,
        en: `#${target.id} (${target.guestName}) cancelled and room released.`,
      },
      createdAt: ts.full,
      read: false,
      bookingId: target.id,
    });

    saveDatabase(db);
    res.json({ booking: target });
  });

  // ==================================================
  // 4. RECEPTION ENDPOINTS (Confirm, Reject, Check-in, Check-out, Room Status, Messaging)
  // ==================================================
  app.post(
    '/api/reception/bookings/:id/confirm',
    requireRole([UserRole.RECEPTION, UserRole.ADMIN]),
    (req: AuthRequest, res: Response) => {
      const bookingId = req.params.id;
      const { unitNumber } = req.body || {};
      const target = db.bookings.find((b) => b.id === bookingId);
      if (!target) {
        res.status(404).json({ error: 'Bron topilmadi.' });
        return;
      }

      // Check room availability and non-overlapping dates before confirming
      const freeUnits = findAvailablePhysicalUnits(
        target.roomCategory,
        target.checkIn,
        target.checkOut,
        target.id
      );

      const desiredUnitNumber =
        unitNumber || target.assignedUnitNumber || freeUnits[0]?.unitNumber;
      const validUnit = freeUnits.find((u) => u.unitNumber === desiredUnitNumber) || freeUnits[0];

      if (!validUnit) {
        res.status(409).json({
          error: `Xona mavjud emas! ${target.checkIn} → ${target.checkOut} sanalarida barcha ${target.roomCategory} xonalari band.`,
          code: 'NO_AVAILABLE_UNIT',
        });
        return;
      }

      // Transition: AVAILABLE -> RESERVED
      validUnit.status = 'RESERVED';
      validUnit.currentGuestName = target.guestName;
      validUnit.currentBookingId = target.id;

      target.assignedUnitNumber = validUnit.unitNumber;
      target.status = 'CONFIRMED';
      target.paymentStatus = 'PAID';

      const ts = nowTimestamp();

      // Record payment if not already recorded
      if (!db.payments.some((p) => p.bookingId === target.id)) {
        db.payments.unshift({
          id: `PAY-2026-${Math.floor(100 + Math.random() * 899)}`,
          bookingId: target.id,
          customerId: target.customerId,
          guestName: target.guestName,
          amount: target.totalPrice,
          status: 'PAID',
          method: 'Confirmed Reservation',
          createdAt: ts.full,
        });
      }

      const rm = db.rooms.find((r) => r.id === target.roomId);
      const chosenSrvs = db.services.filter((s) => target.serviceIds.includes(s.id));
      const tpl = generateEmailTemplate('CONFIRMED', target, rm, chosenSrvs);

      // Update existing email category and add confirmation email
      db.emails = db.emails.map((e) =>
        e.bookingId === target.id ? { ...e, category: 'CONFIRMED' } : e
      );
      db.emails.unshift({
        id: `eml-${Date.now()}`,
        category: 'CONFIRMED',
        senderName: 'BEACH Reception Desk',
        senderEmail: 'reception@beach.uz',
        recipientEmail: target.guestEmail,
        subject: tpl.subject,
        message: tpl.message,
        date: ts.date,
        time: ts.time,
        read: false,
        bookingId: target.id,
        replies: [],
      });

      // Exact notification required: "Broningiz muvaffaqiyatli tasdiqlandi."
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        targetRole: 'ALL',
        targetUserId: target.customerId,
        targetEmail: target.guestEmail,
        type: 'BOOKING_CONFIRMED',
        title: {
          uz: 'Broningiz muvaffaqiyatli tasdiqlandi.',
          ru: 'Ваше бронирование успешно подтверждено.',
          en: 'Your booking has been successfully confirmed.',
        },
        description: {
          uz: `Bron #${target.id} (${target.guestName}) tasdiqlandi. Xona #${validUnit.unitNumber} AVAILABLE → RESERVED.`,
          ru: `Бронь #${target.id} (${target.guestName}) подтверждена. Номер #${validUnit.unitNumber} AVAILABLE → RESERVED.`,
          en: `Booking #${target.id} (${target.guestName}) confirmed. Room #${validUnit.unitNumber} AVAILABLE → RESERVED.`,
        },
        createdAt: ts.full,
        read: false,
        bookingId: target.id,
      });

      saveDatabase(db);
      res.json({ booking: target, unit: validUnit });
    }
  );

  app.post(
    '/api/reception/bookings/:id/reject',
    requireRole([UserRole.RECEPTION, UserRole.ADMIN]),
    (req: AuthRequest, res: Response) => {
      const bookingId = req.params.id;
      const target = db.bookings.find((b) => b.id === bookingId);
      if (!target) {
        res.status(404).json({ error: 'Bron topilmadi.' });
        return;
      }

      target.status = 'REJECTED';

      // Release room unit if it was reserved
      if (target.assignedUnitNumber) {
        const unit = db.physicalRooms.find((u) => u.unitNumber === target.assignedUnitNumber);
        if (unit && unit.status === 'RESERVED') {
          unit.status = 'AVAILABLE';
          unit.currentGuestName = undefined;
          unit.currentBookingId = undefined;
        }
      }

      const ts = nowTimestamp();
      const rm = db.rooms.find((r) => r.id === target.roomId);
      const tpl = generateEmailTemplate('REJECTED', target, rm);

      db.emails.unshift({
        id: `eml-${Date.now()}`,
        category: 'CANCELLED',
        senderName: 'BEACH Reception Desk',
        senderEmail: 'reception@beach.uz',
        recipientEmail: target.guestEmail,
        subject: tpl.subject,
        message: tpl.message,
        date: ts.date,
        time: ts.time,
        read: false,
        bookingId: target.id,
        replies: [],
      });

      // Exact notification required: "Bron so‘rovingiz rad etildi."
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        targetRole: 'ALL',
        targetUserId: target.customerId,
        targetEmail: target.guestEmail,
        type: 'BOOKING_REJECTED',
        title: {
          uz: 'Bron so‘rovingiz rad etildi.',
          ru: 'Ваш запрос на бронирование отклонен.',
          en: 'Your booking request was declined.',
        },
        description: {
          uz: `#${target.id} (${target.guestName}) rad etildi.`,
          ru: `#${target.id} (${target.guestName}) отклонено.`,
          en: `#${target.id} (${target.guestName}) declined.`,
        },
        createdAt: ts.full,
        read: false,
        bookingId: target.id,
      });

      saveDatabase(db);
      res.json({ booking: target });
    }
  );

  // Check-In: RESERVED -> OCCUPIED
  app.post(
    '/api/reception/bookings/:id/checkin',
    requireRole([UserRole.RECEPTION, UserRole.ADMIN]),
    (req: AuthRequest, res: Response) => {
      const bookingId = req.params.id;
      const { unitNumber } = req.body || {};
      const target = db.bookings.find((b) => b.id === bookingId);
      if (!target) {
        res.status(404).json({ error: 'Bron topilmadi.' });
        return;
      }

      const targetUnitNum = unitNumber || target.assignedUnitNumber || '201';
      const unit = db.physicalRooms.find((u) => u.unitNumber === targetUnitNum);

      if (unit && (unit.status === 'MAINTENANCE' || unit.status === 'CLEANING')) {
        res.status(409).json({
          error: `Xona #${targetUnitNum} hozirda ${unit.status} holatida. Check-in qilishdan oldin xonani AVAILABLE/RESERVED holatiga o‘tkazing.`,
        });
        return;
      }

      if (unit) {
        unit.status = 'OCCUPIED';
        unit.currentGuestName = target.guestName;
        unit.currentBookingId = target.id;
      }

      target.assignedUnitNumber = targetUnitNum;
      target.status = 'CHECKED_IN';
      target.paymentStatus = 'PAID';

      const ts = nowTimestamp();
      db.checkInOuts.unshift({
        id: `CHK-IN-${Date.now()}`,
        bookingId: target.id,
        guestName: target.guestName,
        unitNumber: targetUnitNum,
        type: 'CHECK_IN',
        timestamp: ts.full,
        handledBy: req.user!.fullName,
      });

      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        targetRole: 'ALL',
        targetUserId: target.customerId,
        targetEmail: target.guestEmail,
        type: 'GUEST_CHECKIN',
        title: {
          uz: 'Mehmon check-in qildi.',
          ru: 'Гость выполнил check-in.',
          en: 'Guest has completed check-in.',
        },
        description: {
          uz: `${target.guestName} (#${target.id}) — Xona #${targetUnitNum} RESERVED → OCCUPIED.`,
          ru: `${target.guestName} (#${target.id}) — Номер #${targetUnitNum} RESERVED → OCCUPIED.`,
          en: `${target.guestName} (#${target.id}) — Room #${targetUnitNum} RESERVED → OCCUPIED.`,
        },
        createdAt: ts.full,
        read: false,
        bookingId: target.id,
      });

      saveDatabase(db);
      res.json({ booking: target, unit });
    }
  );

  // Check-Out: OCCUPIED -> CLEANING
  app.post(
    '/api/reception/bookings/:id/checkout',
    requireRole([UserRole.RECEPTION, UserRole.ADMIN]),
    (req: AuthRequest, res: Response) => {
      const bookingId = req.params.id;
      const { unitNumber } = req.body || {};
      const target = db.bookings.find((b) => b.id === bookingId);
      if (!target) {
        res.status(404).json({ error: 'Bron topilmadi.' });
        return;
      }

      const targetUnitNum = unitNumber || target.assignedUnitNumber || '102';
      const unit = db.physicalRooms.find((u) => u.unitNumber === targetUnitNum);

      if (unit) {
        unit.status = 'CLEANING';
        unit.currentGuestName = undefined;
        unit.currentBookingId = undefined;
      }

      target.status = 'COMPLETED';

      const ts = nowTimestamp();
      db.checkInOuts.unshift({
        id: `CHK-OUT-${Date.now()}`,
        bookingId: target.id,
        guestName: target.guestName,
        unitNumber: targetUnitNum,
        type: 'CHECK_OUT',
        timestamp: ts.full,
        handledBy: req.user!.fullName,
      });

      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        targetRole: 'ALL',
        targetUserId: target.customerId,
        targetEmail: target.guestEmail,
        type: 'GUEST_CHECKOUT',
        title: {
          uz: 'Mehmon check-out qildi.',
          ru: 'Гость выполнил check-out.',
          en: 'Guest has completed check-out.',
        },
        description: {
          uz: `${target.guestName} (#${target.id}) — Xona #${targetUnitNum} OCCUPIED → CLEANING.`,
          ru: `${target.guestName} (#${target.id}) — Номер #${targetUnitNum} OCCUPIED → CLEANING.`,
          en: `${target.guestName} (#${target.id}) — Room #${targetUnitNum} OCCUPIED → CLEANING.`,
        },
        createdAt: ts.full,
        read: false,
        bookingId: target.id,
      });

      saveDatabase(db);
      res.json({ booking: target, unit });
    }
  );

  // Physical Room Status Update (e.g., CLEANING -> AVAILABLE, AVAILABLE -> MAINTENANCE)
  app.post(
    '/api/reception/physical-rooms/:unitNumber/status',
    requireRole([UserRole.RECEPTION, UserRole.ADMIN]),
    (req: Request, res: Response) => {
      const { unitNumber } = req.params;
      const { status } = req.body as { status: PhysicalRoomStatus };
      const unit = db.physicalRooms.find((u) => u.unitNumber === unitNumber);
      if (!unit) {
        res.status(404).json({ error: 'Xona topilmadi.' });
        return;
      }

      unit.status = status;
      if (status === 'AVAILABLE' || status === 'CLEANING' || status === 'MAINTENANCE') {
        unit.currentGuestName = undefined;
        unit.currentBookingId = undefined;
      }

      saveDatabase(db);
      res.json({ unit });
    }
  );

  // Assign physical room unit to booking
  app.post(
    '/api/reception/bookings/:id/assign-room',
    requireRole([UserRole.RECEPTION, UserRole.ADMIN]),
    (req: Request, res: Response) => {
      const bookingId = req.params.id;
      const { unitNumber } = req.body || {};
      const target = db.bookings.find((b) => b.id === bookingId);
      const unit = db.physicalRooms.find((u) => u.unitNumber === unitNumber);

      if (!target || !unit) {
        res.status(404).json({ error: 'Bron yoki xona topilmadi.' });
        return;
      }

      if (unit.status === 'MAINTENANCE' || unit.status === 'CLEANING') {
        res.status(409).json({
          error: `Xona #${unitNumber} hozirda ${unit.status} holatida va biriktirib bo‘lmaydi.`,
        });
        return;
      }

      target.assignedUnitNumber = unitNumber;
      if (target.status === 'CONFIRMED') {
        unit.status = 'RESERVED';
        unit.currentGuestName = target.guestName;
        unit.currentBookingId = target.id;
      }

      saveDatabase(db);
      res.json({ booking: target, unit });
    }
  );

  // ==================================================
  // 5. MESSAGING & EMAIL INBOX ENDPOINTS
  // ==================================================
  // Customer or Public visitor sends message to Reception
  app.post('/api/messages', (req: AuthRequest, res: Response) => {
    const { senderName, senderEmail, recipientEmail, subject, message, bookingId } =
      req.body || {};

    const finalSenderName = req.user?.fullName || String(senderName || '').trim();
    const finalSenderEmail = req.user?.email || String(senderEmail || '').trim();
    const finalRecipient = String(recipientEmail || 'reception@beach.uz').trim();

    if (!finalSenderName || !finalSenderEmail.includes('@') || !message || !String(message).trim()) {
      res.status(400).json({ error: 'Iltimos, ism, email va xabar matnini kiriting.' });
      return;
    }

    const ts = nowTimestamp();
    const subjText = String(subject || 'Mijoz xabari').trim();
    const msgText = String(message).trim();

    const newEmail: ResortEmail = {
      id: `eml-${Date.now()}`,
      category: 'CUSTOMER_QUESTIONS',
      senderName: finalSenderName,
      senderEmail: finalSenderEmail,
      recipientEmail: finalRecipient,
      subject: { uz: subjText, ru: subjText, en: subjText },
      message: { uz: msgText, ru: msgText, en: msgText },
      date: ts.date,
      time: ts.time,
      read: false,
      bookingId: bookingId || undefined,
      replies: [],
    };

    db.emails.unshift(newEmail);

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      targetRole: 'ALL',
      targetEmail: finalRecipient,
      type: 'NEW_MESSAGE',
      title: {
        uz: 'Yangi xabar keldi.',
        ru: 'Получено новое сообщение.',
        en: 'New message received.',
      },
      description: {
        uz: `${finalSenderName} (${finalSenderEmail}): ${subjText}`,
        ru: `${finalSenderName} (${finalSenderEmail}): ${subjText}`,
        en: `${finalSenderName} (${finalSenderEmail}): ${subjText}`,
      },
      createdAt: ts.full,
      read: false,
      bookingId,
    });

    saveDatabase(db);
    res.status(201).json({ email: newEmail });
  });

  // Reply to a message (Reception or Customer)
  app.post('/api/messages/:id/reply', requireAuth, (req: AuthRequest, res: Response) => {
    const emailId = req.params.id;
    const { message } = req.body || {};
    const emailObj = db.emails.find((e) => e.id === emailId);

    if (!emailObj || !message || !String(message).trim()) {
      res.status(400).json({ error: 'Xabar topilmadi yoki javob bo‘sh.' });
      return;
    }

    const user = req.user!;
    const ts = nowTimestamp();

    emailObj.read = true;
    emailObj.replies.push({
      id: `rep-${Date.now()}`,
      senderName: `${user.fullName} (${user.role})`,
      senderEmail: user.email,
      receiverEmail:
        user.email.toLowerCase() === emailObj.senderEmail.toLowerCase()
          ? emailObj.recipientEmail
          : emailObj.senderEmail,
      senderRole: user.role,
      message: String(message).trim(),
      date: ts.date,
      time: ts.time,
      read: false,
    });

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      targetRole: 'ALL',
      targetEmail: emailObj.senderEmail,
      type: 'NEW_MESSAGE',
      title: {
        uz: 'Yangi xabar keldi.',
        ru: 'Получено новое сообщение.',
        en: 'New message received.',
      },
      description: {
        uz: `${user.fullName} xabaringizga javob yozdi.`,
        ru: `${user.fullName} ответил(а) на ваше сообщение.`,
        en: `${user.fullName} replied to your message.`,
      },
      createdAt: ts.full,
      read: false,
      bookingId: emailObj.bookingId,
    });

    saveDatabase(db);
    res.json({ email: emailObj });
  });

  app.post('/api/messages/:id/read', requireAuth, (req: Request, res: Response) => {
    const emailObj = db.emails.find((e) => e.id === req.params.id);
    if (emailObj) {
      emailObj.read = true;
      saveDatabase(db);
    }
    res.json({ email: emailObj });
  });

  app.post(
    '/api/reception/send-template',
    requireRole([UserRole.RECEPTION, UserRole.ADMIN]),
    (req: Request, res: Response) => {
      const { bookingId, templateType } = req.body || {};
      const bk = db.bookings.find((b) => b.id === bookingId);
      if (!bk) {
        res.status(404).json({ error: 'Bron topilmadi.' });
        return;
      }

      const rm = db.rooms.find((r) => r.id === bk.roomId);
      const srvs = db.services.filter((s) => bk.serviceIds.includes(s.id));
      const tpl = generateEmailTemplate(templateType || 'CHECKIN_INFO', bk, rm, srvs);
      const ts = nowTimestamp();

      const newEml: ResortEmail = {
        id: `eml-${Date.now()}`,
        category: templateType === 'CHECKOUT_INFO' ? 'COMPLETED' : 'CONFIRMED',
        senderName: 'BEACH Reception Desk',
        senderEmail: 'reception@beach.uz',
        recipientEmail: bk.guestEmail,
        subject: tpl.subject,
        message: tpl.message,
        date: ts.date,
        time: ts.time,
        read: false,
        bookingId: bk.id,
        replies: [],
      };
      db.emails.unshift(newEml);
      saveDatabase(db);
      res.json({ email: newEml });
    }
  );

  app.post('/api/notifications/read', (req: Request, res: Response) => {
    const { id, all } = req.body || {};
    if (all) {
      db.notifications.forEach((n) => {
        n.read = true;
      });
    } else if (id) {
      const n = db.notifications.find((item) => item.id === id);
      if (n) n.read = true;
    }
    saveDatabase(db);
    res.json({ success: true });
  });

  // ==================================================
  // 6. ADMIN CRUD ENDPOINTS (Strictly requireRole([UserRole.ADMIN]))
  // ==================================================
  // Rooms CRUD
  app.post('/api/admin/rooms', requireRole([UserRole.ADMIN]), (req: Request, res: Response) => {
    const roomData = req.body as Room & { unitNumber?: string };
    const nameUz =
      typeof roomData?.name === 'string'
        ? (roomData.name as string).trim()
        : String(roomData?.name?.uz || '').trim();
    if (!roomData || !nameUz || Number(roomData.pricePerNight) <= 0) {
      res.status(400).json({ error: 'Xona nomi va musbat narx kiritilishi shart.' });
      return;
    }

    const nameRu =
      typeof roomData?.name === 'object' && roomData.name?.ru?.trim()
        ? roomData.name.ru.trim()
        : nameUz;
    const nameEn =
      typeof roomData?.name === 'object' && roomData.name?.en?.trim()
        ? roomData.name.en.trim()
        : nameUz;

    const descUz =
      typeof roomData?.description === 'object' && roomData.description?.uz?.trim()
        ? roomData.description.uz.trim()
        : 'Panoramali dengiz manzarasi, premium mebellar va 24/7 konsyerj xizmatiga ega dabdabali xona.';

    const newRoom: Room = {
      id: roomData.id || `room-${Date.now()}`,
      category: roomData.category || 'Luxury',
      name: { uz: nameUz, ru: nameRu, en: nameEn },
      description: {
        uz: descUz,
        ru:
          (typeof roomData?.description === 'object' && roomData.description?.ru?.trim()) ||
          descUz,
        en:
          (typeof roomData?.description === 'object' && roomData.description?.en?.trim()) ||
          descUz,
      },
      pricePerNight: Math.max(1, Number(roomData.pricePerNight)),
      rating: Number(roomData.rating) || 5.0,
      maxGuests: Math.max(1, Number(roomData.maxGuests || 2)),
      bedType: roomData.bedType || {
        uz: '1 ta King-size karavot',
        ru: '1 King-size кровать',
        en: '1 King Bed',
      },
      sizeSqm: Number(roomData.sizeSqm) || 68,
      hasWifi: roomData.hasWifi ?? true,
      hasAc: roomData.hasAc ?? true,
      bathroomCount: Number(roomData.bathroomCount) || 1,
      seaView: roomData.seaView || {
        uz: 'To‘liq dengiz manzarasi',
        ru: 'Прямой вид на море',
        en: 'Direct Sea View',
      },
      available: roomData.available ?? true,
      image: roomData.image || INITIAL_ROOMS[1]?.image || '/src/assets/images/room_luxury_suite_1790789871802.jpg',
    };
    db.rooms.push(newRoom);

    // Also add a physical room unit for this category so it can be booked immediately
    const requestedUnit = roomData.unitNumber ? String(roomData.unitNumber).trim() : '';
    const unitNum =
      requestedUnit && !db.physicalRooms.some((u) => u.unitNumber === requestedUnit)
        ? requestedUnit
        : `${600 + db.physicalRooms.length}`;
    db.physicalRooms.push({
      unitNumber: unitNum,
      roomTypeId: newRoom.id,
      category: newRoom.category,
      floor: Math.min(5, Math.max(1, Math.floor(db.physicalRooms.length / 3) + 1)),
      status: 'AVAILABLE',
    });

    saveDatabase(db);
    res.status(201).json({ room: newRoom });
  });

  app.put('/api/admin/rooms/:id', requireRole([UserRole.ADMIN]), (req: Request, res: Response) => {
    const idx = db.rooms.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Xona topilmadi.' });
      return;
    }
    const incoming = req.body as Partial<Room>;
    if (incoming.pricePerNight !== undefined && Number(incoming.pricePerNight) <= 0) {
      res.status(400).json({ error: 'Narx 0 dan katta bo‘lishi shart.' });
      return;
    }
    db.rooms[idx] = { ...db.rooms[idx], ...incoming };
    saveDatabase(db);
    res.json({ room: db.rooms[idx] });
  });

  app.delete(
    '/api/admin/rooms/:id',
    requireRole([UserRole.ADMIN]),
    (req: Request, res: Response) => {
      if (db.rooms.length <= 1) {
        res.status(400).json({ error: 'Tizimda kamida bitta xona qolishi shart.' });
        return;
      }
      db.rooms = db.rooms.filter((r) => r.id !== req.params.id);
      saveDatabase(db);
      res.json({ success: true });
    }
  );

  // Services CRUD
  app.post('/api/admin/services', requireRole([UserRole.ADMIN]), (req: Request, res: Response) => {
    const srvData = req.body as BeachService;
    if (!srvData || !srvData.name?.uz || Number(srvData.price) <= 0) {
      res.status(400).json({ error: 'Xizmat nomi va musbat narx kiritilishi shart.' });
      return;
    }
    const newSrv: BeachService = {
      ...srvData,
      id: srvData.id || `srv-${Date.now()}`,
      price: Math.max(1, Number(srvData.price)),
    };
    db.services.push(newSrv);
    saveDatabase(db);
    res.status(201).json({ service: newSrv });
  });

  app.put(
    '/api/admin/services/:id',
    requireRole([UserRole.ADMIN]),
    (req: Request, res: Response) => {
      const idx = db.services.findIndex((s) => s.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Xizmat topilmadi.' });
        return;
      }
      const incoming = req.body as Partial<BeachService>;
      if (incoming.price !== undefined && Number(incoming.price) <= 0) {
        res.status(400).json({ error: 'Narx musbat son bo‘lishi shart.' });
        return;
      }
      db.services[idx] = { ...db.services[idx], ...incoming };
      saveDatabase(db);
      res.json({ service: db.services[idx] });
    }
  );

  app.delete(
    '/api/admin/services/:id',
    requireRole([UserRole.ADMIN]),
    (req: Request, res: Response) => {
      db.services = db.services.filter((s) => s.id !== req.params.id);
      saveDatabase(db);
      res.json({ success: true });
    }
  );

  // Users / Reception / Customer CRUD
  app.post('/api/admin/users', requireRole([UserRole.ADMIN]), (req: Request, res: Response) => {
    const { fullName, email, phone, password, shift, role } = req.body || {};
    if (!fullName || !email || !String(email).includes('@')) {
      res.status(400).json({ error: 'Ism va to‘g‘ri email kiritilishi shart.' });
      return;
    }
    if (db.users.some((u) => u.email.toLowerCase() === String(email).trim().toLowerCase())) {
      res.status(409).json({ error: 'Ushbu email allaqachon mavjud.' });
      return;
    }

    const newStaff: StoredUser = {
      id: `usr-${Date.now()}`,
      fullName: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || '+998 90 000 00 00').trim(),
      passwordHash: hashPassword(String(password || 'beach2026')),
      role: role === UserRole.CUSTOMER ? UserRole.CUSTOMER : UserRole.RECEPTION,
      active: true,
      shift: shift || '08:00 – 20:00',
      createdAt: TODAY_DATE,
    };

    db.users.push(newStaff);
    saveDatabase(db);
    res.status(201).json({ user: sanitizeUser(newStaff) });
  });

  app.put('/api/admin/users/:id', requireRole([UserRole.ADMIN]), (req: Request, res: Response) => {
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Foydalanuvchi topilmadi.' });
      return;
    }

    const { fullName, phone, active, shift, password, requirePasswordChange } = req.body || {};
    if (fullName !== undefined) target.fullName = String(fullName).trim();
    if (phone !== undefined) target.phone = String(phone).trim();
    if (active !== undefined) target.active = Boolean(active);
    if (shift !== undefined) target.shift = String(shift);
    if (requirePasswordChange !== undefined) {
      target.requirePasswordChange = Boolean(requirePasswordChange);
    }
    if (password && typeof password === 'string' && password.length >= 4) {
      target.passwordHash = hashPassword(password);
      target.requirePasswordChange = false;
    }

    saveDatabase(db);
    res.json({ user: sanitizeUser(target) });
  });

  // Admin Bookings Update (Status / Payment / Cancel)
  app.put(
    '/api/admin/bookings/:id',
    requireRole([UserRole.ADMIN]),
    (req: Request, res: Response) => {
      const target = db.bookings.find((b) => b.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'Bron topilmadi.' });
        return;
      }
      const { status, paymentStatus, assignedUnitNumber } = req.body || {};
      if (status) {
        target.status = status;
        if (status === 'CANCELLED' || status === 'REJECTED') {
          const unit = db.physicalRooms.find((u) => u.unitNumber === target.assignedUnitNumber);
          if (unit && unit.status === 'RESERVED') {
            unit.status = 'AVAILABLE';
            unit.currentGuestName = undefined;
            unit.currentBookingId = undefined;
          }
        }
      }
      if (paymentStatus) target.paymentStatus = paymentStatus;
      if (assignedUnitNumber !== undefined) target.assignedUnitNumber = assignedUnitNumber;

      saveDatabase(db);
      res.json({ booking: target });
    }
  );

  // Admin Settings Update
  app.put('/api/admin/settings', requireRole([UserRole.ADMIN]), (req: Request, res: Response) => {
    db.settings = { ...db.settings, ...req.body };
    saveDatabase(db);
    res.json({ settings: db.settings });
  });

  // ==================================================
  // 7. VITE MIDDLEWARE / PRODUCTION STATIC ASSETS
  // ==================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BEACH Resort Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
