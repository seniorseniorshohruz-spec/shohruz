import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Waves,
  Mail,
  Bell,
  User,
  Settings,
  LogOut,
  ArrowLeft,
  Send,
  XCircle,
  CheckCircle2,
  Eye,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  AppNotification,
  BeachService,
  Booking,
  Language,
  ResortEmail,
  Room,
  UserAccount,
} from '../types/resort';
import { localize, t } from '../i18n/translations';
import { ResilientImage } from './ResilientImage';
import { INITIAL_ROOMS, INITIAL_SERVICES } from '../data/initialData';

interface CustomerDashboardProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  user: UserAccount;
  bookings: Booking[];
  rooms: Room[];
  services: BeachService[];
  emails: ResortEmail[];
  notifications: AppNotification[];
  onCancelBooking: (bookingId: string) => Promise<void>;
  onSendMessageToReception: (
    subject: string,
    message: string,
    bookingId?: string
  ) => Promise<void>;
  onUpdateProfile: (payload: {
    fullName: string;
    phone: string;
    newPassword?: string;
  }) => Promise<void>;
  onMarkMessageRead: (emailId: string) => Promise<void>;
  onOpenBookingModal: (roomId?: string, serviceId?: string) => void;
  onBackToSite: () => void;
  onLogout: () => void;
}

