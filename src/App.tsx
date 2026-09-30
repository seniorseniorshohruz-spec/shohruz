import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Check,
  AlertCircle,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';
import {
  AppNotification,
  BeachService,
  Booking,
  Language,
  PhysicalRoom,
  ResortEmail,
  ResortSettings,
  Room,
  RoomCategory,
  UserAccount,
  UserRole,
} from './types/resort';
import {
  HERO_IMAGE,
  IMG_ROOM_SUITE,
  IMG_ROOM_VILLA,
  IMG_SERVICE_TAPCHAN,
  IMG_SERVICE_YACHT,
  INITIAL_ROOMS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  TODAY_DATE,
} from './data/initialData';
import { localize, t } from './i18n/translations';
import { Navbar } from './components/Navbar';
import { ResilientImage } from './components/ResilientImage';
import {
  BookingWizardModal,
  datesOverlap,
  RoomDetailModal,
} from './components/BookingWizardModal';
import { AuthView } from './components/AuthView';
import { CustomerDashboard } from './components/CustomerDashboard';
import { ReceptionDashboard } from './components/ReceptionDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { BookedSlot, resortApi } from './services/api';

type AppView =
  | 'home'
  | 'auth'
  | 'customer_dashboard'
  | 'reception_dashboard'
  | 'admin_dashboard';

type RoomSortOption = 'default' | 'price_asc' | 'price_desc' | 'rating_desc' | 'guests_desc';

function loadLangStorage(): Language {
  try {
    const raw = localStorage.getItem('beach_lang');
    if (!raw) return 'uz';
    const parsed = JSON.parse(raw);
    if (parsed === 'uz' || parsed === 'ru' || parsed === 'en') return parsed;
    return 'uz';
  } catch {
    return 'uz';
  }
}

