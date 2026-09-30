import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  BedDouble,
  Waves,
  CalendarCheck,
  Users,
  Briefcase,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';
import {
  BeachService,
  Booking,
  BookingStatus,
  Language,
  PaymentStatus,
  PhysicalRoom,
  ResortSettings,
  Room,
  RoomCategory,
  UserAccount,
  UserRole,
} from '../types/resort';
import { localize, t } from '../i18n/translations';
import {
  IMG_ROOM_SUITE,
  IMG_ROOM_VILLA,
  IMG_SERVICE_TAPCHAN,
  INITIAL_ROOMS,
} from '../data/initialData';

interface AdminDashboardProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  adminUser: UserAccount;
  rooms: Room[];
  physicalRooms: PhysicalRoom[];
  services: BeachService[];
  bookings: Booking[];
  users: UserAccount[];
  settings: ResortSettings;
  onAddRoom: (room: Partial<Room> & { unitNumber?: string }) => Promise<void>;
  onUpdateRoom: (id: string, room: Partial<Room>) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  onAddService: (service: Partial<BeachService>) => Promise<void>;
  onUpdateService: (id: string, service: Partial<BeachService>) => Promise<void>;
  onDeleteService: (serviceId: string) => Promise<void>;
  onAddReceptionUser: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    shift?: string;
    role?: UserRole;
  }) => Promise<void>;
  onUpdateUser: (id: string, payload: Partial<UserAccount>) => Promise<void>;
  onUpdateBooking: (id: string, payload: Partial<Booking>) => Promise<void>;
  onUpdateSettings: (settings: Partial<ResortSettings>) => Promise<void>;
  onOpenBookingModal?: () => void;
  onBackToSite: () => void;
  onLogout: () => void;
}

