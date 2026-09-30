import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  BedDouble,
  Waves,
  Mail,
  LogIn,
  LogOut as LogOutIcon,
  Bell,
  User,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  MailOpen,
  Sparkles,
} from 'lucide-react';
import {
  AppNotification,
  BeachService,
  Booking,
  EmailCategory,
  Language,
  PhysicalRoom,
  PhysicalRoomStatus,
  ResortEmail,
  Room,
  UserAccount,
} from '../types/resort';
import { generateEmailTemplate, localize, t } from '../i18n/translations';
import { TODAY_DATE } from '../data/initialData';

interface ReceptionDashboardProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  user: UserAccount;
  bookings: Booking[];
  rooms: Room[];
  physicalRooms: PhysicalRoom[];
  services: BeachService[];
  emails: ResortEmail[];
  notifications: AppNotification[];
  onConfirmBooking: (bookingId: string, unitNumber?: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onCheckInGuest: (bookingId: string, unitNumber: string) => void;
  onCheckOutGuest: (bookingId: string, unitNumber?: string) => void;
  onChangePhysicalRoomStatus: (unitNumber: string, status: PhysicalRoomStatus) => void;
  onAssignRoomToBooking: (bookingId: string, unitNumber: string) => void;
  onReplyEmail: (emailId: string, replyMessage: string) => void;
  onMarkEmailRead: (emailId: string) => void;
  onSendAutomatedTemplate: (
    booking: Booking,
    templateType: 'CHECKIN_INFO' | 'CHECKOUT_INFO' | 'CONFIRMED'
  ) => void;
  onSendCustomEmail: (
    recipientEmail: string,
    recipientName: string,
    subject: string,
    body: string,
    bookingId?: string
  ) => void;
  onOpenBookingModal?: () => void;
  onBackToSite: () => void;
  onLogout: () => void;
}