export default function App() {
  // 1. Persistent Language (Default: Uzbek 'uz')
  const [lang, setLang] = useState<Language>(loadLangStorage);

  useEffect(() => {
    try {
      localStorage.setItem('beach_lang', JSON.stringify(lang));
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  }, [lang]);

  // 2. Server-Synced State
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [physicalRooms, setPhysicalRooms] = useState<PhysicalRoom[]>([]);
  const [services, setServices] = useState<BeachService[]>(INITIAL_SERVICES);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [emails, setEmails] = useState<ResortEmail[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<ResortSettings>(INITIAL_SETTINGS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Navigation & Route Guard State
  const [view, setView] = useState<AppView>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>('login');

  // Global Toasts
  const [globalToast, setGlobalToast] = useState('');
  const [globalError, setGlobalError] = useState('');

  // Search, Filter & Sort State on Home Page
  const [searchCheckIn, setSearchCheckIn] = useState(TODAY_DATE);
  const [searchCheckOut, setSearchCheckOut] = useState('2026-10-03');
  const [searchGuests, setSearchGuests] = useState(2);
  const [roomCategoryFilter, setRoomCategoryFilter] = useState<'ALL' | RoomCategory>('ALL');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [roomSort, setRoomSort] = useState<RoomSortOption>('default');

  // Booking Wizard & Room Detail Modals
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardInitialRoomId, setWizardInitialRoomId] = useState<string | undefined>(undefined);
  const [wizardInitialServices, setWizardInitialServices] = useState<string[]>([]);
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+998 ');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactToast, setContactToast] = useState('');
  const [contactError, setContactError] = useState('');

  const triggerGlobalToast = useCallback((msg: string) => {
    setGlobalError('');
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(''), 4000);
  }, []);

  const triggerGlobalError = useCallback((msg: string) => {
    setGlobalToast('');
    setGlobalError(msg);
    setTimeout(() => setGlobalError(''), 5000);
  }, []);

  // Strict URL Route & Role Guard
  const resolveRouteWithGuard = useCallback(
    (pathname: string, activeUser: UserAccount | null) => {
      const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';

      if (cleanPath === '/admin' || cleanPath === '/admin/dashboard') {
        if (!activeUser) {
          triggerGlobalError(
            'Ruxsat berilmagan! Admin panelga kirish uchun avval tizimga kiring.'
          );
          setAuthMode('admin');
          setView('auth');
          window.history.replaceState({}, '', '/admin/login');
          return;
        }
        if (activeUser.role !== UserRole.ADMIN) {
          triggerGlobalError(
            `Ruxsat berilmagan! ${activeUser.role} roli /admin sahifasiga kira olmaydi.`
          );
          const fallbackPath =
            activeUser.role === UserRole.RECEPTION ? '/reception' : '/customer';
          setView(
            activeUser.role === UserRole.RECEPTION
              ? 'reception_dashboard'
              : 'customer_dashboard'
          );
          window.history.replaceState({}, '', fallbackPath);
          return;
        }
        setView('admin_dashboard');
        return;
      }

      if (cleanPath === '/reception') {
        if (!activeUser) {
          triggerGlobalError('Ruxsat berilmagan! Resepshn tizimiga kirish uchun avtorizatsiyadan o‘ting.');
          setAuthMode('login');
          setView('auth');
          window.history.replaceState({}, '', '/login');
          return;
        }
        if (activeUser.role !== UserRole.RECEPTION && activeUser.role !== UserRole.ADMIN) {
          triggerGlobalError(
            'Ruxsat berilmagan! Mijozlar (CUSTOMER) /reception sahifasiga kira olmaydi.'
          );
          setView('customer_dashboard');
          window.history.replaceState({}, '', '/customer');
          return;
        }
        setView('reception_dashboard');
        return;
      }

      if (cleanPath === '/customer') {
        if (!activeUser) {
          triggerGlobalError('Shaxsiy kabinetga kirish uchun tizimga kiring.');
          setAuthMode('login');
          setView('auth');
          window.history.replaceState({}, '', '/login');
          return;
        }
        setView('customer_dashboard');
        return;
      }

      if (cleanPath === '/admin/login') {
        setAuthMode('admin');
        setView('auth');
        return;
      }

      if (cleanPath === '/login') {
        setAuthMode('login');
        setView('auth');
        return;
      }

      if (cleanPath === '/register') {
        setAuthMode('register');
        setView('auth');
        return;
      }

      setView('home');
    },
    [triggerGlobalError]
  );

  const navigateWithUrl = useCallback(
    (
      nextView: AppView,
      userForCheck: UserAccount | null = currentUser,
      modeOverride?: 'login' | 'register' | 'admin'
    ) => {
      if (nextView === 'admin_dashboard') {
        resolveRouteWithGuard('/admin/dashboard', userForCheck);
        if (userForCheck?.role === UserRole.ADMIN) {
          window.history.pushState({}, '', '/admin/dashboard');
        }
      } else if (nextView === 'reception_dashboard') {
        resolveRouteWithGuard('/reception', userForCheck);
        if (
          userForCheck?.role === UserRole.RECEPTION ||
          userForCheck?.role === UserRole.ADMIN
        ) {
          window.history.pushState({}, '', '/reception');
        }
      } else if (nextView === 'customer_dashboard') {
        resolveRouteWithGuard('/customer', userForCheck);
        if (userForCheck) {
          window.history.pushState({}, '', '/customer');
        }
      } else if (nextView === 'auth') {
        const m = modeOverride || authMode;
        setAuthMode(m);
        setView('auth');
        window.history.pushState(
          {},
          '',
          m === 'admin' ? '/admin/login' : m === 'register' ? '/register' : '/login'
        );
      } else {
        setView('home');
        window.history.pushState({}, '', '/');
      }
    },
    [currentUser, authMode, resolveRouteWithGuard]
  );

  // Sync state from backend API
  const refreshServerState = useCallback(async () => {
    try {
      const data = await resortApi.getState();
      setRooms(Array.isArray(data.rooms) && data.rooms.length > 0 ? data.rooms : INITIAL_ROOMS);
      setPhysicalRooms(data.physicalRooms || []);
      setServices(
        Array.isArray(data.services) && data.services.length > 0
          ? data.services
          : INITIAL_SERVICES
      );
      setBookings(data.bookings || []);
      setBookedSlots(data.bookedSlots || []);
      setEmails(data.emails || []);
      setNotifications(data.notifications || []);
      setUsers(data.users || []);
      setSettings(data.settings || INITIAL_SETTINGS);
      setCurrentUser(data.currentUser);
      return data.currentUser;
    } catch (err) {
      console.error('Failed to load server state:', err);
      return null;
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshServerState().then((loadedUser) => {
      resolveRouteWithGuard(window.location.pathname, loadedUser);
    });
  }, [refreshServerState, resolveRouteWithGuard]);

  useEffect(() => {
    const onPopState = () => {
      resolveRouteWithGuard(window.location.pathname, currentUser);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [currentUser, resolveRouteWithGuard]);

  // Check if a room category has at least one available physical unit for [searchCheckIn, searchCheckOut)
  const isRoomAvailableForDates = useCallback(
    (room: Room) => {
      if (!room.available) return false;
      if (physicalRooms.length === 0) return true;
      const categoryUnits = physicalRooms.filter((u) => u.category === room.category);
      if (categoryUnits.length === 0) return true;

      const freeUnits = categoryUnits.filter((unit) => {
        if (unit.status === 'MAINTENANCE' || unit.status === 'CLEANING') return false;
        const hasConflict = bookedSlots.some(
          (slot) =>
            slot.assignedUnitNumber === unit.unitNumber &&
            datesOverlap(searchCheckIn, searchCheckOut, slot.checkIn, slot.checkOut)
        );
        return !hasConflict;
      });

      return freeUnits.length > 0;
    },
    [physicalRooms, bookedSlots, searchCheckIn, searchCheckOut]
  );

  // Filtered and Sorted rooms
  const displayedRooms = useMemo(() => {
    const query = roomSearchQuery.trim().toLowerCase();

    const filtered = rooms.filter((r) => {
      if (roomCategoryFilter !== 'ALL' && r.category !== roomCategoryFilter) {
        return false;
      }
      if (searchGuests > r.maxGuests) {
        return false;
      }
      if (query) {
        const matchName =
          r.name.uz.toLowerCase().includes(query) ||
          r.name.ru.toLowerCase().includes(query) ||
          r.name.en.toLowerCase().includes(query) ||
          r.category.toLowerCase().includes(query);
        if (!matchName) return false;
      }
      return true;
    });

    const sorted = [...filtered];
    if (roomSort === 'price_asc') {
      sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
    } else if (roomSort === 'price_desc') {
      sorted.sort((a, b) => b.pricePerNight - a.pricePerNight);
    } else if (roomSort === 'rating_desc') {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (roomSort === 'guests_desc') {
      sorted.sort((a, b) => b.maxGuests - a.maxGuests);
    }
    return sorted;
  }, [rooms, roomCategoryFilter, searchGuests, roomSearchQuery, roomSort]);

  // Role-based Login handler
  const handleAuthSuccess = async (loggedUser: UserAccount) => {
    setCurrentUser(loggedUser);
    await refreshServerState();
    if (loggedUser.role === UserRole.ADMIN) {
      navigateWithUrl('admin_dashboard', loggedUser);
    } else if (loggedUser.role === UserRole.RECEPTION) {
      navigateWithUrl('reception_dashboard', loggedUser);
    } else {
      navigateWithUrl('customer_dashboard', loggedUser);
    }
  };

  const handleLogout = async () => {
    await resortApi.logout();
    setCurrentUser(null);
    await refreshServerState();
    navigateWithUrl('home', null);
  };

  // Render Auth View
  if (view === 'auth') {
    return (
      <AuthView
        lang={lang}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
        onBackToSite={() => navigateWithUrl('home', currentUser)}
      />
    );
  }

  // Render Customer Dashboard (Protected)
  if (view === 'customer_dashboard' && currentUser) {
    return (
      <>
        <CustomerDashboard
          lang={lang}
          onChangeLang={setLang}
          user={currentUser}
          bookings={bookings}
          rooms={rooms}
          services={services}
          emails={emails}
          notifications={notifications}
          onCancelBooking={async (bookingId) => {
            await resortApi.cancelBooking(bookingId);
            await refreshServerState();
          }}
          onSendMessageToReception={async (subj, msg, bId) => {
            await resortApi.sendMessage({
              senderName: currentUser.fullName,
              senderEmail: currentUser.email,
              subject: subj,
              message: msg,
              bookingId: bId,
            });
            await refreshServerState();
          }}
          onUpdateProfile={async (payload) => {
            const res = await resortApi.updateCustomerProfile(payload);
            setCurrentUser(res.user);
            await refreshServerState();
          }}
          onMarkMessageRead={async (emailId) => {
            await resortApi.markEmailRead(emailId);
            await refreshServerState();
          }}
          onOpenBookingModal={(rmId, srvId) => {
            const availRooms = rooms.length > 0 ? rooms : INITIAL_ROOMS;
            setWizardInitialRoomId(rmId || availRooms[0]?.id);
            setWizardInitialServices(srvId ? [srvId] : []);
            setWizardOpen(true);
          }}
          onBackToSite={() => navigateWithUrl('home', currentUser)}
          onLogout={handleLogout}
        />
        <BookingWizardModal
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          lang={lang}
          rooms={rooms}
          physicalRooms={physicalRooms}
          bookedSlots={bookedSlots}
          services={services}
          initialRoomId={wizardInitialRoomId}
          initialServiceIds={wizardInitialServices}
          initialCheckIn={searchCheckIn}
          initialCheckOut={searchCheckOut}
          initialGuests={searchGuests}
          currentUser={currentUser}
          onSubmitBooking={async (payload) => {
            const res = await resortApi.createBooking(payload);
            await refreshServerState();
            return res.booking;
          }}
          onGoToDashboard={() => navigateWithUrl('customer_dashboard', currentUser)}
        />
      </>
    );
  }

  // Render Reception Dashboard (Strictly for RECEPTION or ADMIN)
  if (
    view === 'reception_dashboard' &&
    currentUser &&
    (currentUser.role === UserRole.RECEPTION || currentUser.role === UserRole.ADMIN)
  ) {
    return (
      <>
        <ReceptionDashboard
          lang={lang}
          onChangeLang={setLang}
          user={currentUser}
          bookings={bookings}
          rooms={rooms}
          physicalRooms={physicalRooms}
          services={services}
          emails={emails}
          notifications={notifications}
          onConfirmBooking={async (bookingId, unitNumber) => {
            try {
              await resortApi.confirmBooking(bookingId, unitNumber);
              await refreshServerState();
            } catch (err: any) {
              triggerGlobalError(err?.message || 'Confirm failed');
            }
          }}
          onRejectBooking={async (bookingId) => {
            try {
              await resortApi.rejectBooking(bookingId);
              await refreshServerState();
            } catch (err: any) {
              triggerGlobalError(err?.message || 'Reject failed');
            }
          }}
          onCheckInGuest={async (bookingId, unitNumber) => {
            try {
              await resortApi.checkInGuest(bookingId, unitNumber);
              await refreshServerState();
            } catch (err: any) {
              triggerGlobalError(err?.message || 'Check-in failed');
            }
          }}
          onCheckOutGuest={async (bookingId, unitNumber) => {
            try {
              await resortApi.checkOutGuest(bookingId, unitNumber);
              await refreshServerState();
            } catch (err: any) {
              triggerGlobalError(err?.message || 'Check-out failed');
            }
          }}
          onChangePhysicalRoomStatus={async (unitNumber, status) => {
            await resortApi.updatePhysicalRoomStatus(unitNumber, status);
            await refreshServerState();
          }}
          onAssignRoomToBooking={async (bookingId, unitNumber) => {
            try {
              await resortApi.assignRoomToBooking(bookingId, unitNumber);
              await refreshServerState();
            } catch (err: any) {
              triggerGlobalError(err?.message || 'Assign room failed');
            }
          }}
          onReplyEmail={async (emailId, replyMsg) => {
            await resortApi.replyEmail(emailId, replyMsg);
            await refreshServerState();
          }}
          onMarkEmailRead={async (emailId) => {
            await resortApi.markEmailRead(emailId);
            await refreshServerState();
          }}
          onSendAutomatedTemplate={async (bk, type) => {
            await resortApi.sendReceptionTemplate(bk.id, type);
            await refreshServerState();
          }}
          onSendCustomEmail={async (recipientEmail, recipientName, subject, body, bookingId) => {
            await resortApi.sendMessage({
              senderName: `Reception → ${recipientName}`,
              senderEmail: 'reception@beach.uz',
              recipientEmail,
              subject,
              message: body,
              bookingId,
            });
            await refreshServerState();
          }}
          onOpenBookingModal={() => {
            const availRooms = rooms.length > 0 ? rooms : INITIAL_ROOMS;
            setWizardInitialRoomId(availRooms[0]?.id);
            setWizardInitialServices([]);
            setWizardOpen(true);
          }}
          onBackToSite={() => navigateWithUrl('home', currentUser)}
          onLogout={handleLogout}
        />
        <BookingWizardModal
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          lang={lang}
          rooms={rooms}
          physicalRooms={physicalRooms}
          bookedSlots={bookedSlots}
          services={services}
          initialRoomId={wizardInitialRoomId}
          initialServiceIds={wizardInitialServices}
          initialCheckIn={searchCheckIn}
          initialCheckOut={searchCheckOut}
          initialGuests={searchGuests}
          currentUser={currentUser}
          onSubmitBooking={async (payload) => {
            const res = await resortApi.createBooking(payload);
            await refreshServerState();
            return res.booking;
          }}
          onGoToDashboard={() => navigateWithUrl('reception_dashboard', currentUser)}
        />
      </>
    );
  }

  // Render Admin Dashboard (Strictly for ADMIN role only)
  if (view === 'admin_dashboard' && currentUser && currentUser.role === UserRole.ADMIN) {
    return (
      <>
        <AdminDashboard
          lang={lang}
          onChangeLang={setLang}
          adminUser={currentUser}
          rooms={rooms}
          physicalRooms={physicalRooms}
          services={services}
          bookings={bookings}
          users={users}
          settings={settings}
          onAddRoom={async (newRm) => {
            await resortApi.adminAddRoom(newRm);
            await refreshServerState();
          }}
          onUpdateRoom={async (id, upd) => {
            await resortApi.adminUpdateRoom(id, upd);
            await refreshServerState();
          }}
          onDeleteRoom={async (id) => {
            await resortApi.adminDeleteRoom(id);
            await refreshServerState();
          }}
          onAddService={async (newSrv) => {
            await resortApi.adminAddService(newSrv);
            await refreshServerState();
          }}
          onUpdateService={async (id, upd) => {
            await resortApi.adminUpdateService(id, upd);
            await refreshServerState();
          }}
          onDeleteService={async (id) => {
            await resortApi.adminDeleteService(id);
            await refreshServerState();
          }}
          onAddReceptionUser={async (payload) => {
            await resortApi.adminCreateUser(payload);
            await refreshServerState();
          }}
          onUpdateUser={async (id, upd) => {
            await resortApi.adminUpdateUser(id, upd);
            await refreshServerState();
          }}
          onUpdateBooking={async (id, upd) => {
            await resortApi.adminUpdateBooking(id, upd);
            await refreshServerState();
          }}
          onUpdateSettings={async (upd) => {
            await resortApi.adminUpdateSettings(upd);
            await refreshServerState();
          }}
          onOpenBookingModal={() => {
            const availRooms = rooms.length > 0 ? rooms : INITIAL_ROOMS;
            setWizardInitialRoomId(availRooms[0]?.id);
            setWizardInitialServices([]);
            setWizardOpen(true);
          }}
          onBackToSite={() => navigateWithUrl('home', currentUser)}
          onLogout={handleLogout}
        />
        <BookingWizardModal
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          lang={lang}
          rooms={rooms}
          physicalRooms={physicalRooms}
          bookedSlots={bookedSlots}
          services={services}
          initialRoomId={wizardInitialRoomId}
          initialServiceIds={wizardInitialServices}
          initialCheckIn={searchCheckIn}
          initialCheckOut={searchCheckOut}
          initialGuests={searchGuests}
          currentUser={currentUser}
          onSubmitBooking={async (payload) => {
            const res = await resortApi.createBooking(payload);
            await refreshServerState();
            return res.booking;
          }}
          onGoToDashboard={() => navigateWithUrl('admin_dashboard', currentUser)}
        />
      </>
    );
  }

  // PUBLIC LUXURY RESORT WEBSITE
  return (
    <div id="top" className="min-h-screen bg-[#F9F6F0] text-[#0A192F]">
      {/* Sticky Transparent-to-Glass Navbar */}
      <Navbar
        lang={lang}
        onChangeLang={setLang}
        currentUser={currentUser}
        onOpenAuth={(mode) => navigateWithUrl('auth', currentUser, mode)}
        onNavigateView={(targetView) => navigateWithUrl(targetView, currentUser)}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotificationRead={async (id) => {
          await resortApi.markNotificationRead(id, false);
          await refreshServerState();
        }}
        onMarkAllNotificationsRead={async () => {
          await resortApi.markNotificationRead(undefined, true);
          await refreshServerState();
        }}
      />

      {/* Global Toast & Error Banners */}
      {globalToast && (
        <div className="fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-xl border border-[#0D9488] bg-[#0A192F] px-5 py-3.5 text-xs font-semibold text-white shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-[#5EEAD4]" />
          <span>{globalToast}</span>
        </div>
      )}

      {globalError && (
        <div
          role="alert"
          className="fixed right-6 bottom-6 z-50 flex items-center gap-2.5 rounded-xl border border-red-300 bg-red-900 px-5 py-3.5 text-xs font-semibold text-white shadow-2xl"
        >
          <AlertCircle className="h-4 w-4 text-red-300" />
          <span>{globalError}</span>
        </div>
      )}

      {/* ==================================================
          1. FULL-SCREEN CINEMATIC BEACH HERO
         ================================================== */}
      <section className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#0A192F] pt-28 pb-24 text-white">
        <div className="absolute inset-0">
          <ResilientImage
            src={HERO_IMAGE}
            alt="BEACH Luxury Resort Coastline"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F] via-[#0A192F]/45 to-[#0A192F]/55" />
        </div>

        <div className="relative z-10 mx-auto my-auto w-full max-w-[1360px] px-4 pt-10 sm:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#5EEAD4] uppercase">
              {t(lang, 'heroKicker')}
            </p>
            <h1 className="font-display mt-4 text-5xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t(lang, 'heroTitle')}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              {t(lang, 'heroSubtitle')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setWizardInitialRoomId(rooms[1]?.id || rooms[0]?.id);
                  setWizardOpen(true);
                }}
                className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#0D9488] px-7 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#0F766E]"
              >
                <span>{t(lang, 'bookRoomBtn')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#services"
                className="whitespace-nowrap rounded-xl border border-white/35 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                {t(lang, 'viewServicesBtn')}
              </a>
            </div>
          </div>

          {/* Floating Glassmorphic Booking Search Panel */}
          <div className="mt-12 rounded-2xl border border-white/20 bg-white/12 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchCheckIn < '2025-01-01' || searchCheckOut <= searchCheckIn) {
                  triggerGlobalError(
                    lang === 'uz'
                      ? 'Chiqish sanasi kirish sanasidan keyin bo‘lishi kerak.'
                      : 'Check-out date must be after check-in date.'
                  );
                  return;
                }
                const el = document.getElementById('rooms');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/80">
                  {t(lang, 'checkIn')}
                </label>
                <input
                  type="date"
                  value={searchCheckIn}
                  min="2025-01-01"
                  onChange={(e) => setSearchCheckIn(e.target.value)}
                  className="font-mono w-full rounded-xl border border-white/25 bg-[#0A192F]/70 px-3.5 py-2.5 text-xs text-white tabular-nums focus:border-[#5EEAD4] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/80">
                  {t(lang, 'checkOut')}
                </label>
                <input
                  type="date"
                  value={searchCheckOut}
                  min={searchCheckIn}
                  onChange={(e) => setSearchCheckOut(e.target.value)}
                  className="font-mono w-full rounded-xl border border-white/25 bg-[#0A192F]/70 px-3.5 py-2.5 text-xs text-white tabular-nums focus:border-[#5EEAD4] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/80">
                  {t(lang, 'guests')}
                </label>
                <select
                  value={searchGuests}
                  onChange={(e) => setSearchGuests(Number(e.target.value))}
                  className="font-mono w-full rounded-xl border border-white/25 bg-[#0A192F]/70 px-3.5 py-2.5 text-xs text-white tabular-nums focus:border-[#5EEAD4] focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n} className="bg-[#0A192F] text-white">
                      {n} {t(lang, 'guestsUnit')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/80">
                  {t(lang, 'roomType')}
                </label>
                <select
                  value={roomCategoryFilter}
                  onChange={(e) =>
                    setRoomCategoryFilter(e.target.value as 'ALL' | RoomCategory)
                  }
                  className="w-full rounded-xl border border-white/25 bg-[#0A192F]/70 px-3.5 py-2.5 text-xs text-white focus:border-[#5EEAD4] focus:outline-none"
                >
                  <option value="ALL" className="bg-[#0A192F]">
                    {t(lang, 'allRooms')}
                  </option>
                  {(['Standard', 'Deluxe', 'Family', 'Luxury', 'VIP'] as RoomCategory[]).map(
                    (cat) => (
                      <option key={cat} value={cat} className="bg-[#0A192F]">
                        {cat}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white py-2.5 px-5 text-xs font-bold text-[#0A192F] shadow-md transition-colors hover:bg-[#F9F6F0]"
                >
                  <Search className="h-4 w-4 text-[#0D9488]" />
                  <span>{t(lang, 'searchBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Subtle Animated Ocean Waves Near Bottom of Hero */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 overflow-hidden leading-none">
          <svg
            className="animate-wave-slow relative block h-14 w-[104%] text-[#F9F6F0]"
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
          >
            <path
              fill="currentColor"
              fillOpacity="0.35"
              d="M0,40 C320,95 620,0 960,50 C1200,85 1350,30 1440,45 L1440,100 L0,100 Z"
            />
            <path
              fill="currentColor"
              d="M0,65 C380,15 760,95 1140,45 C1300,25 1390,55 1440,65 L1440,100 L0,100 Z"
            />
          </svg>
        </div>
      </section>

      {/* ==================================================
          2. LUXURY ROOMS & SUITES SECTION (#rooms)
         ================================================== */}
      <section id="rooms" className="mx-auto max-w-[1360px] px-4 py-20 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#0D9488] uppercase">
              {t(lang, 'roomsKicker')}
            </p>
            <h2 className="font-display mt-2 text-4xl font-semibold text-[#0A192F] sm:text-5xl">
              {t(lang, 'roomsTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {t(lang, 'roomsSubtitle')}
            </p>
          </div>

          {/* Search, Category Filter & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                placeholder={
                  lang === 'uz'
                    ? 'Xona qidirish...'
                    : lang === 'ru'
                    ? 'Поиск номера...'
                    : 'Search suites...'
                }
                className="rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-8 text-xs text-[#0A192F] focus:border-[#0D9488] focus:outline-none"
              />
            </div>

            {/* Sorting Select */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#0D9488]" />
              <select
                aria-label="Sort rooms"
                value={roomSort}
                onChange={(e) => setRoomSort(e.target.value as RoomSortOption)}
                className="bg-transparent text-xs font-semibold text-[#0A192F] focus:outline-none"
              >
                <option value="default">
                  {lang === 'uz'
                    ? 'Saralash: Standart'
                    : lang === 'ru'
                    ? 'Сортировка'
                    : 'Sort: Featured'}
                </option>
                <option value="price_asc">
                  {lang === 'uz'
                    ? 'Narx: Arzondan qimmatga'
                    : lang === 'ru'
                    ? 'Цена: по возрастанию'
                    : 'Price: Low to High'}
                </option>
                <option value="price_desc">
                  {lang === 'uz'
                    ? 'Narx: Qimmatdan arzonga'
                    : lang === 'ru'
                    ? 'Цена: по убыванию'
                    : 'Price: High to Low'}
                </option>
                <option value="rating_desc">
                  {lang === 'uz'
                    ? 'Reyting: Yuqori'
                    : lang === 'ru'
                    ? 'Рейтинг: высокий'
                    : 'Rating: Highest'}
                </option>
                <option value="guests_desc">
                  {lang === 'uz'
                    ? 'Sig‘im: Ko‘p mehmon'
                    : lang === 'ru'
                    ? 'Вместимость'
                    : 'Capacity: Most Guests'}
                </option>
              </select>
            </div>

            {/* Interactive Segmented Category Filter */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
              {(['ALL', 'Standard', 'Deluxe', 'Family', 'Luxury', 'VIP'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setRoomCategoryFilter(cat)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    roomCategoryFilter === cat
                      ? 'bg-[#0A192F] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#0A192F]'
                  }`}
                >
                  {cat === 'ALL' ? t(lang, 'allRooms') : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skeleton Loader State vs Populated vs Empty State */}
        {isInitialLoading ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[440px] animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="h-56 w-full rounded-xl bg-slate-200" />
                <div className="mt-4 h-4 w-1/2 rounded bg-slate-200" />
                <div className="mt-3 h-6 w-3/4 rounded bg-slate-200" />
                <div className="mt-6 h-10 w-full rounded-xl bg-slate-200" />
              </div>
            ))}
          </div>
        ) : displayedRooms.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="font-display text-2xl font-semibold text-[#0A192F]">
              {t(lang, 'msgRoomUnavailable')}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Qidiruv mezonlarini o‘zgartirib ko‘ring yoki barcha xonalarni ko‘rsating.
            </p>
            <button
              type="button"
              onClick={() => {
                setRoomCategoryFilter('ALL');
                setSearchGuests(1);
                setRoomSearchQuery('');
              }}
              className="mt-4 rounded-xl bg-[#0D9488] px-5 py-2.5 text-xs font-semibold text-white"
            >
              {t(lang, 'allRooms')}
            </button>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {displayedRooms.map((room) => {
              const availableForDates = isRoomAvailableForDates(room);
              return (
                <article
                  key={room.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all duration-300 hover:border-[#0D9488]/50"
                >
                  <div>
                    <div className="relative h-64 w-full overflow-hidden">
                      <ResilientImage
                        src={room.image}
                        alt={localize(lang, room.name)}
                        zoomOnHover
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-6">
                      {/* Unboxed Metadata Kicker (Zero-Pill Discipline) */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-semibold text-[#0D9488]">{room.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-semibold text-[#0A192F] tabular-nums">
                          ★ {room.rating.toFixed(1)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {room.maxGuests} {t(lang, 'guestsUnit')}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{room.sizeSqm} m²</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            availableForDates
                              ? 'font-medium text-emerald-700'
                              : 'font-medium text-red-600'
                          }
                        >
                          {availableForDates
                            ? t(lang, 'availableLabel')
                            : t(lang, 'unavailableLabel')}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-2xl font-semibold text-[#0A192F]">
                          {localize(lang, room.name)}
                        </h3>
                        <div className="shrink-0 text-right">
                          <span className="font-mono text-xl font-bold text-[#0A192F] tabular-nums">
                            ${room.pricePerNight}
                          </span>
                          <span className="text-xs text-slate-500">{t(lang, 'perNight')}</span>
                        </div>
                      </div>

                      <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {localize(lang, room.description)}
                      </p>

                      <div className="mt-4 border-t border-slate-100 pt-3.5 text-xs text-slate-500">
                        <span>{localize(lang, room.bedType)}</span>
                        <span className="mx-1.5" aria-hidden="true">
                          ·
                        </span>
                        <span>Wi-Fi</span>
                        <span className="mx-1.5" aria-hidden="true">
                          ·
                        </span>
                        <span>AC</span>
                        <span className="mx-1.5" aria-hidden="true">
                          ·
                        </span>
                        <span>
                          {room.bathroomCount} {t(lang, 'bathroomLabel')}
                        </span>
                        <span className="mx-1.5" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-medium text-[#0A192F]">
                          {localize(lang, room.seaView)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: [Batafsil] & [Bron qilish] */}
                  <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setDetailRoom(room)}
                      className="flex-1 whitespace-nowrap rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-[#0A192F] transition-colors hover:bg-slate-50"
                    >
                      {t(lang, 'detailsBtn')}
                    </button>
                    <button
                      type="button"
                      disabled={!availableForDates}
                      onClick={() => {
                        setWizardInitialRoomId(room.id);
                        setWizardOpen(true);
                      }}
                      className="flex-1 whitespace-nowrap rounded-xl bg-[#0D9488] py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {availableForDates ? t(lang, 'bookNowBtn') : t(lang, 'unavailableLabel')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ==================================================
          3. BEACH SERVICES & MARINE EXPERIENCES (#services)
         ================================================== */}
      <section id="services" className="border-t border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#0D9488] uppercase">
                {t(lang, 'servicesKicker')}
              </p>
              <h2 className="font-display mt-2 text-4xl font-semibold text-[#0A192F] sm:text-5xl">
                {t(lang, 'servicesTitle')}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                {t(lang, 'servicesSubtitle')}
              </p>
            </div>

            {wizardInitialServices.length > 0 && (
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-[#0A192F] px-5 py-3 text-xs font-semibold text-white shadow-md hover:bg-slate-800"
              >
                <span>
                  {t(lang, 'bookNowBtn')} ({wizardInitialServices.length} xizmat tanlandi)
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((srv, index) => {
              const isSelected = wizardInitialServices.includes(srv.id);
              return (
                <article
                  key={srv.id}
                  className={`group flex flex-col justify-between overflow-hidden rounded-2xl border bg-[#F9F6F0]/60 transition-all duration-300 ${
                    index === 0 ? 'sm:col-span-2 lg:col-span-2' : ''
                  } ${
                    isSelected
                      ? 'border-[#0D9488] ring-1 ring-[#0D9488]'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="relative h-52 w-full overflow-hidden">
                      <ResilientImage
                        src={srv.image}
                        alt={localize(lang, srv.name)}
                        zoomOnHover
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-semibold text-[#0D9488]">
                          0{index + 1}. {localize(lang, srv.categoryTag)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{localize(lang, srv.duration)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-emerald-700">
                          {t(lang, 'availableLabel')}
                        </span>
                      </div>

                      <div className="mt-2 flex items-baseline justify-between gap-2">
                        <h3 className="font-display text-2xl font-semibold text-[#0A192F]">
                          {localize(lang, srv.name)}
                        </h3>
                        <span className="font-mono text-lg font-bold text-[#0A192F] tabular-nums">
                          ${srv.price}
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {localize(lang, srv.description)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 border-t border-slate-200/70 bg-white px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => {
                        setWizardInitialServices((prev) =>
                          prev.includes(srv.id)
                            ? prev.filter((id) => id !== srv.id)
                            : [...prev, srv.id]
                        );
                      }}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'border-[#0D9488] bg-[#0D9488]/10 text-[#0F766E]'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                      <span>
                        {isSelected ? t(lang, 'serviceAdded') : t(lang, 'addServiceToBooking')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!wizardInitialServices.includes(srv.id)) {
                          setWizardInitialServices((prev) => [...prev, srv.id]);
                        }
                        setWizardOpen(true);
                      }}
                      className="flex-1 whitespace-nowrap rounded-xl bg-[#0A192F] py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                      {t(lang, 'bookNowBtn')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================
          4. ABOUT & QUANTIFIED PROOF SECTION (#about)
         ================================================== */}
      <section id="about" className="mx-auto max-w-[1360px] px-4 py-20 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-6">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#0D9488] uppercase">
              {t(lang, 'aboutKicker')}
            </p>
            <h2 className="font-display text-4xl font-semibold text-[#0A192F] sm:text-5xl">
              {t(lang, 'aboutTitle')}
            </h2>
            <p className="text-base leading-relaxed text-slate-600">{t(lang, 'aboutBody')}</p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-mono text-2xl font-bold text-[#0D9488] tabular-nums">1.4 km</p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {t(lang, 'statCoastline')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-mono text-2xl font-bold text-[#0A192F] tabular-nums">99.4%</p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {t(lang, 'statSatisfaction')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-mono text-2xl font-bold text-[#0A192F] tabular-nums">24/7</p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {t(lang, 'statConcierge')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-mono text-2xl font-bold text-[#0D9488] tabular-nums">42</p>
                <p className="mt-1 text-xs font-medium text-slate-600">{t(lang, 'statVillas')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:col-span-6">
            <div className="h-80 overflow-hidden rounded-2xl">
              <ResilientImage
                src={IMG_ROOM_VILLA}
                alt="VIP Overwater & Beach Villa"
                zoomOnHover
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-8 h-80 overflow-hidden rounded-2xl">
              <ResilientImage
                src={IMG_SERVICE_TAPCHAN}
                alt="Private Beach Cabana Tapchan"
                zoomOnHover
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          5. ASYMMETRIC VISUAL GALLERY (#gallery)
         ================================================== */}
      <section id="gallery" className="border-t border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#0D9488] uppercase">
              {t(lang, 'galleryKicker')}
            </p>
            <h2 className="font-display mt-2 text-4xl font-semibold text-[#0A192F] sm:text-5xl">
              {t(lang, 'galleryTitle')}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{t(lang, 'gallerySubtitle')}</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
            <div className="group relative h-80 overflow-hidden rounded-2xl lg:col-span-7">
              <ResilientImage
                src={HERO_IMAGE}
                alt="Golden Hour Infinity Pool & Coastline"
                zoomOnHover
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-6">
                <p className="font-display text-xl text-white">
                  01. Panoramali Infinity Basseyn va Sohil
                </p>
              </div>
            </div>

            <div className="group relative h-80 overflow-hidden rounded-2xl lg:col-span-5">
              <ResilientImage
                src={IMG_ROOM_SUITE}
                alt="Deluxe Oceanfront Suite Interior"
                zoomOnHover
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-6">
                <p className="font-display text-xl text-white">
                  02. Deluxe & Luxury Panoramali Xonalar
                </p>
              </div>
            </div>

            <div className="group relative h-72 overflow-hidden rounded-2xl lg:col-span-4">
              <ResilientImage
                src={IMG_SERVICE_TAPCHAN}
                alt="Beachfront Tapchan Cabana"
                zoomOnHover
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-6">
                <p className="font-display text-xl text-white">
                  03. Shaxsiy Sohil Tapchan Pavilonlari
                </p>
              </div>
            </div>

            <div className="group relative h-72 overflow-hidden rounded-2xl lg:col-span-4">
              <ResilientImage
                src={IMG_SERVICE_YACHT}
                alt="VIP Yacht & Speedboat Charter"
                zoomOnHover
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-6">
                <p className="font-display text-xl text-white">
                  04. Tezyurar Kater va Yaxta Kruizlari
                </p>
              </div>
            </div>

            <div className="group relative h-72 overflow-hidden rounded-2xl lg:col-span-4">
              <ResilientImage
                src={IMG_ROOM_VILLA}
                alt="VIP Private Pool Villa"
                zoomOnHover
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-6">
                <p className="font-display text-xl text-white">
                  05. Shaxsiy Basseynli VIP Villalar
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          6. DIRECT RECEPTION CONTACT SECTION (#contact)
         ================================================== */}
      <section id="contact" className="mx-auto max-w-[1360px] px-4 py-20 sm:px-8">
        <div className="grid gap-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#0D9488] uppercase">
              {t(lang, 'contactKicker')}
            </p>
            <h2 className="font-display text-3xl font-semibold text-[#0A192F] sm:text-4xl">
              {t(lang, 'contactTitle')}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">{t(lang, 'contactSubtitle')}</p>

            <div className="space-y-4 border-t border-slate-100 pt-6 text-xs text-slate-700">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#0D9488]" />
                <span className="font-mono font-semibold tabular-nums">
                  {settings.supportPhone}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#0D9488]" />
                <span className="font-mono">{settings.supportEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#0D9488]" />
                <span>{localize(lang, settings.address)}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {contactToast && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{contactToast}</span>
              </div>
            )}

            {contactError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>{contactError}</span>
              </div>
            )}

            <form
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                if (contactSubmitting) return;
                setContactError('');
                if (
                  !contactName.trim() ||
                  !contactEmail.includes('@') ||
                  !contactSubject.trim() ||
                  !contactMessage.trim()
                ) {
                  setContactError(
                    lang === 'uz'
                      ? 'Iltimos, barcha yulduzchali (*) maydonlarni to‘ldiring.'
                      : 'Please fill in all required fields.'
                  );
                  return;
                }
                setContactSubmitting(true);
                try {
                  await resortApi.sendMessage({
                    senderName: contactName.trim(),
                    senderEmail: contactEmail.trim(),
                    subject: contactSubject.trim(),
                    message: contactMessage.trim(),
                  });
                  await refreshServerState();
                  setContactSubject('');
                  setContactMessage('');
                  setContactToast(t(lang, 'msgEmailSent'));
                  setTimeout(() => setContactToast(''), 4000);
                } catch (err: any) {
                  setContactError(err?.message || 'Xatolik yuz berdi.');
                } finally {
                  setContactSubmitting(false);
                }
              }}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {t(lang, 'yourName')} *
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Aziza Karimova"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {t(lang, 'yourEmail')} *
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="guest@mail.uz"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {t(lang, 'yourPhone')}
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="font-mono w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm tabular-nums focus:border-[#0D9488] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {t(lang, 'subjectLabel')} *
                </label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="Xona yoki kater broni haqida"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {t(lang, 'messageLabel')} *
                </label>
                <textarea
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-[#0A192F] px-7 py-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {contactSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{t(lang, 'sendMessageBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ==================================================
          7. QUIET LUXURY FOOTER WITH ROLE PORTAL LAUNCHERS
         ================================================== */}
      <footer className="border-t border-white/10 bg-[#0A192F] py-14 text-white">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-8">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="space-y-3 md:col-span-5">
              <span className="font-display text-3xl font-semibold tracking-[0.22em] text-white">
                BEACH
              </span>
              <p className="max-w-sm text-xs leading-relaxed text-white/70">
                {t(lang, 'heroSubtitle')}
              </p>
              <p className="font-mono text-xs text-[#5EEAD4] tabular-nums">
                Check-in: {settings.checkInTime} · Check-out: {settings.checkOutTime}
              </p>
            </div>

            <div className="space-y-2 text-xs md:col-span-3">
              <p className="font-semibold tracking-wider text-white/50 uppercase">Navigation</p>
              <ul className="space-y-2 text-white/80">
                <li>
                  <a href="#rooms" className="hover:text-[#5EEAD4]">
                    {t(lang, 'navRooms')}
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-[#5EEAD4]">
                    {t(lang, 'navServices')}
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-[#5EEAD4]">
                    {t(lang, 'navAbout')}
                  </a>
                </li>
                <li>
                  <a href="#gallery" className="hover:text-[#5EEAD4]">
                    {t(lang, 'navGallery')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Guest Account & Management Navigation */}
            <div className="space-y-3 text-xs md:col-span-4">
              <p className="font-semibold tracking-wider text-white/50 uppercase">
                {t(lang, 'customerPortalBtn')}
              </p>
              <div className="flex flex-wrap gap-2">
                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentUser.role === UserRole.ADMIN) {
                        navigateWithUrl('admin_dashboard', currentUser);
                      } else if (currentUser.role === UserRole.RECEPTION) {
                        navigateWithUrl('reception_dashboard', currentUser);
                      } else {
                        navigateWithUrl('customer_dashboard', currentUser);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-[#5EEAD4]" />
                    <span>{t(lang, 'dashboardBtn')}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => navigateWithUrl('auth', null, 'login')}
                      className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-medium text-white hover:bg-white/15"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-[#5EEAD4]" />
                      <span>{t(lang, 'loginBtn')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateWithUrl('auth', null, 'register')}
                      className="flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
                    >
                      <span>{t(lang, 'registerBtn')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50">
            <p>© 2026 BEACH Luxury Coastal Resort. All rights reserved.</p>
            <div className="flex gap-3">
              {(['uz', 'ru', 'en'] as Language[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`uppercase ${
                    lang === l ? 'font-bold text-[#5EEAD4]' : 'hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Room Detail & Rate Calculator Modal */}
      <RoomDetailModal
        room={detailRoom}
        onClose={() => setDetailRoom(null)}
        lang={lang}
        services={services}
        onProceedToBook={(rmId, cIn, cOut, gCount, srvIds) => {
          setDetailRoom(null);
          setWizardInitialRoomId(rmId);
          setSearchCheckIn(cIn);
          setSearchCheckOut(cOut);
          setSearchGuests(gCount);
          setWizardInitialServices(srvIds);
          setWizardOpen(true);
        }}
      />

      {/* 6-Step Booking Wizard Modal */}
      <BookingWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        lang={lang}
        rooms={rooms}
        physicalRooms={physicalRooms}
        bookedSlots={bookedSlots}
        services={services}
        initialRoomId={wizardInitialRoomId}
        initialServiceIds={wizardInitialServices}
        initialCheckIn={searchCheckIn}
        initialCheckOut={searchCheckOut}
        initialGuests={searchGuests}
        currentUser={currentUser}
        onSubmitBooking={async (payload) => {
          const res = await resortApi.createBooking(payload);
          await refreshServerState();
          triggerGlobalToast(t(lang, 'msgBookingCreated'));
          return res.booking;
        }}
        onGoToDashboard={() => {
          if (!currentUser) {
            navigateWithUrl('auth', null, 'login');
          } else if (currentUser.role === UserRole.ADMIN) {
            navigateWithUrl('admin_dashboard', currentUser);
          } else if (currentUser.role === UserRole.RECEPTION) {
            navigateWithUrl('reception_dashboard', currentUser);
          } else {
            navigateWithUrl('customer_dashboard', currentUser);
          }
        }}
      />
    </div>
  );
}