type CustomerTab =
  | 'dashboard'
  | 'bookings'
  | 'rooms'
  | 'services'
  | 'messages'
  | 'notifications'
  | 'profile'
  | 'settings';

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  lang,
  onChangeLang,
  user,
  bookings,
  rooms,
  services,
  emails,
  notifications,
  onCancelBooking,
  onSendMessageToReception,
  onUpdateProfile,
  onMarkMessageRead,
  onOpenBookingModal,
  onBackToSite,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<CustomerTab>('dashboard');
  const [selectedBookingView, setSelectedBookingView] = useState<Booking | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isBusy, setIsBusy] = useState<boolean>(false);

  // Message form
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgBookingId, setMsgBookingId] = useState('');

  // Profile form
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [newPassword, setNewPassword] = useState('');

  const effectiveRooms = rooms.length > 0 ? rooms : INITIAL_ROOMS;
  const effectiveServices = services.length > 0 ? services : INITIAL_SERVICES;

  const myBookings = bookings.filter(
    (b) =>
      b.customerId === user.id ||
      b.guestEmail.toLowerCase() === user.email.toLowerCase()
  );

  const upcomingList = myBookings.filter(
    (b) => b.status === 'PENDING' || b.status === 'CONFIRMED'
  );
  const currentList = myBookings.filter((b) => b.status === 'CHECKED_IN');
  const previousList = myBookings.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED' || b.status === 'REJECTED'
  );

  const myEmails = emails.filter(
    (e) =>
      e.senderEmail.toLowerCase() === user.email.toLowerCase() ||
      e.recipientEmail.toLowerCase() === user.email.toLowerCase()
  );

  const unreadEmailsCount = myEmails.filter((e) => !e.read).length;
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const showToast = (msg: string) => {
    setErrorMsg('');
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    if (!msgSubject.trim() || !msgBody.trim()) {
      setErrorMsg('Mavzu va xabar matnini kiriting.');
      return;
    }
    setIsBusy(true);
    try {
      await onSendMessageToReception(msgSubject.trim(), msgBody.trim(), msgBookingId || undefined);
      setMsgSubject('');
      setMsgBody('');
      showToast(t(lang, 'msgEmailSent'));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setIsBusy(true);
    try {
      await onUpdateProfile({
        fullName: fullName.trim() || user.fullName,
        phone: phone.trim() || user.phone,
        newPassword: newPassword.trim() ? newPassword.trim() : undefined,
      });
      setNewPassword('');
      showToast(t(lang, 'msgDataSaved'));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
    } finally {
      setIsBusy(false);
    }
  };

  const navItems: {
    id: CustomerTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: t(lang, 'custDash'), icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'bookings', label: t(lang, 'custMyBookings'), icon: <CalendarCheck className="h-4 w-4" /> },
    { id: 'rooms', label: t(lang, 'custMyRooms'), icon: <BedDouble className="h-4 w-4" /> },
    { id: 'services', label: t(lang, 'custMyServices'), icon: <Waves className="h-4 w-4" /> },
    {
      id: 'messages',
      label: t(lang, 'custMessages'),
      icon: <Mail className="h-4 w-4" />,
      badge: unreadEmailsCount,
    },
    {
      id: 'notifications',
      label: t(lang, 'custNotifications'),
      icon: <Bell className="h-4 w-4" />,
      badge: unreadNotifCount,
    },
    { id: 'profile', label: t(lang, 'custProfile'), icon: <User className="h-4 w-4" /> },
    { id: 'settings', label: t(lang, 'custSettings'), icon: <Settings className="h-4 w-4" /> },
  ];

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
            <span className="font-mono text-[11px] text-[#5EEAD4]">CUSTOMER</span>
          </div>

          <div className="mt-5 rounded-xl bg-white/5 p-3.5">
            <p className="text-sm font-semibold text-white">{user.fullName}</p>
            <p className="text-xs text-white/60">{user.email}</p>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => (
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
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t(lang, 'backToSite')}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            <span>{t(lang, 'logoutBtn')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
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
              {navItems.find((i) => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
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
            <button
              type="button"
              onClick={() => onOpenBookingModal()}
              className="flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#0F766E]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t(lang, 'bookRoomBtn')}</span>
            </button>
          </div>
        </header>

        {/* Mobile Tab Strip */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${
                activeTab === item.id
                  ? 'bg-[#0A192F] text-white'
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

        {errorMsg && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <main className="flex-1 p-6">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <span className="text-xs font-medium text-slate-500">
                    {t(lang, 'upcomingBookings')}
                  </span>
                  <p className="font-mono mt-2 text-3xl font-bold text-[#0A192F] tabular-nums">
                    {upcomingList.length}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <span className="text-xs font-medium text-slate-500">
                    {t(lang, 'currentBooking')}
                  </span>
                  <p className="font-mono mt-2 text-3xl font-bold text-[#0D9488] tabular-nums">
                    {currentList.length}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <span className="text-xs font-medium text-slate-500">
                    {t(lang, 'previousBookings')}
                  </span>
                  <p className="font-mono mt-2 text-3xl font-bold text-slate-700 tabular-nums">
                    {previousList.length}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-semibold text-[#0A192F]">
                    {t(lang, 'custMyBookings')}
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenBookingModal()}
                      className="flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0F766E]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t(lang, 'bookRoomBtn')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('messages')}
                      className="text-xs font-semibold text-[#0D9488] hover:underline"
                    >
                      {t(lang, 'contactReceptionBtn')} →
                    </button>
                  </div>
                </div>

                {myBookings.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-500">Sizda hozircha bronlar mavjud emas.</p>
                    <button
                      type="button"
                      onClick={() => onOpenBookingModal()}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{t(lang, 'bookRoomBtn')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-3 font-semibold">{t(lang, 'bookingIdLabel')}</th>
                          <th className="pb-3 font-semibold">{t(lang, 'selectedRoomLabel')}</th>
                          <th className="pb-3 font-semibold">
                            {t(lang, 'checkIn')} / {t(lang, 'checkOut')}
                          </th>
                          <th className="pb-3 font-semibold">{t(lang, 'selectedServicesLabel')}</th>
                          <th className="pb-3 text-right font-semibold">
                            {t(lang, 'totalPriceLabel')}
                          </th>
                          <th className="pb-3 font-semibold">{t(lang, 'paymentStatusLabel')}</th>
                          <th className="pb-3 font-semibold">{t(lang, 'bookingStatusLabel')}</th>
                          <th className="pb-3 text-right font-semibold">Amallar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {myBookings.map((bk) => {
                          const rm = rooms.find((r) => r.id === bk.roomId);
                          return (
                            <tr key={bk.id} className="hover:bg-slate-50/80">
                              <td className="font-mono py-3.5 font-semibold text-[#0A192F] tabular-nums">
                                {bk.id}
                              </td>
                              <td className="py-3.5 font-medium">
                                {rm ? localize(lang, rm.name) : bk.roomCategory}
                                {bk.assignedUnitNumber ? ` (#${bk.assignedUnitNumber})` : ''}
                              </td>
                              <td className="font-mono py-3.5 text-slate-600 tabular-nums">
                                {bk.checkIn} → {bk.checkOut} ({bk.nights} {t(lang, 'nightUnit')})
                              </td>
                              <td className="py-3.5 text-slate-600">
                                {bk.serviceIds.length > 0
                                  ? bk.serviceIds
                                      .map((sid) => {
                                        const s = services.find((item) => item.id === sid);
                                        return s ? localize(lang, s.name).split('—')[0].trim() : sid;
                                      })
                                      .join(' · ')
                                  : '—'}
                              </td>
                              <td className="font-mono py-3.5 text-right font-bold text-[#0A192F] tabular-nums">
                                ${bk.totalPrice}
                              </td>
                              <td className="font-mono py-3.5 text-slate-700">{bk.paymentStatus}</td>
                              <td className="font-mono py-3.5 font-semibold">
                                <span
                                  className={
                                    bk.status === 'CONFIRMED' || bk.status === 'CHECKED_IN'
                                      ? 'text-emerald-700'
                                      : bk.status === 'PENDING'
                                      ? 'text-amber-700'
                                      : 'text-red-600'
                                  }
                                >
                                  {bk.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBookingView(bk)}
                                    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                  >
                                    <Eye className="mr-1 inline h-3.5 w-3.5" />
                                    {t(lang, 'detailsBtn')}
                                  </button>
                                  {(bk.status === 'PENDING' || bk.status === 'CONFIRMED') && (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmCancelId(bk.id)}
                                      className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                                    >
                                      {t(lang, 'cancelBookingBtn')}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              {[
                { title: t(lang, 'upcomingBookings'), items: upcomingList },
                { title: t(lang, 'currentBooking'), items: currentList },
                { title: t(lang, 'previousBookings'), items: previousList },
              ].map((group) => (
                <div
                  key={group.title}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                    {group.title} ({group.items.length})
                  </h3>
                  {group.items.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-400">—</p>
                  ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {group.items.map((bk) => {
                        const rm = rooms.find((r) => r.id === bk.roomId);
                        return (
                          <div
                            key={bk.id}
                            className="flex flex-col justify-between rounded-xl border border-slate-200 p-4"
                          >
                            <div>
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-mono font-bold text-[#0A192F] tabular-nums">
                                  {bk.id}
                                </span>
                                <span className="font-mono font-semibold text-[#0D9488]">
                                  {bk.status} · {bk.paymentStatus}
                                </span>
                              </div>
                              <h4 className="font-display mt-1 text-lg font-semibold text-[#0A192F]">
                                {rm ? localize(lang, rm.name) : bk.roomCategory}{' '}
                                {bk.assignedUnitNumber ? `(#${bk.assignedUnitNumber})` : ''}
                              </h4>
                              <p className="font-mono mt-1 text-xs text-slate-600 tabular-nums">
                                {bk.checkIn} → {bk.checkOut} · {bk.nights} {t(lang, 'nightUnit')} ·{' '}
                                {bk.guests} {t(lang, 'guestsUnit')}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                              <span className="font-mono text-base font-bold text-[#0A192F] tabular-nums">
                                ${bk.totalPrice}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedBookingView(bk)}
                                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  {t(lang, 'detailsBtn')}
                                </button>
                                {(bk.status === 'PENDING' || bk.status === 'CONFIRMED') && (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmCancelId(bk.id)}
                                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                  >
                                    {t(lang, 'cancelBookingBtn')}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: MY ROOMS */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#0A192F]">
                    {t(lang, 'roomsTitle')} ({effectiveRooms.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Istalgan xona yoki VIP villani tanlab, darhol bron qilishingiz mumkin
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenBookingModal()}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t(lang, 'bookRoomBtn')}</span>
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {effectiveRooms.map((rm) => (
                  <div
                    key={rm.id}
                    className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div>
                      <div className="h-48 w-full overflow-hidden">
                        <ResilientImage
                          src={rm.image}
                          alt={localize(lang, rm.name)}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-baseline justify-between">
                          <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                            {localize(lang, rm.name)}
                          </h3>
                          <span className="font-mono font-bold text-[#0D9488] tabular-nums">
                            ${rm.pricePerNight}
                            {t(lang, 'perNight')}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {rm.category} · {rm.maxGuests} {t(lang, 'guestsUnit')} ·{' '}
                          {localize(lang, rm.bedType)} · {localize(lang, rm.seaView)}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                          {localize(lang, rm.description)}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => onOpenBookingModal(rm.id)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0D9488] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#0F766E]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{t(lang, 'bookRoomBtn')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MY SERVICES */}
          {activeTab === 'services' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {effectiveServices.map((srv) => (
                <div
                  key={srv.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div>
                    <div className="h-36 w-full overflow-hidden rounded-lg">
                      <ResilientImage
                        src={srv.image}
                        alt={localize(lang, srv.name)}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h3 className="font-display mt-3 text-lg font-semibold text-[#0A192F]">
                      {localize(lang, srv.name)}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">
                      {localize(lang, srv.description)}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="font-mono text-sm font-bold text-[#0D9488] tabular-nums">
                      ${srv.price} · {localize(lang, srv.duration)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenBookingModal(undefined, srv.id)}
                      className="rounded-lg bg-[#0D9488] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0F766E]"
                    >
                      {t(lang, 'bookNowBtn')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: MESSAGES WITH RECEPTION (Sender, Receiver, Date, Time, Message, Read/Unread) */}
          {activeTab === 'messages' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
                <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                  {t(lang, 'contactReceptionBtn')}
                </h3>
                <form noValidate onSubmit={handleSendMessage} className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      {t(lang, 'bookingIdLabel')} (ixtiyoriy)
                    </label>
                    <select
                      value={msgBookingId}
                      onChange={(e) => setMsgBookingId(e.target.value)}
                      className="font-mono w-full rounded-lg border border-slate-300 px-3 py-2 text-xs tabular-nums"
                    >
                      <option value="">— Umumiy savol —</option>
                      {myBookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.id} ({b.roomCategory})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      {t(lang, 'subjectLabel')} *
                    </label>
                    <input
                      type="text"
                      value={msgSubject}
                      onChange={(e) => setMsgSubject(e.target.value)}
                      placeholder="Check-in vaqti yoki qo‘shimcha xizmat bo‘yicha"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      {t(lang, 'messageLabel')} *
                    </label>
                    <textarea
                      rows={4}
                      value={msgBody}
                      onChange={(e) => setMsgBody(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D9488] py-2.5 text-xs font-semibold text-white hover:bg-[#0F766E] disabled:opacity-50"
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>{t(lang, 'sendMessageBtn')}</span>
                  </button>
                </form>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                    {t(lang, 'custMessages')} ({myEmails.length})
                  </h3>
                  {unreadEmailsCount > 0 && (
                    <span className="font-mono text-xs font-semibold text-[#0D9488] tabular-nums">
                      {unreadEmailsCount} yangi (unread)
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {myEmails.map((em) => {
                    const [datePart, timePart] = em.date.split(' ');
                    return (
                      <div
                        key={em.id}
                        onClick={() => !em.read && onMarkMessageRead(em.id)}
                        className={`cursor-pointer rounded-xl border p-4 text-xs transition-colors ${
                          em.read
                            ? 'border-slate-200 bg-slate-50/50'
                            : 'border-[#0D9488] bg-[#0D9488]/5'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-[#0A192F]">
                            {localize(lang, em.subject)}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                            {datePart} · {em.time || timePart || '10:00'} ·{' '}
                            <strong className={em.read ? 'text-slate-400' : 'text-[#0D9488]'}>
                              {em.read ? 'READ' : 'UNREAD'}
                            </strong>
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Sender: <strong>{em.senderName}</strong> ({em.senderEmail}) → Receiver:{' '}
                          <strong>{em.recipientEmail}</strong>
                        </p>
                        <p className="mt-2 whitespace-pre-line text-slate-700">
                          {localize(lang, em.message)}
                        </p>
                        {em.replies.length > 0 && (
                          <div className="mt-3 space-y-2 border-t border-slate-200 pt-2">
                            {em.replies.map((rep) => (
                              <div
                                key={rep.id}
                                className="rounded-lg bg-[#0D9488]/10 p-2.5 text-[#0A192F]"
                              >
                                <p className="font-semibold text-[#0F766E]">
                                  {rep.senderName} · {rep.date} {rep.time || ''}
                                </p>
                                <p className="mt-1">{rep.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                {t(lang, 'custNotifications')}
              </h3>
              <div className="mt-4 space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start justify-between rounded-xl border border-slate-200 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0A192F]">
                        {localize(lang, n.title)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
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

          {/* TAB 7 & 8: PROFILE & SETTINGS */}
          {(activeTab === 'profile' || activeTab === 'settings') && (
            <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                {t(lang, 'custProfile')} & {t(lang, 'custSettings')}
              </h3>
              <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {t(lang, 'yourName')}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {t(lang, 'yourPhone')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="font-mono w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Yangi parol (ixtiyoriy)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="O‘zgartirish uchun yangi parol kiriting"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded-xl bg-[#0A192F] px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{t(lang, 'saveProfileBtn')}</span>
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Cancel Booking Confirmation Dialog */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600">
              <XCircle className="h-6 w-6" />
              <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                {t(lang, 'cancelBookingBtn')}
              </h3>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Haqiqatan ham #{confirmCancelId} raqamli bronni bekor qilmoqchimisiz?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setConfirmCancelId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                {t(lang, 'prevStep')}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={async () => {
                  setIsBusy(true);
                  try {
                    await onCancelBooking(confirmCancelId);
                    setConfirmCancelId(null);
                    showToast(t(lang, 'msgBookingCancelled'));
                  } catch (err: any) {
                    setErrorMsg(err?.message || 'Bekor qilishda xatolik.');
                  } finally {
                    setIsBusy(false);
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{t(lang, 'cancelBookingBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details View Modal */}
      {selectedBookingView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                {t(lang, 'bookingSummary')} — {selectedBookingView.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBookingView(null)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{t(lang, 'guestNameLabel')}:</span>
                <span className="font-semibold">{selectedBookingView.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t(lang, 'selectedRoomLabel')}:</span>
                <span className="font-semibold">
                  {selectedBookingView.roomCategory}{' '}
                  {selectedBookingView.assignedUnitNumber
                    ? `(#${selectedBookingView.assignedUnitNumber})`
                    : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {t(lang, 'checkIn')} / {t(lang, 'checkOut')}:
                </span>
                <span className="font-mono font-semibold tabular-nums">
                  {selectedBookingView.checkIn} → {selectedBookingView.checkOut} (
                  {selectedBookingView.nights} {t(lang, 'nightUnit')})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t(lang, 'bookingStatusLabel')}:</span>
                <span className="font-mono font-semibold text-[#0D9488]">
                  {selectedBookingView.status}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold">
                <span>{t(lang, 'totalPriceLabel')}:</span>
                <span className="font-mono text-[#0D9488] tabular-nums">
                  ${selectedBookingView.totalPrice}
                </span>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBookingView(null)}
                className="rounded-lg bg-[#0A192F] px-4 py-2 text-xs font-semibold text-white"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