type AdminTab =
  | 'dashboard'
  | 'rooms'
  | 'services'
  | 'bookings'
  | 'customers'
  | 'reception'
  | 'payments'
  | 'reports'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  lang,
  onChangeLang,
  adminUser,
  rooms,
  physicalRooms,
  services,
  bookings,
  users,
  settings,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onAddService,
  onUpdateService,
  onDeleteService,
  onAddReceptionUser,
  onUpdateUser,
  onUpdateBooking,
  onUpdateSettings,
  onOpenBookingModal,
  onBackToSite,
  onLogout,
}) => {
  const effectiveRooms = rooms.length > 0 ? rooms : INITIAL_ROOMS;
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<Booking | null>(null);

  // Room Form Modal
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [rmCategory, setRmCategory] = useState<RoomCategory>('Deluxe');
  const [rmNameUz, setRmNameUz] = useState('');
  const [rmNameRu, setRmNameRu] = useState('');
  const [rmNameEn, setRmNameEn] = useState('');
  const [rmDescUz, setRmDescUz] = useState('');
  const [rmPrice, setRmPrice] = useState(320);
  const [rmGuests, setRmGuests] = useState(3);
  const [rmSizeSqm, setRmSizeSqm] = useState(68);
  const [rmUnitNumber, setRmUnitNumber] = useState('');
  const [rmImage, setRmImage] = useState(IMG_ROOM_SUITE);

  // Service Form Modal
  const [srvModalOpen, setSrvModalOpen] = useState(false);
  const [editingSrv, setEditingSrv] = useState<BeachService | null>(null);
  const [srvNameUz, setSrvNameUz] = useState('');
  const [srvNameRu, setSrvNameRu] = useState('');
  const [srvNameEn, setSrvNameEn] = useState('');
  const [srvPrice, setSrvPrice] = useState(90);
  const [srvDurUz, setSrvDurUz] = useState('1 soat');

  // Reception User Modal
  const [recModalOpen, setRecModalOpen] = useState(false);
  const [recName, setRecName] = useState('');
  const [recEmail, setRecEmail] = useState('');
  const [recPhone, setRecPhone] = useState('+998 90 ');
  const [recPassword, setRecPassword] = useState('');
  const [recShift, setRecShift] = useState('08:00 – 20:00');

  // Customer Edit Modal
  const [editingCustomer, setEditingCustomer] = useState<UserAccount | null>(null);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');

  // Settings & Password State
  const [resortName, setResortName] = useState(settings.resortName);
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [checkInTime, setCheckInTime] = useState(settings.checkInTime);
  const [checkOutTime, setCheckOutTime] = useState(settings.checkOutTime);
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const showToast = (msg: string) => {
    setErrorMsg('');
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // ==================================================
  // 100% REAL DATABASE STATISTICS (ZERO FAKE NUMBERS)
  // ==================================================
  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === 'PENDING'),
    [bookings]
  );

  const confirmedBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.status === 'CONFIRMED' ||
          b.status === 'CHECKED_IN' ||
          b.status === 'COMPLETED'
      ),
    [bookings]
  );

  const cancelledBookings = useMemo(
    () =>
      bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'REJECTED'),
    [bookings]
  );

  const activeNonCancelledBookings = useMemo(
    () =>
      bookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'REJECTED'),
    [bookings]
  );

  // Real revenue: sum of non-cancelled real bookings
  const totalRevenue = useMemo(
    () =>
      activeNonCancelledBookings.reduce(
        (sum, b) => sum + (Number(b.totalPrice) || 0),
        0
      ),
    [activeNonCancelledBookings]
  );

  // Real service bookings count across all active bookings
  const totalServiceBookingsCount = useMemo(
    () =>
      activeNonCancelledBookings.reduce(
        (sum, b) => sum + (Array.isArray(b.serviceIds) ? b.serviceIds.length : 0),
        0
      ),
    [activeNonCancelledBookings]
  );

  // Real customers and reception staff from database
  const customerAccounts = useMemo(
    () => users.filter((u) => u.role === UserRole.CUSTOMER),
    [users]
  );
  const receptionAccounts = useMemo(
    () => users.filter((u) => u.role === UserRole.RECEPTION),
    [users]
  );

  // Real physical room availability from database
  const availablePhysicalCount = useMemo(
    () => physicalRooms.filter((r) => r.status === 'AVAILABLE').length,
    [physicalRooms]
  );
  const occupiedPhysicalCount = useMemo(
    () =>
      physicalRooms.filter(
        (r) => r.status === 'OCCUPIED' || r.status === 'RESERVED'
      ).length,
    [physicalRooms]
  );

  // Real revenue & booking count by room category
  const categoryStats = useMemo(() => {
    const categories: RoomCategory[] = ['Standard', 'Deluxe', 'Family', 'Luxury', 'VIP'];
    return categories.map((cat) => {
      const catBookings = activeNonCancelledBookings.filter((b) => b.roomCategory === cat);
      const revenue = catBookings.reduce((sum, b) => sum + b.totalPrice, 0);
      return {
        category: cat,
        count: catBookings.length,
        revenue,
      };
    });
  }, [activeNonCancelledBookings]);

  // Real service booking breakdown
  const serviceStats = useMemo(() => {
    return services.map((srv) => {
      const count = activeNonCancelledBookings.filter(
        (b) => Array.isArray(b.serviceIds) && b.serviceIds.includes(srv.id)
      ).length;
      const pct =
        totalServiceBookingsCount > 0
          ? Math.round((count / totalServiceBookingsCount) * 100)
          : 0;
      return {
        service: srv,
        count,
        revenue: count * srv.price,
        pct,
      };
    });
  }, [services, activeNonCancelledBookings, totalServiceBookingsCount]);

  const formatServiceNames = (serviceIds: string[]) => {
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return t(lang, 'noExtraServices');
    }
    return serviceIds
      .map((id) => {
        const found = services.find((s) => s.id === id);
        return found ? localize(lang, found.name).split('—')[0].trim() : id;
      })
      .join(', ');
  };

  const openAddRoom = () => {
    setErrorMsg('');
    setEditingRoom(null);
    setRmCategory('Luxury');
    setRmNameUz('');
    setRmNameRu('');
    setRmNameEn('');
    setRmDescUz('');
    setRmPrice(450);
    setRmGuests(4);
    setRmSizeSqm(75);
    setRmUnitNumber('');
    setRmImage(IMG_ROOM_SUITE);
    setRoomModalOpen(true);
  };

  const openEditRoom = (rm: Room) => {
    setErrorMsg('');
    setEditingRoom(rm);
    setRmCategory(rm.category);
    setRmNameUz(rm.name.uz);
    setRmNameRu(rm.name.ru);
    setRmNameEn(rm.name.en);
    setRmDescUz(rm.description.uz);
    setRmPrice(rm.pricePerNight);
    setRmGuests(rm.maxGuests);
    setRmSizeSqm(rm.sizeSqm || 68);
    setRmUnitNumber('');
    setRmImage(rm.image || IMG_ROOM_SUITE);
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setErrorMsg('');
    const finalNameUz = rmNameUz.trim();
    if (!finalNameUz) {
      setErrorMsg('Xona nomini kiriting.');
      return;
    }
    if (Number(rmPrice) <= 0 || isNaN(Number(rmPrice))) {
      setErrorMsg('Xona narxi 0 dan katta bo‘lishi kerak.');
      return;
    }
    setIsBusy(true);
    try {
      const descText =
        rmDescUz.trim() ||
        'Yangi dabdabali sohil xonasi, panoramali dengiz manzarasi va barcha qulayliklar bilan.';
      if (editingRoom) {
        await onUpdateRoom(editingRoom.id, {
          category: rmCategory,
          name: {
            uz: finalNameUz,
            ru: rmNameRu.trim() || finalNameUz,
            en: rmNameEn.trim() || finalNameUz,
          },
          description: {
            uz: descText,
            ru: editingRoom.description?.ru || descText,
            en: editingRoom.description?.en || descText,
          },
          pricePerNight: Number(rmPrice),
          maxGuests: Math.max(1, Number(rmGuests) || 2),
          sizeSqm: Math.max(20, Number(rmSizeSqm) || 68),
          image: rmImage || IMG_ROOM_SUITE,
        });
      } else {
        await onAddRoom({
          category: rmCategory,
          name: {
            uz: finalNameUz,
            ru: rmNameRu.trim() || finalNameUz,
            en: rmNameEn.trim() || finalNameUz,
          },
          description: {
            uz: descText,
            ru: descText,
            en: descText,
          },
          pricePerNight: Number(rmPrice),
          rating: 5.0,
          maxGuests: Math.max(1, Number(rmGuests) || 2),
          bedType: { uz: '1 ta King-size karavot', ru: '1 King-size', en: '1 King Bed' },
          sizeSqm: Math.max(20, Number(rmSizeSqm) || 75),
          hasWifi: true,
          hasAc: true,
          bathroomCount: 1,
          seaView: {
            uz: 'To‘liq dengiz manzarasi',
            ru: 'Прямой вид на море',
            en: 'Direct Sea View',
          },
          available: true,
          image: rmImage || IMG_ROOM_SUITE,
          unitNumber: rmUnitNumber.trim() || undefined,
        });
      }
      setRoomModalOpen(false);
      showToast(t(lang, 'msgDataSaved'));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Xatolik yuz berdi.');
    } finally {
      setIsBusy(false);
    }
  };

  const openAddService = () => {
    setEditingSrv(null);
    setSrvNameUz('');
    setSrvNameRu('');
    setSrvNameEn('');
    setSrvPrice(90);
    setSrvDurUz('1 soat');
    setSrvModalOpen(true);
  };

  const openEditService = (srv: BeachService) => {
    setEditingSrv(srv);
    setSrvNameUz(srv.name.uz);
    setSrvNameRu(srv.name.ru);
    setSrvNameEn(srv.name.en);
    setSrvPrice(srv.price);
    setSrvDurUz(srv.duration.uz);
    setSrvModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    if (!srvNameUz.trim()) {
      setErrorMsg('Xizmat nomini kiriting.');
      return;
    }
    if (srvPrice <= 0) {
      setErrorMsg('Xizmat narxi musbat bo‘lishi kerak.');
      return;
    }
    setIsBusy(true);
    try {
      if (editingSrv) {
        await onUpdateService(editingSrv.id, {
          name: {
            uz: srvNameUz.trim(),
            ru: srvNameRu.trim() || srvNameUz.trim(),
            en: srvNameEn.trim() || srvNameUz.trim(),
          },
          price: Number(srvPrice),
          duration: { uz: srvDurUz, ru: srvDurUz, en: srvDurUz },
        });
      } else {
        await onAddService({
          code: 'CUSTOM_SRV',
          name: {
            uz: srvNameUz.trim(),
            ru: srvNameRu.trim() || srvNameUz.trim(),
            en: srvNameEn.trim() || srvNameUz.trim(),
          },
          description: {
            uz: 'Maxsus plyaj va dengiz ko‘ngilochar xizmati.',
            ru: 'Эксклюзивная пляжная и морская услуга курорта.',
            en: 'Bespoke coastal and marine leisure service.',
          },
          price: Number(srvPrice),
          duration: { uz: srvDurUz, ru: srvDurUz, en: srvDurUz },
          available: true,
          image: IMG_SERVICE_TAPCHAN,
          categoryTag: { uz: 'Maxsus xizmat', ru: 'Премиум сервис', en: 'Bespoke Service' },
        });
      }
      setSrvModalOpen(false);
      showToast(t(lang, 'msgDataSaved'));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Xatolik yuz berdi.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCreateReception = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    if (!recName.trim() || !recEmail.includes('@') || recPassword.trim().length < 4) {
      setErrorMsg('Ism, to‘g‘ri email va kamida 4 belgili parol kiriting.');
      return;
    }
    setIsBusy(true);
    try {
      await onAddReceptionUser({
        fullName: recName.trim(),
        email: recEmail.trim(),
        phone: recPhone.trim(),
        password: recPassword.trim(),
        shift: recShift,
        role: UserRole.RECEPTION,
      });
      setRecModalOpen(false);
      setRecName('');
      setRecEmail('');
      setRecPassword('');
      showToast(t(lang, 'msgDataSaved'));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Xatolik yuz berdi.');
    } finally {
      setIsBusy(false);
    }
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: t(lang, 'admDash'), icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'rooms', label: t(lang, 'admRooms'), icon: <BedDouble className="h-4 w-4" /> },
    { id: 'services', label: t(lang, 'admServices'), icon: <Waves className="h-4 w-4" /> },
    {
      id: 'bookings',
      label: t(lang, 'admBookings'),
      icon: <CalendarCheck className="h-4 w-4" />,
      badge: bookings.length,
    },
    {
      id: 'customers',
      label: t(lang, 'admCustomers'),
      icon: <Users className="h-4 w-4" />,
      badge: customerAccounts.length,
    },
    { id: 'reception', label: t(lang, 'admReception'), icon: <Briefcase className="h-4 w-4" /> },
    { id: 'payments', label: t(lang, 'admPayments'), icon: <CreditCard className="h-4 w-4" /> },
    { id: 'reports', label: t(lang, 'admReports'), icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'settings', label: t(lang, 'admSettings'), icon: <Settings className="h-4 w-4" /> },
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
            <span className="font-mono text-[11px] font-bold text-emerald-400">ADMIN</span>
          </div>

          <div className="mt-4 rounded-xl bg-white/5 p-3">
            <p className="text-xs font-semibold text-white">{adminUser.fullName}</p>
            <p className="text-[11px] text-white/60">Executive Administrator</p>
          </div>

          <nav className="mt-5 space-y-1">
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
            <LogOut className="h-4 w-4" />
            <span>{t(lang, 'logoutBtn')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
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
              Admin · {navItems.find((i) => i.id === activeTab)?.label}
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
            <button
              type="button"
              onClick={openAddRoom}
              className="flex items-center gap-1.5 rounded-lg border border-[#0D9488] bg-[#0D9488]/10 px-3.5 py-2 text-xs font-semibold text-[#0F766E] hover:bg-[#0D9488] hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t(lang, 'addRoomBtn')}</span>
            </button>
            {onOpenBookingModal && (
              <button
                type="button"
                onClick={onOpenBookingModal}
                className="flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t(lang, 'bookRoomBtn')}</span>
              </button>
            )}
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

        {/* Security Banner if password change recommended */}
        {adminUser.requirePasswordChange && (
          <div className="mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">{t(lang, 'securityBannerTitle')}</p>
                <p className="text-amber-800">{t(lang, 'securityBannerDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="rounded-lg bg-amber-700 px-3 py-1.5 font-semibold text-white hover:bg-amber-800"
            >
              {t(lang, 'admSettings')} →
            </button>
          </div>
        )}

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
          {/* ==================================================
              TAB 1 & TAB 8: REAL ADMIN DASHBOARD & REPORTS
             ================================================== */}
          {(activeTab === 'dashboard' || activeTab === 'reports') && (
            <div className="space-y-6">
              {/* 9 Real Database KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-xs font-medium text-slate-500">
                    {t(lang, 'totalRevenue')}
                  </span>
                  <p className="font-mono mt-1.5 text-2xl font-bold text-[#0D9488] tabular-nums">
                    ${totalRevenue.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-xs font-medium text-slate-500">
                    Jami bronlar (Total)
                  </span>
                  <p className="font-mono mt-1.5 text-2xl font-bold text-[#0A192F] tabular-nums">
                    {bookings.length}
                  </p>
                  <p className="font-mono mt-1 text-[11px] text-slate-500 tabular-nums">
                    Kutilmoqda: {pendingBookings.length} · Tasdiqlangan: {confirmedBookings.length} · Bekor: {cancelledBookings.length}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-xs font-medium text-slate-500">
                    Real Mijozlar (Customers)
                  </span>
                  <p className="font-mono mt-1.5 text-2xl font-bold text-[#0A192F] tabular-nums">
                    {customerAccounts.length}
                  </p>
                  <p className="font-mono mt-1 text-[11px] text-slate-500 tabular-nums">
                    Resepshn xodimlari: {receptionAccounts.length}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-xs font-medium text-slate-500">
                    Xonalar (Bo‘sh / Band)
                  </span>
                  <p className="font-mono mt-1.5 text-2xl font-bold text-sky-700 tabular-nums">
                    {availablePhysicalCount} / {occupiedPhysicalCount}
                  </p>
                  <p className="font-mono mt-1 text-[11px] text-slate-500 tabular-nums">
                    Jami xona fondlari: {physicalRooms.length}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-xs font-medium text-slate-500">
                    Bron qilingan xizmatlar
                  </span>
                  <p className="font-mono mt-1.5 text-2xl font-bold text-[#0D9488] tabular-nums">
                    {totalServiceBookingsCount}
                  </p>
                  <p className="font-mono mt-1 text-[11px] text-slate-500 tabular-nums">
                    Mavjud xizmat turlari: {services.length}
                  </p>
                </div>
              </div>

              {/* Real Bookings Feed on Dashboard */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#0A192F]">
                      Haqiqiy Mijoz Bronlari ({bookings.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Mijozlar tomonidan yaratilgan barcha haqiqiy bronlar ro‘yxati
                    </p>
                  </div>
                  {bookings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('bookings')}
                      className="text-xs font-semibold text-[#0D9488] hover:underline"
                    >
                      Barcha bronlarni boshqarish →
                    </button>
                  )}
                </div>

                {bookings.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center">
                    <p className="text-sm font-medium text-slate-600">
                      {t(lang, 'noBookingsYet')}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="pb-3 font-semibold">Bron ID</th>
                          <th className="pb-3 font-semibold">Mijoz (Ism / Email / Tel)</th>
                          <th className="pb-3 font-semibold">Xona</th>
                          <th className="pb-3 font-semibold">Check-in → Check-out</th>
                          <th className="pb-3 font-semibold">Mehmon</th>
                          <th className="pb-3 font-semibold">Xizmatlar</th>
                          <th className="pb-3 text-right font-semibold">Jami narx</th>
                          <th className="pb-3 font-semibold">Bron sanasi</th>
                          <th className="pb-3 font-semibold">To‘lov</th>
                          <th className="pb-3 font-semibold">Holat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bookings.slice(0, 10).map((bk) => (
                          <tr key={bk.id} className="hover:bg-slate-50">
                            <td className="font-mono py-3 font-semibold text-[#0A192F] tabular-nums">
                              {bk.id}
                            </td>
                            <td className="py-3">
                              <div className="font-semibold text-[#0A192F]">{bk.guestName}</div>
                              <div className="font-mono text-[11px] text-slate-500">
                                {bk.guestEmail} · {bk.guestPhone}
                              </div>
                            </td>
                            <td className="py-3 font-medium">
                              {bk.roomCategory}{' '}
                              {bk.assignedUnitNumber ? `#${bk.assignedUnitNumber}` : ''}
                            </td>
                            <td className="font-mono py-3 tabular-nums">
                              {bk.checkIn} → {bk.checkOut} ({bk.nights} tun)
                            </td>
                            <td className="font-mono py-3 tabular-nums">
                              {bk.guests} {t(lang, 'guestsUnit')}
                            </td>
                            <td className="max-w-[180px] truncate py-3 text-slate-600">
                              {formatServiceNames(bk.serviceIds)}
                            </td>
                            <td className="font-mono py-3 text-right font-bold text-[#0D9488] tabular-nums">
                              ${bk.totalPrice}
                            </td>
                            <td className="font-mono py-3 text-[11px] text-slate-500 tabular-nums">
                              {bk.createdAt}
                            </td>
                            <td className="font-mono py-3 font-semibold">{bk.paymentStatus}</td>
                            <td className="font-mono py-3 font-semibold text-[#0D9488]">
                              {bk.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Real Database Analytics Breakdown */}
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                        Xona Toifalari Bo‘yicha Haqiqiy Tushum va Bronlar
                      </h3>
                      <p className="text-xs text-slate-500">
                        Ma’lumotlar bazasidagi haqiqiy bronlar asosida hisoblangan ($)
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#0D9488] tabular-nums">
                      Jami: ${totalRevenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {categoryStats.map((item) => {
                      const pct =
                        totalRevenue > 0
                          ? Math.round((item.revenue / totalRevenue) * 100)
                          : 0;
                      return (
                        <div key={item.category} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-[#0A192F]">
                              {item.category} ({item.count} ta bron)
                            </span>
                            <span className="font-mono font-semibold text-[#0D9488] tabular-nums">
                              ${item.revenue.toLocaleString()} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#0D9488] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
                  <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                    {t(lang, 'popularServices')}
                  </h3>
                  <div className="mt-4 space-y-3.5">
                    {serviceStats.map(({ service: srv, count, revenue, pct }) => (
                      <div key={srv.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-[#0A192F]">
                            {localize(lang, srv.name).split('—')[0].trim()}
                          </span>
                          <span className="font-mono font-semibold text-[#0D9488] tabular-nums">
                            {count} bron · ${revenue} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#0D9488] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROOMS CRUD (CREATE, READ, UPDATE, DELETE) */}
          {activeTab === 'rooms' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-[#0A192F]">
                  {t(lang, 'admRooms')} ({effectiveRooms.length})
                </h2>
                <button
                  type="button"
                  onClick={openAddRoom}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t(lang, 'addRoomBtn')}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-semibold">Xona nomi</th>
                      <th className="pb-3 font-semibold">Toifa</th>
                      <th className="pb-3 text-right font-semibold">Narx / tun</th>
                      <th className="pb-3 text-right font-semibold">Sig‘im</th>
                      <th className="pb-3 font-semibold">Mavjudlik</th>
                      <th className="pb-3 text-right font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {effectiveRooms.map((rm) => (
                      <tr key={rm.id} className="hover:bg-slate-50">
                        <td className="py-3.5 font-semibold text-[#0A192F]">
                          {localize(lang, rm.name)}
                        </td>
                        <td className="py-3.5">{rm.category}</td>
                        <td className="font-mono py-3.5 text-right font-bold text-[#0D9488] tabular-nums">
                          ${rm.pricePerNight}
                        </td>
                        <td className="font-mono py-3.5 text-right tabular-nums">
                          {rm.maxGuests} {t(lang, 'guestsUnit')}
                        </td>
                        <td className="py-3.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={async () => {
                              setIsBusy(true);
                              try {
                                await onUpdateRoom(rm.id, { available: !rm.available });
                                showToast(t(lang, 'msgDataSaved'));
                              } finally {
                                setIsBusy(false);
                              }
                            }}
                            className={`font-mono rounded px-2.5 py-1 text-[11px] font-semibold ${
                              rm.available
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {rm.available ? t(lang, 'availableLabel') : t(lang, 'unavailableLabel')}
                          </button>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditRoom(rm)}
                              className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setIsBusy(true);
                                try {
                                  await onDeleteRoom(rm.id);
                                  showToast(t(lang, 'msgDataSaved'));
                                } finally {
                                  setIsBusy(false);
                                }
                              }}
                              className="rounded border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

          {/* TAB 3: SERVICES CRUD (CREATE, READ, UPDATE, DELETE) */}
          {activeTab === 'services' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-[#0A192F]">
                  {t(lang, 'admServices')} ({services.length})
                </h2>
                <button
                  type="button"
                  onClick={openAddService}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t(lang, 'addServiceBtn')}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-semibold">Xizmat nomi</th>
                      <th className="pb-3 font-semibold">Davomiyligi</th>
                      <th className="pb-3 text-right font-semibold">Narx</th>
                      <th className="pb-3 text-right font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {services.map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-50">
                        <td className="py-3.5 font-semibold text-[#0A192F]">
                          {localize(lang, srv.name)}
                        </td>
                        <td className="py-3.5 text-slate-600">{localize(lang, srv.duration)}</td>
                        <td className="font-mono py-3.5 text-right font-bold text-[#0D9488] tabular-nums">
                          ${srv.price}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditService(srv)}
                              className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={async () => {
                                setIsBusy(true);
                                try {
                                  await onDeleteService(srv.id);
                                  showToast(t(lang, 'msgDataSaved'));
                                } finally {
                                  setIsBusy(false);
                                }
                              }}
                              className="rounded border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

          {/* TAB 4: ALL REAL CUSTOMER BOOKINGS (COMPLETE DETAILS, STATUS, PAYMENT, CANCEL) */}
          {activeTab === 'bookings' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display mb-4 text-2xl font-semibold text-[#0A192F]">
                {t(lang, 'admBookings')} ({bookings.length})
              </h2>

              {bookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    {t(lang, 'noBookingsYet')}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 font-semibold">Bron ID</th>
                        <th className="pb-3 font-semibold">Mijoz (Ism / Email / Tel)</th>
                        <th className="pb-3 font-semibold">Xona</th>
                        <th className="pb-3 font-semibold">Check-in → Check-out</th>
                        <th className="pb-3 font-semibold">Mehmonlar</th>
                        <th className="pb-3 font-semibold">Xizmatlar</th>
                        <th className="pb-3 text-right font-semibold">Jami narx</th>
                        <th className="pb-3 font-semibold">Bron sanasi</th>
                        <th className="pb-3 font-semibold">To‘lov</th>
                        <th className="pb-3 font-semibold">Holat (Status)</th>
                        <th className="pb-3 text-right font-semibold">Boshqaruv</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.map((bk) => (
                        <tr key={bk.id} className="hover:bg-slate-50">
                          <td className="font-mono py-3 font-semibold tabular-nums">{bk.id}</td>
                          <td className="py-3">
                            <div className="font-semibold text-[#0A192F]">{bk.guestName}</div>
                            <div className="font-mono text-[11px] text-slate-500">
                              {bk.guestEmail}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 tabular-nums">
                              {bk.guestPhone}
                            </div>
                          </td>
                          <td className="py-3 font-medium">
                            {bk.roomCategory}{' '}
                            {bk.assignedUnitNumber ? `#${bk.assignedUnitNumber}` : ''}
                          </td>
                          <td className="font-mono py-3 tabular-nums">
                            {bk.checkIn} → {bk.checkOut} ({bk.nights} tun)
                          </td>
                          <td className="font-mono py-3 tabular-nums">
                            {bk.guests} {t(lang, 'guestsUnit')}
                          </td>
                          <td className="max-w-[180px] py-3 text-slate-600">
                            {formatServiceNames(bk.serviceIds)}
                          </td>
                          <td className="font-mono py-3 text-right font-bold text-[#0D9488] tabular-nums">
                            ${bk.totalPrice}
                          </td>
                          <td className="font-mono py-3 text-[11px] text-slate-500 tabular-nums">
                            {bk.createdAt}
                          </td>
                          <td className="py-3">
                            <select
                              value={bk.paymentStatus}
                              disabled={isBusy}
                              onChange={async (e) => {
                                setIsBusy(true);
                                try {
                                  await onUpdateBooking(bk.id, {
                                    paymentStatus: e.target.value as PaymentStatus,
                                  });
                                  showToast(t(lang, 'msgDataSaved'));
                                } finally {
                                  setIsBusy(false);
                                }
                              }}
                              className="font-mono rounded border border-slate-200 px-2 py-1 text-xs font-semibold"
                            >
                              {(['PENDING', 'PAID', 'REFUNDED'] as PaymentStatus[]).map((ps) => (
                                <option key={ps} value={ps}>
                                  {ps}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3">
                            <select
                              value={bk.status}
                              disabled={isBusy}
                              onChange={async (e) => {
                                setIsBusy(true);
                                try {
                                  await onUpdateBooking(bk.id, {
                                    status: e.target.value as BookingStatus,
                                  });
                                  showToast(t(lang, 'msgDataSaved'));
                                } finally {
                                  setIsBusy(false);
                                }
                              }}
                              className="font-mono rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-[#0D9488]"
                            >
                              {(
                                [
                                  'PENDING',
                                  'CONFIRMED',
                                  'CHECKED_IN',
                                  'COMPLETED',
                                  'CANCELLED',
                                  'REJECTED',
                                ] as BookingStatus[]
                              ).map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedBookingDetail(bk)}
                                className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              {bk.status !== 'CANCELLED' && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={async () => {
                                    setIsBusy(true);
                                    try {
                                      await onUpdateBooking(bk.id, { status: 'CANCELLED' });
                                      showToast(t(lang, 'msgBookingCancelled'));
                                    } finally {
                                      setIsBusy(false);
                                    }
                                  }}
                                  className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                                >
                                  {t(lang, 'cancelBookingBtn')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REAL CUSTOMERS (READ, UPDATE) */}
          {activeTab === 'customers' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display mb-4 text-2xl font-semibold text-[#0A192F]">
                {t(lang, 'admCustomers')} ({customerAccounts.length})
              </h2>

              {customerAccounts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center text-xs text-slate-500">
                  Hozircha ro‘yxatdan o‘tgan mijozlar yo‘q.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 font-semibold">Ism</th>
                        <th className="pb-3 font-semibold">Email</th>
                        <th className="pb-3 font-semibold">Telefon</th>
                        <th className="pb-3 font-semibold">Bronlar soni</th>
                        <th className="pb-3 font-semibold">Ro‘yxatdan o‘tgan</th>
                        <th className="pb-3 text-right font-semibold">Tahrirlash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerAccounts.map((c) => {
                        const cBookingsCount = bookings.filter(
                          (b) =>
                            b.customerId === c.id ||
                            b.guestEmail.toLowerCase() === c.email.toLowerCase()
                        ).length;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="py-3 font-semibold">{c.fullName}</td>
                            <td className="py-3 text-slate-600">{c.email}</td>
                            <td className="font-mono py-3 tabular-nums">{c.phone}</td>
                            <td className="font-mono py-3 font-semibold text-[#0D9488] tabular-nums">
                              {cBookingsCount}
                            </td>
                            <td className="font-mono py-3 text-slate-500 tabular-nums">
                              {c.createdAt}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCustomer(c);
                                  setCustName(c.fullName);
                                  setCustPhone(c.phone);
                                }}
                                className="rounded border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                <Edit3 className="mr-1 inline h-3 w-3" />
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: RECEPTION ACCOUNTS MANAGEMENT (CREATE, READ, UPDATE, DISABLE) */}
          {activeTab === 'reception' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-[#0A192F]">
                  {t(lang, 'admReception')} ({receptionAccounts.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setRecModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F766E]"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t(lang, 'addReceptionBtn')}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-semibold">Xodim</th>
                      <th className="pb-3 font-semibold">Email</th>
                      <th className="pb-3 font-semibold">Telefon</th>
                      <th className="pb-3 font-semibold">Smena</th>
                      <th className="pb-3 font-semibold">Holat</th>
                      <th className="pb-3 text-right font-semibold">Boshqaruv</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receptionAccounts.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="py-3.5 font-semibold text-[#0A192F]">{rec.fullName}</td>
                        <td className="font-mono py-3.5">{rec.email}</td>
                        <td className="font-mono py-3.5 tabular-nums">{rec.phone}</td>
                        <td className="py-3.5 text-slate-600">{rec.shift || '08:00 – 20:00'}</td>
                        <td className="font-mono py-3.5 font-semibold">
                          <span className={rec.active ? 'text-emerald-700' : 'text-red-600'}>
                            {rec.active ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={async () => {
                              setIsBusy(true);
                              try {
                                await onUpdateUser(rec.id, { active: !rec.active });
                                showToast(t(lang, 'msgDataSaved'));
                              } finally {
                                setIsBusy(false);
                              }
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            {rec.active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: PAYMENTS LEDGER */}
          {activeTab === 'payments' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display mb-4 text-2xl font-semibold text-[#0A192F]">
                {t(lang, 'admPayments')} — Jami: ${totalRevenue.toLocaleString()}
              </h2>

              {bookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center text-xs text-slate-500">
                  {t(lang, 'noBookingsYet')}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 font-semibold">Bron ID</th>
                        <th className="pb-3 font-semibold">Mehmon</th>
                        <th className="pb-3 font-semibold">Sana</th>
                        <th className="pb-3 text-right font-semibold">Xona summasi</th>
                        <th className="pb-3 text-right font-semibold">Xizmatlar summasi</th>
                        <th className="pb-3 text-right font-semibold">Jami to‘lov</th>
                        <th className="pb-3 font-semibold">Holat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.map((bk) => (
                        <tr key={bk.id}>
                          <td className="font-mono py-3 font-semibold tabular-nums">{bk.id}</td>
                          <td className="py-3">
                            <span className="font-semibold">{bk.guestName}</span>{' '}
                            <span className="text-slate-400">({bk.guestEmail})</span>
                          </td>
                          <td className="font-mono py-3 text-slate-500 tabular-nums">
                            {bk.createdAt}
                          </td>
                          <td className="font-mono py-3 text-right tabular-nums">
                            ${bk.roomTotal}
                          </td>
                          <td className="font-mono py-3 text-right tabular-nums">
                            ${bk.servicesTotal}
                          </td>
                          <td className="font-mono py-3 text-right font-bold text-[#0D9488] tabular-nums">
                            ${bk.totalPrice}
                          </td>
                          <td className="font-mono py-3 font-semibold">{bk.paymentStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: SETTINGS & PASSWORD UPDATE */}
          {activeTab === 'settings' && (
            <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-2xl font-semibold text-[#0A192F]">
                {t(lang, 'admSettings')}
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (isBusy) return;
                  setIsBusy(true);
                  try {
                    await onUpdateSettings({
                      resortName,
                      supportEmail,
                      supportPhone,
                      checkInTime,
                      checkOutTime,
                    });
                    if (newAdminPassword.trim().length >= 4) {
                      await onUpdateUser(adminUser.id, {
                        password: newAdminPassword.trim(),
                        requirePasswordChange: false,
                      });
                      setNewAdminPassword('');
                    }
                    showToast(t(lang, 'msgDataSaved'));
                  } finally {
                    setIsBusy(false);
                  }
                }}
                className="mt-5 space-y-4 text-xs"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">Kurort nomi</label>
                    <input
                      type="text"
                      value={resortName}
                      onChange={(e) => setResortName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">
                      Konsyerj Email
                    </label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">Telefon</label>
                    <input
                      type="text"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="font-mono w-full rounded-lg border border-slate-300 px-3.5 py-2 tabular-nums"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Check-in</label>
                      <input
                        type="text"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        className="font-mono w-full rounded-lg border border-slate-300 px-3 py-2 tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">Check-out</label>
                      <input
                        type="text"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        className="font-mono w-full rounded-lg border border-slate-300 px-3 py-2 tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <label className="mb-1 block font-semibold text-[#0A192F]">
                    Administrator parolini yangilash
                  </label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    placeholder="Yangi xavfsiz parol kiriting"
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded-xl bg-[#0A192F] px-6 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Saqlash</span>
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Booking Full Details Modal */}
      {selectedBookingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                Bron #{selectedBookingDetail.id} Tafsilotlari
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBookingDetail(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Mijoz ismi:</span>
                <p className="font-semibold text-[#0A192F]">{selectedBookingDetail.guestName}</p>
              </div>
              <div>
                <span className="text-slate-400">Mijoz Email:</span>
                <p className="font-mono text-[#0A192F]">{selectedBookingDetail.guestEmail}</p>
              </div>
              <div>
                <span className="text-slate-400">Telefon:</span>
                <p className="font-mono text-[#0A192F] tabular-nums">
                  {selectedBookingDetail.guestPhone}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Bron sanasi:</span>
                <p className="font-mono text-[#0A192F] tabular-nums">
                  {selectedBookingDetail.createdAt}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Xona:</span>
                <p className="font-semibold text-[#0A192F]">
                  {selectedBookingDetail.roomCategory} #{selectedBookingDetail.assignedUnitNumber}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Mehmonlar soni:</span>
                <p className="font-mono font-semibold text-[#0A192F] tabular-nums">
                  {selectedBookingDetail.guests} nafar
                </p>
              </div>
              <div>
                <span className="text-slate-400">Check-in:</span>
                <p className="font-mono font-semibold text-[#0A192F] tabular-nums">
                  {selectedBookingDetail.checkIn}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Check-out:</span>
                <p className="font-mono font-semibold text-[#0A192F] tabular-nums">
                  {selectedBookingDetail.checkOut} ({selectedBookingDetail.nights} tun)
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Tanlangan xizmatlar:</span>
                <p className="font-medium text-[#0A192F]">
                  {formatServiceNames(selectedBookingDetail.serviceIds)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Bron va To‘lov holati:</span>
                <p className="font-mono font-semibold text-[#0D9488]">
                  {selectedBookingDetail.status} · {selectedBookingDetail.paymentStatus}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Jami hisoblangan narx:</span>
                <p className="font-mono text-base font-bold text-[#0D9488] tabular-nums">
                  ${selectedBookingDetail.totalPrice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Room Modal */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                {editingRoom ? 'Xonani tahrirlash' : t(lang, 'addRoomBtn')}
              </h3>
              <button
                type="button"
                onClick={() => setRoomModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form noValidate onSubmit={handleSaveRoom} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block font-semibold">Toifa (Category)</label>
                  <select
                    value={rmCategory}
                    onChange={(e) => setRmCategory(e.target.value as RoomCategory)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {(['Standard', 'Deluxe', 'Family', 'Luxury', 'VIP'] as RoomCategory[]).map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      )
                    )}
                  </select>
                </div>
                {!editingRoom && (
                  <div>
                    <label className="mb-1 block font-semibold">Xona raqami (ixtiyoriy)</label>
                    <input
                      type="text"
                      placeholder="Masalan: 601"
                      value={rmUnitNumber}
                      onChange={(e) => setRmUnitNumber(e.target.value)}
                      className="font-mono w-full rounded-lg border border-slate-300 px-3 py-2 tabular-nums"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block font-semibold">Nomi (UZ) *</label>
                <input
                  type="text"
                  placeholder="Masalan: Royal Oceanfront Villa"
                  value={rmNameUz}
                  onChange={(e) => {
                    setErrorMsg('');
                    setRmNameUz(e.target.value);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-semibold">Nomi (RU)</label>
                  <input
                    type="text"
                    placeholder="Ixtiyoriy"
                    value={rmNameRu}
                    onChange={(e) => setRmNameRu(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Nomi (EN)</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={rmNameEn}
                    onChange={(e) => setRmNameEn(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block font-semibold">Narx / tun ($) *</label>
                  <input
                    type="number"
                    value={rmPrice}
                    onChange={(e) => setRmPrice(Number(e.target.value))}
                    className="font-mono w-full rounded-lg border border-slate-300 px-3 py-2 tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Max mehmonlar *</label>
                  <input
                    type="number"
                    value={rmGuests}
                    onChange={(e) => setRmGuests(Number(e.target.value))}
                    className="font-mono w-full rounded-lg border border-slate-300 px-3 py-2 tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Maydoni (m²)</label>
                  <input
                    type="number"
                    value={rmSizeSqm}
                    onChange={(e) => setRmSizeSqm(Number(e.target.value))}
                    className="font-mono w-full rounded-lg border border-slate-300 px-3 py-2 tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold">Tavsif (UZ)</label>
                <textarea
                  rows={2}
                  placeholder="Panoramali dengiz manzarasi va barcha qulayliklar..."
                  value={rmDescUz}
                  onChange={(e) => setRmDescUz(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Xona tasviri</label>
                <select
                  value={rmImage}
                  onChange={(e) => setRmImage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value={IMG_ROOM_SUITE}>Luxury Oceanfront Suite</option>
                  <option value={IMG_ROOM_VILLA}>VIP Beachfront Pool Villa</option>
                  <option value={IMG_SERVICE_TAPCHAN}>Coastal Pavilion View</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-5 py-2 font-semibold text-white hover:bg-[#0F766E] disabled:opacity-50"
                >
                  {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {srvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl font-semibold text-[#0A192F]">
              {editingSrv ? 'Xizmatni tahrirlash' : t(lang, 'addServiceBtn')}
            </h3>
            <form onSubmit={handleSaveService} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold">Xizmat nomi (UZ) *</label>
                <input
                  type="text"
                  required
                  value={srvNameUz}
                  onChange={(e) => setSrvNameUz(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-semibold">Nomi (RU)</label>
                  <input
                    type="text"
                    value={srvNameRu}
                    onChange={(e) => setSrvNameRu(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Nomi (EN)</label>
                  <input
                    type="text"
                    value={srvNameEn}
                    onChange={(e) => setSrvNameEn(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-semibold">Narx ($) *</label>
                  <input
                    type="number"
                    min={5}
                    required
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(Number(e.target.value))}
                    className="font-mono w-full rounded-lg border border-slate-300 px-3 py-2 tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Davomiyligi *</label>
                  <input
                    type="text"
                    required
                    value={srvDurUz}
                    onChange={(e) => setSrvDurUz(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSrvModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 font-semibold text-white disabled:opacity-50"
                >
                  {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Reception User Modal */}
      {recModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl font-semibold text-[#0A192F]">
              {t(lang, 'addReceptionBtn')}
            </h3>
            <form onSubmit={handleCreateReception} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold">To‘liq ism *</label>
                <input
                  type="text"
                  required
                  value={recName}
                  onChange={(e) => setRecName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Email *</label>
                <input
                  type="email"
                  required
                  value={recEmail}
                  onChange={(e) => setRecEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Telefon *</label>
                <input
                  type="text"
                  required
                  value={recPhone}
                  onChange={(e) => setRecPhone(e.target.value)}
                  className="font-mono w-full rounded-lg border border-slate-300 px-3 py-2 tabular-nums"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-semibold">Parol *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={recPassword}
                    onChange={(e) => setRecPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Ish smenasi</label>
                  <input
                    type="text"
                    value={recShift}
                    onChange={(e) => setRecShift(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRecModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 font-semibold text-white disabled:opacity-50"
                >
                  {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Yaratish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl font-semibold text-[#0A192F]">
              Mijoz ma’lumotlarini yangilash
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (isBusy) return;
                setIsBusy(true);
                try {
                  await onUpdateUser(editingCustomer.id, {
                    fullName: custName,
                    phone: custPhone,
                  });
                  setEditingCustomer(null);
                  showToast(t(lang, 'msgDataSaved'));
                } finally {
                  setIsBusy(false);
                }
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="mb-1 block font-semibold">Ism</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Telefon</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="font-mono w-full rounded-lg border border-slate-300 px-3 py-2 tabular-nums"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="rounded-lg bg-[#0D9488] px-4 py-2 font-semibold text-white disabled:opacity-50"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