type ReceptionTab =
  | 'dashboard'
  | 'bookings'
  | 'guests'
  | 'rooms'
  | 'services'
  | 'messages'
  | 'checkin'
  | 'checkout'
  | 'notifications'
  | 'profile';

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  lang,
  onChangeLang,
  user,
  bookings,
  rooms,
  physicalRooms,
  services,
  emails,
  notifications,
  onConfirmBooking,
  onRejectBooking,
  onCheckInGuest,
  onCheckOutGuest,
  onChangePhysicalRoomStatus,
  onAssignRoomToBooking,
  onReplyEmail,
  onMarkEmailRead,
  onSendAutomatedTemplate,
  onSendCustomEmail,
  onOpenBookingModal,
  onBackToSite,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<ReceptionTab>('dashboard');
  const [emailCategory, setEmailCategory] = useState<'ALL' | EmailCategory>('ALL');
  const [selectedEmailId, setSelectedEmailId] = useState<string>(emails[0]?.id || '');
  const [replyText, setReplyText] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Custom Compose Email Modal
  const [composeOpen, setComposeOpen] = useState(false);
  const [compEmail, setCompEmail] = useState('');
  const [compName, setCompName] = useState('');
  const [compSubj, setCompSubj] = useState('');
  const [compBody, setCompBody] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Statistics
  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const todaysArrivals = bookings.filter(
    (b) =>
      (b.checkIn === TODAY_DATE || b.status === 'CONFIRMED') &&
      b.status !== 'CHECKED_IN' &&
      b.status !== 'COMPLETED' &&
      b.status !== 'CANCELLED' &&
      b.status !== 'REJECTED'
  );
  const todaysDepartures = bookings.filter((b) => b.status === 'CHECKED_IN');
  const availableUnits = physicalRooms.filter((r) => r.status === 'AVAILABLE');
  const occupiedUnits = physicalRooms.filter((r) => r.status === 'OCCUPIED');

  const filteredEmails = emails.filter((e) =>
    emailCategory === 'ALL' ? true : e.category === emailCategory
  );
  const activeEmail =
    filteredEmails.find((e) => e.id === selectedEmailId) || filteredEmails[0] || null;

  const linkedBooking = activeEmail?.bookingId
    ? bookings.find((b) => b.id === activeEmail.bookingId)
    : undefined;

  const sidebarItems: { id: ReceptionTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: t(lang, 'recDash'), icon: <LayoutDashboard className="h-4 w-4" /> },
    {
      id: 'bookings',
      label: t(lang, 'recBookings'),
      icon: <CalendarCheck className="h-4 w-4" />,
      badge: pendingBookings.length,
    },
    { id: 'guests', label: t(lang, 'recGuests'), icon: <Users className="h-4 w-4" /> },
    { id: 'rooms', label: t(lang, 'recRooms'), icon: <BedDouble className="h-4 w-4" /> },
    { id: 'services', label: t(lang, 'recServices'), icon: <Waves className="h-4 w-4" /> },
    {
      id: 'messages',
      label: t(lang, 'recMessages'),
      icon: <Mail className="h-4 w-4" />,
      badge: emails.filter((e) => !e.read).length,
    },
    {
      id: 'checkin',
      label: t(lang, 'recCheckIn'),
      icon: <LogIn className="h-4 w-4" />,
      badge: todaysArrivals.length,
    },
    {
      id: 'checkout',
      label: t(lang, 'recCheckOut'),
      icon: <LogOutIcon className="h-4 w-4" />,
      badge: todaysDepartures.length,
    },
    { id: 'notifications', label: t(lang, 'recNotifications'), icon: <Bell className="h-4 w-4" /> },
    { id: 'profile', label: t(lang, 'recProfile'), icon: <User className="h-4 w-4" /> },
  ];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmail || !replyText.trim()) return;
    onReplyEmail(activeEmail.id, replyText.trim());
    setReplyText('');
    showToast(t(lang, 'msgEmailSent'));
  };

  return (
    <div className="flex min-h-screen bg-[#F9F6F0] text-[#0A192F]">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-[#0A192F] p-6 text-white lg:flex">
        <div>
          <div className="flex items-center justify-between border-b border-white/15 pb-5">
            <button
              type="button"
              onClick={onBackToSite}
              className="font-display text-2xl font-bold tracking-[0.2em] text-white"
            >
              BEACH
            </button>
            <span className="font-mono text-[11px] font-semibold text-[#5EEAD4]">
              RECEPTION
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-white">{user.fullName}</p>
            <p className="text-[11px] text-white/60">{user.email}</p>
          </div>

          <nav className="mt-5 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-[#0D9488] font-semibold text-white'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="font-mono rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-2 border-t border-white/15 pt-4">
          <button
            type="button"
            onClick={onBackToSite}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-white/80 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t(lang, 'backToSite')}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10"
          >
            <LogOutIcon className="h-4 w-4" />
            <span>{t(lang, 'logoutBtn')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToSite}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t(lang, 'backToSite')}
            </button>
            <h1 className="font-display text-2xl font-semibold text-[#0A192F]">
              Reception · {sidebarItems.find((i) => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {(['uz', 'ru', 'en'] as Language[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChangeLang(c)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase ${
                    lang === c ? 'bg-white text-[#0A192F] shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            {onOpenBookingModal && (
              <button
                type="button"
                onClick={onOpenBookingModal}
                className="rounded-lg bg-[#0D9488] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
              >
                + {t(lang, 'bookRoomBtn')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="rounded-lg bg-[#0A192F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              + {t(lang, 'composeCustomBtn')}
            </button>
          </div>
        </header>

        {/* Mobile Tab Strip */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${
                activeTab === item.id
                  ? 'bg-[#0D9488] text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {toastMsg && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{toastMsg}</span>
          </div>
        )}

        <main className="flex-1 p-6">
          {/* 1. RECEPTION DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 6 Required Stat Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                {[
                  { label: t(lang, 'statNewBookings'), val: pendingBookings.length, accent: 'text-[#0D9488]' },
                  { label: t(lang, 'statTodayArrivals'), val: todaysArrivals.length, accent: 'text-sky-700' },
                  { label: t(lang, 'statTodayDepartures'), val: todaysDepartures.length, accent: 'text-amber-700' },
                  { label: t(lang, 'statAvailableRooms'), val: availableUnits.length, accent: 'text-emerald-700' },
                  { label: t(lang, 'statOccupiedRooms'), val: occupiedUnits.length, accent: 'text-[#0A192F]' },
                  { label: t(lang, 'statPendingBookings'), val: pendingBookings.length, accent: 'text-amber-600' },
                ].map((st) => (
                  <div
                    key={st.label}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <span className="text-xs font-medium text-slate-500">{st.label}</span>
                    <p className={`font-mono mt-2 text-2xl font-bold tabular-nums ${st.accent}`}>
                      {st.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick Pending Bookings Action Queue */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-[#0A192F]">
                    {t(lang, 'statPendingBookings')} & {t(lang, 'recBookings')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('messages')}
                    className="text-xs font-semibold text-[#0D9488] hover:underline"
                  >
                    {t(lang, 'recMessages')} →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 font-semibold">ID</th>
                        <th className="pb-3 font-semibold">{t(lang, 'guestNameLabel')}</th>
                        <th className="pb-3 font-semibold">{t(lang, 'selectedRoomLabel')}</th>
                        <th className="pb-3 font-semibold">
                          {t(lang, 'checkIn')} / {t(lang, 'checkOut')}
                        </th>
                        <th className="pb-3 text-right font-semibold">{t(lang, 'totalPriceLabel')}</th>
                        <th className="pb-3 font-semibold">{t(lang, 'bookingStatusLabel')}</th>
                        <th className="pb-3 text-right font-semibold">Resepshn Amallari</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            {t(lang, 'noBookingsYet')}
                          </td>
                        </tr>
                      ) : (
                        bookings.map((bk) => (
                        <tr key={bk.id} className="hover:bg-slate-50">
                          <td className="font-mono py-3 font-semibold tabular-nums">{bk.id}</td>
                          <td className="py-3">
                            <p className="font-semibold text-[#0A192F]">{bk.guestName}</p>
                            <p className="text-[11px] text-slate-500">{bk.guestPhone}</p>
                          </td>
                          <td className="py-3 font-medium">
                            {bk.roomCategory}{' '}
                            {bk.assignedUnitNumber ? `(#${bk.assignedUnitNumber})` : ''}
                          </td>
                          <td className="font-mono py-3 text-slate-600 tabular-nums">
                            {bk.checkIn} → {bk.checkOut}
                          </td>
                          <td className="font-mono py-3 text-right font-bold tabular-nums">
                            ${bk.totalPrice}
                          </td>
                          <td className="font-mono py-3 font-semibold">
                            <span
                              className={
                                bk.status === 'CONFIRMED' || bk.status === 'CHECKED_IN'
                                  ? 'text-emerald-700'
                                  : bk.status === 'PENDING'
                                  ? 'text-amber-700'
                                  : 'text-slate-500'
                              }
                            >
                              {bk.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              {bk.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onConfirmBooking(bk.id);
                                      showToast(t(lang, 'msgBookingConfirmed'));
                                    }}
                                    className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                                  >
                                    {t(lang, 'confirmBtn')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onRejectBooking(bk.id);
                                      showToast(t(lang, 'msgBookingRejected'));
                                    }}
                                    className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                                  >
                                    {t(lang, 'rejectBtn')}
                                  </button>
                                </>
                              )}
                              {bk.status === 'CONFIRMED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onCheckInGuest(bk.id, bk.assignedUnitNumber || '201');
                                    showToast(t(lang, 'notifGuestCheckIn'));
                                  }}
                                  className="rounded-md bg-[#0D9488] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0F766E]"
                                >
                                  Check-in
                                </button>
                              )}
                              {bk.status === 'CHECKED_IN' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onCheckOutGuest(bk.id, bk.assignedUnitNumber);
                                    showToast(t(lang, 'notifGuestCheckOut'));
                                  }}
                                  className="rounded-md bg-[#0A192F] px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                                >
                                  Check-out
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. BOOKINGS MANAGEMENT TAB */}
          {activeTab === 'bookings' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display mb-4 text-xl font-semibold text-[#0A192F]">
                {t(lang, 'recBookings')} ({bookings.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-semibold">ID</th>
                      <th className="pb-3 font-semibold">Mehmon</th>
                      <th className="pb-3 font-semibold">Xona & Biriktirilgan raqam</th>
                      <th className="pb-3 font-semibold">Sanalar</th>
                      <th className="pb-3 font-semibold">Xizmatlar</th>
                      <th className="pb-3 text-right font-semibold">Summa</th>
                      <th className="pb-3 font-semibold">Holat</th>
                      <th className="pb-3 text-right font-semibold">Boshqaruv</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50">
                        <td className="font-mono py-3.5 font-semibold tabular-nums">{bk.id}</td>
                        <td className="py-3.5">
                          <p className="font-semibold text-[#0A192F]">{bk.guestName}</p>
                          <p className="text-[11px] text-slate-500">{bk.guestEmail}</p>
                        </td>
                        <td className="py-3.5">
                          <span className="font-medium">{bk.roomCategory}</span>
                          <select
                            value={bk.assignedUnitNumber || ''}
                            onChange={(e) => onAssignRoomToBooking(bk.id, e.target.value)}
                            className="font-mono ml-2 rounded border border-slate-200 px-2 py-0.5 text-xs tabular-nums"
                          >
                            <option value="">Xona #</option>
                            {physicalRooms
                              .filter((u) => u.category === bk.roomCategory)
                              .map((u) => (
                                <option key={u.unitNumber} value={u.unitNumber}>
                                  #{u.unitNumber} ({u.status})
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="font-mono py-3.5 tabular-nums">
                          {bk.checkIn} → {bk.checkOut}
                        </td>
                        <td className="py-3.5 text-slate-600">
                          {bk.serviceIds.length} ta xizmat
                        </td>
                        <td className="font-mono py-3.5 text-right font-bold tabular-nums">
                          ${bk.totalPrice}
                        </td>
                        <td className="font-mono py-3.5 font-semibold">{bk.status}</td>
                        <td className="py-3.5 text-right">
                          <div className="flex justify-end gap-1.5">
                            {bk.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onConfirmBooking(bk.id);
                                    showToast(t(lang, 'msgBookingConfirmed'));
                                  }}
                                  className="rounded bg-emerald-600 px-2.5 py-1 text-white"
                                >
                                  {t(lang, 'confirmBtn')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onRejectBooking(bk.id);
                                    showToast(t(lang, 'msgBookingRejected'));
                                  }}
                                  className="rounded bg-red-600 px-2.5 py-1 text-white"
                                >
                                  {t(lang, 'rejectBtn')}
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                onSendAutomatedTemplate(bk, 'CHECKIN_INFO');
                                showToast(t(lang, 'msgEmailSent'));
                              }}
                              className="rounded border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100"
                            >
                              {t(lang, 'sendCheckInInfoBtn')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. GUESTS DIRECTORY */}
          {activeTab === 'guests' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display mb-4 text-xl font-semibold text-[#0A192F]">
                {t(lang, 'recGuests')}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-semibold">{t(lang, 'guestNameLabel')}</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">{t(lang, 'yourPhone')}</th>
                      <th className="pb-3 font-semibold">Xona</th>
                      <th className="pb-3 font-semibold">Holat</th>
                      <th className="pb-3 text-right font-semibold">Xabar yuborish</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50">
                        <td className="py-3 font-semibold text-[#0A192F]">{bk.guestName}</td>
                        <td className="py-3 text-slate-600">{bk.guestEmail}</td>
                        <td className="font-mono py-3 text-slate-600 tabular-nums">
                          {bk.guestPhone}
                        </td>
                        <td className="font-mono py-3 tabular-nums">
                          {bk.roomCategory} {bk.assignedUnitNumber ? `#${bk.assignedUnitNumber}` : ''}
                        </td>
                        <td className="font-mono py-3 font-semibold">{bk.status}</td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setCompName(bk.guestName);
                              setCompEmail(bk.guestEmail);
                              setCompSubj(`BEACH Resort — #${bk.id}`);
                              setComposeOpen(true);
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-[#0D9488] hover:bg-slate-50"
                          >
                            Email yozish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. RECEPTION ROOM MANAGEMENT (AVAILABLE, RESERVED, OCCUPIED, CLEANING, MAINTENANCE) */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold text-[#0A192F]">
                  {t(lang, 'recRooms')} — AVAILABLE · RESERVED · OCCUPIED · CLEANING · MAINTENANCE
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {physicalRooms.map((unit) => {
                  const statusColors: Record<PhysicalRoomStatus, string> = {
                    AVAILABLE: 'border-emerald-300 bg-emerald-50/70 text-emerald-900',
                    RESERVED: 'border-sky-300 bg-sky-50/70 text-sky-900',
                    OCCUPIED: 'border-indigo-300 bg-indigo-50/70 text-indigo-900',
                    CLEANING: 'border-amber-300 bg-amber-50/70 text-amber-900',
                    MAINTENANCE: 'border-red-300 bg-red-50/70 text-red-900',
                  };

                  return (
                    <div
                      key={unit.unitNumber}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-lg font-bold text-[#0A192F] tabular-nums">
                            Xona #{unit.unitNumber}
                          </span>
                          <span
                            className={`font-mono rounded-md border px-2.5 py-0.5 text-[11px] font-bold ${
                              statusColors[unit.status]
                            }`}
                          >
                            {unit.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {unit.category} · {unit.floor}-qavat
                        </p>

                        {unit.currentGuestName && (
                          <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs">
                            <p className="font-semibold text-[#0A192F]">
                              Mehmon: {unit.currentGuestName}
                            </p>
                            {unit.currentBookingId && (
                              <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                                Bron: {unit.currentBookingId}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                          {t(lang, 'changeStatusBtn')}:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {(
                            [
                              'AVAILABLE',
                              'RESERVED',
                              'OCCUPIED',
                              'CLEANING',
                              'MAINTENANCE',
                            ] as PhysicalRoomStatus[]
                          ).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                onChangePhysicalRoomStatus(unit.unitNumber, st);
                                showToast(`Xona #${unit.unitNumber} → ${st}`);
                              }}
                              className={`font-mono rounded px-2 py-1 text-[10px] font-semibold transition-colors ${
                                unit.status === st
                                  ? 'bg-[#0A192F] text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. SERVICES LIST FOR RECEPTION */}
          {activeTab === 'services' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display mb-4 text-xl font-semibold text-[#0A192F]">
                {t(lang, 'recServices')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-display text-lg font-semibold text-[#0A192F]">
                        {localize(lang, srv.name)}
                      </h3>
                      <span className="font-mono text-sm font-bold text-[#0D9488] tabular-nums">
                        ${srv.price}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{localize(lang, srv.duration)}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      {localize(lang, srv.description)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. RECEPTION EMAIL SYSTEM (INBOX WITH 5 CATEGORIES & ACTIONS) */}
          {activeTab === 'messages' && (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Column: Category Filter + Message List */}
              <div className="flex flex-col rounded-xl border border-slate-200 bg-white lg:col-span-5">
                <div className="flex flex-wrap gap-1 border-b border-slate-200 p-3">
                  {[
                    { id: 'ALL', label: 'Barchasi' },
                    { id: 'NEW_BOOKINGS', label: t(lang, 'emailCatNew') },
                    { id: 'CUSTOMER_QUESTIONS', label: t(lang, 'emailCatQuestions') },
                    { id: 'CONFIRMED', label: t(lang, 'emailCatConfirmed') },
                    { id: 'CANCELLED', label: t(lang, 'emailCatCancelled') },
                    { id: 'COMPLETED', label: t(lang, 'emailCatCompleted') },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEmailCategory(cat.id as 'ALL' | EmailCategory)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        emailCategory === cat.id
                          ? 'bg-[#0A192F] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-[540px] divide-y divide-slate-100 overflow-y-auto">
                  {filteredEmails.map((em) => {
                    const isSelected = activeEmail?.id === em.id;
                    return (
                      <div
                        key={em.id}
                        onClick={() => {
                          setSelectedEmailId(em.id);
                          onMarkEmailRead(em.id);
                        }}
                        className={`cursor-pointer p-4 transition-colors ${
                          isSelected
                            ? 'bg-[#0D9488]/10'
                            : !em.read
                            ? 'bg-sky-50/40 hover:bg-slate-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0A192F]">{em.senderName}</span>
                          <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                            {em.date}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{em.senderEmail}</p>
                        <p className="mt-1 text-xs font-semibold text-[#0A192F]">
                          {localize(lang, em.subject)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                          {localize(lang, em.message)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Email Reader + Booking Info + Quick Actions + Reply */}
              <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
                {activeEmail ? (
                  <div className="space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display text-2xl font-semibold text-[#0A192F]">
                            {localize(lang, activeEmail.subject)}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            From: <strong className="text-[#0A192F]">{activeEmail.senderName}</strong> (
                            {activeEmail.senderEmail}) ·{' '}
                            <span className="font-mono tabular-nums">{activeEmail.date}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onMarkEmailRead(activeEmail.id);
                            showToast(t(lang, 'msgDataSaved'));
                          }}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <MailOpen className="h-3.5 w-3.5" />
                          <span>{t(lang, 'markAsReadBtn')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="rounded-xl bg-[#F9F6F0] p-4 text-xs leading-relaxed whitespace-pre-line text-[#0A192F]">
                      {localize(lang, activeEmail.message)}
                    </div>

                    {/* Linked Booking Information Card & Action Buttons */}
                    {linkedBooking && (
                      <div className="rounded-xl border border-[#0D9488]/30 bg-[#0D9488]/5 p-4 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-[#0A192F] tabular-nums">
                              Bron #{linkedBooking.id}
                            </span>{' '}
                            · {linkedBooking.roomCategory} · {linkedBooking.checkIn} →{' '}
                            {linkedBooking.checkOut} ({linkedBooking.nights} {t(lang, 'nightUnit')})
                          </div>
                          <span className="font-mono font-bold text-[#0D9488] tabular-nums">
                            ${linkedBooking.totalPrice} · {linkedBooking.status}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onConfirmBooking(linkedBooking.id);
                              showToast(t(lang, 'msgBookingConfirmed'));
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            {t(lang, 'confirmBtn')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onRejectBooking(linkedBooking.id);
                              showToast(t(lang, 'msgBookingRejected'));
                            }}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            {t(lang, 'rejectBtn')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSendAutomatedTemplate(linkedBooking, 'CHECKIN_INFO');
                              showToast(t(lang, 'msgEmailSent'));
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#0A192F] hover:bg-slate-50"
                          >
                            {t(lang, 'sendCheckInInfoBtn')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onSendAutomatedTemplate(linkedBooking, 'CHECKOUT_INFO');
                              showToast(t(lang, 'msgEmailSent'));
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#0A192F] hover:bg-slate-50"
                          >
                            {t(lang, 'sendCheckOutInfoBtn')}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Previous Replies */}
                    {activeEmail.replies.length > 0 && (
                      <div className="space-y-2">
                        {activeEmail.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs"
                          >
                            <div className="flex justify-between font-semibold text-[#0D9488]">
                              <span>{rep.senderName}</span>
                              <span className="font-mono text-[11px] tabular-nums">{rep.date}</span>
                            </div>
                            <p className="mt-1 whitespace-pre-line text-slate-700">{rep.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Form */}
                    <form onSubmit={handleSendReply} className="space-y-3 border-t border-slate-100 pt-4">
                      <label className="block text-xs font-semibold text-slate-700">
                        {t(lang, 'replyBtn')} ({activeEmail.senderEmail}):
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Mehmonga javob xabarini yozing..."
                        className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-[#0D9488] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-2 rounded-xl bg-[#0A192F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{t(lang, 'replyBtn')}</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <p className="py-12 text-center text-xs text-slate-400">
                    Xabarni o‘qish uchun chap ro‘yxatdan tanlang.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 7. CHECK-IN PAGE (TODAY'S ARRIVALS -> ROOM STATUS = OCCUPIED) */}
          {activeTab === 'checkin' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4">
                <h2 className="font-display text-2xl font-semibold text-[#0A192F]">
                  {t(lang, 'recCheckIn')} — {t(lang, 'statTodayArrivals')}
                </h2>
                <p className="text-xs text-slate-500">
                  Check-in tugmasi bosilganda xona holati avtomatik ravishda{' '}
                  <strong className="font-mono text-[#0D9488]">OCCUPIED</strong> holatiga o‘tadi.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-semibold">{t(lang, 'guestNameLabel')}</th>
                      <th className="pb-3 font-semibold">{t(lang, 'bookingIdLabel')}</th>
                      <th className="pb-3 font-semibold">{t(lang, 'selectedRoomLabel')}</th>
                      <th className="pb-3 font-semibold">{t(lang, 'yourPhone')}</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">{t(lang, 'paymentStatusLabel')}</th>
                      <th className="pb-3 text-right font-semibold">Check-in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todaysArrivals.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50">
                        <td className="py-3.5 font-semibold text-[#0A192F]">{bk.guestName}</td>
                        <td className="font-mono py-3.5 font-semibold tabular-nums">{bk.id}</td>
                        <td className="font-mono py-3.5 tabular-nums">
                          {bk.roomCategory} #{bk.assignedUnitNumber || '201'}
                        </td>
                        <td className="font-mono py-3.5 tabular-nums">{bk.guestPhone}</td>
                        <td className="py-3.5 text-slate-600">{bk.guestEmail}</td>
                        <td className="font-mono py-3.5 font-semibold text-emerald-700">
                          {bk.paymentStatus}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              onCheckInGuest(bk.id, bk.assignedUnitNumber || '201');
                              showToast(
                                `${t(lang, 'notifGuestCheckIn')} (Xona #${
                                  bk.assignedUnitNumber || '201'
                                } = OCCUPIED)`
                              );
                            }}
                            className="rounded-lg bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
                          >
                            [Check-in]
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. CHECK-OUT PAGE (GUESTS LEAVING TODAY -> ROOM STATUS = CLEANING) */}
          {activeTab === 'checkout' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4">
                <h2 className="font-display text-2xl font-semibold text-[#0A192F]">
                  {t(lang, 'recCheckOut')} — {t(lang, 'statTodayDepartures')}
                </h2>
                <p className="text-xs text-slate-500">
                  Check-out tugmasi bosilganda xona holati avtomatik ravishda{' '}
                  <strong className="font-mono text-amber-700">CLEANING</strong> holatiga o‘tadi.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-semibold">{t(lang, 'guestNameLabel')}</th>
                      <th className="pb-3 font-semibold">{t(lang, 'selectedRoomLabel')}</th>
                      <th className="pb-3 font-semibold">{t(lang, 'checkOut')}</th>
                      <th className="pb-3 font-semibold">{t(lang, 'selectedServicesLabel')}</th>
                      <th className="pb-3 text-right font-semibold">{t(lang, 'totalPriceLabel')}</th>
                      <th className="pb-3 font-semibold">{t(lang, 'paymentStatusLabel')}</th>
                      <th className="pb-3 text-right font-semibold">Check-out</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todaysDepartures.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50">
                        <td className="py-3.5 font-semibold text-[#0A192F]">{bk.guestName}</td>
                        <td className="font-mono py-3.5 tabular-nums">
                          {bk.roomCategory} #{bk.assignedUnitNumber || '102'}
                        </td>
                        <td className="font-mono py-3.5 tabular-nums">{bk.checkOut}</td>
                        <td className="py-3.5 text-slate-600">
                          {bk.serviceIds
                            .map((sid) => {
                              const s = services.find((item) => item.id === sid);
                              return s ? localize(lang, s.name).split('—')[0].trim() : sid;
                            })
                            .join(' · ') || '—'}
                        </td>
                        <td className="font-mono py-3.5 text-right font-bold tabular-nums">
                          ${bk.totalPrice}
                        </td>
                        <td className="font-mono py-3.5 font-semibold text-emerald-700">
                          {bk.paymentStatus}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              onCheckOutGuest(bk.id, bk.assignedUnitNumber || '102');
                              showToast(
                                `${t(lang, 'notifGuestCheckOut')} (Xona #${
                                  bk.assignedUnitNumber || '102'
                                } = CLEANING)`
                              );
                            }}
                            className="rounded-lg bg-[#0A192F] px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            [Check-out]
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display mb-4 text-xl font-semibold text-[#0A192F]">
                {t(lang, 'recNotifications')}
              </h2>
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0A192F]">
                        {localize(lang, n.title)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {localize(lang, n.description)}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      {n.createdAt}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. PROFILE */}
          {activeTab === 'profile' && (
            <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-xl font-semibold text-[#0A192F]">
                {t(lang, 'recProfile')}
              </h2>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Ism:</span>
                  <span className="font-semibold">{user.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono">{user.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Lavozim (Role):</span>
                  <span className="font-mono font-semibold text-[#0D9488]">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Smena:</span>
                  <span>{user.shift || '08:00 – 20:00'}</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Compose Custom Email Modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                {t(lang, 'composeCustomBtn')}
              </h3>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSendCustomEmail(compEmail, compName, compSubj, compBody);
                setComposeOpen(false);
                setCompSubj('');
                setCompBody('');
                showToast(t(lang, 'msgEmailSent'));
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Mehmon ismi</label>
                  <input
                    type="text"
                    required
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    required
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Mavzu</label>
                <input
                  type="text"
                  required
                  value={compSubj}
                  onChange={(e) => setCompSubj(e.target.value)}
                  placeholder="BEACH Resort — Check-in ma’lumoti"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Xabar matni</label>
                <textarea
                  rows={4}
                  required
                  value={compBody}
                  onChange={(e) => setCompBody(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-600"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0D9488] px-5 py-2 font-semibold text-white"
                >
                  Yuborish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
