import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  X,
  Calendar,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Wifi,
  Wind,
  Bath,
  Eye,
  BedDouble,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  BeachService,
  Booking,
  Language,
  PhysicalRoom,
  Room,
  UserAccount,
} from '../types/resort';
import { localize, t } from '../i18n/translations';
import { ResilientImage } from './ResilientImage';
import { INITIAL_ROOMS, INITIAL_SERVICES, TODAY_DATE } from '../data/initialData';
import { BookedSlot } from '../services/api';

interface BookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  rooms: Room[];
  physicalRooms: PhysicalRoom[];
  bookedSlots: BookedSlot[];
  services: BeachService[];
  initialRoomId?: string;
  initialServiceIds?: string[];
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  currentUser: UserAccount | null;
  onSubmitBooking: (payload: {
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
  }) => Promise<Booking>;
  onGoToDashboard: () => void;
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export function datesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && endA > startB;
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({
  isOpen,
  onClose,
  lang,
  rooms,
  physicalRooms,
  bookedSlots,
  services,
  initialRoomId,
  initialServiceIds = [],
  initialCheckIn = TODAY_DATE,
  initialCheckOut = '2026-10-03',
  initialGuests = 2,
  currentUser,
  onSubmitBooking,
  onGoToDashboard,
}) => {
  const effectiveRooms = useMemo(
    () => (Array.isArray(rooms) && rooms.length > 0 ? rooms : INITIAL_ROOMS),
    [rooms]
  );
  const effectiveServices = useMemo(
    () => (Array.isArray(services) && services.length > 0 ? services : INITIAL_SERVICES),
    [services]
  );

  const [step, setStep] = useState<number>(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    initialRoomId || effectiveRooms[0]?.id || 'room-deluxe'
  );
  const [preferredUnitNumber, setPreferredUnitNumber] = useState<string>('');
  const [checkIn, setCheckIn] = useState<string>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<string>(initialCheckOut);
  const [guests, setGuests] = useState<number>(initialGuests);
  const [selectedServices, setSelectedServices] = useState<string[]>(initialServiceIds);

  const [guestName, setGuestName] = useState<string>(currentUser?.fullName || '');
  const [guestEmail, setGuestEmail] = useState<string>(currentUser?.email || '');
  const [guestPhone, setGuestPhone] = useState<string>(currentUser?.phone || '+998 ');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const submittingLockRef = useRef<boolean>(false);
  const wasOpenRef = useRef<boolean>(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setStep(1);
      setFormError('');
      setCreatedBooking(null);
      setIsSubmitting(false);
      submittingLockRef.current = false;
      const targetRm =
        effectiveRooms.find((r) => r.id === initialRoomId) || effectiveRooms[0];
      if (targetRm) {
        setSelectedRoomId(targetRm.id);
        setGuests(Math.min(Math.max(1, initialGuests || 2), targetRm.maxGuests));
      }
      setSelectedServices(Array.isArray(initialServiceIds) ? initialServiceIds : []);
      setCheckIn(initialCheckIn || TODAY_DATE);
      setCheckOut(initialCheckOut || '2026-10-03');
      if (currentUser) {
        setGuestName(currentUser.fullName);
        setGuestEmail(currentUser.email);
        setGuestPhone(currentUser.phone);
      }
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [
    isOpen,
    initialRoomId,
    initialServiceIds,
    initialCheckIn,
    initialCheckOut,
    initialGuests,
    currentUser,
    effectiveRooms,
  ]);

  const selectedRoom = useMemo(
    () =>
      effectiveRooms.find((r) => r.id === selectedRoomId) ||
      effectiveRooms[0] ||
      INITIAL_ROOMS[0],
    [effectiveRooms, selectedRoomId]
  );

  // Ensure guests count never exceeds selectedRoom.maxGuests
  useEffect(() => {
    if (selectedRoom && guests > selectedRoom.maxGuests) {
      setGuests(selectedRoom.maxGuests);
    }
  }, [selectedRoom, guests]);

  // Compute which physical units of the selected room category are available for [checkIn, checkOut)
  const unitAvailability = useMemo(() => {
    if (!selectedRoom) return [];
    const units = physicalRooms.filter((u) => u.category === selectedRoom.category);
    return units.map((unit) => {
      if (unit.status === 'MAINTENANCE' || unit.status === 'CLEANING') {
        return {
          unitNumber: unit.unitNumber,
          available: false,
          reason: unit.status,
        };
      }
      const conflict = bookedSlots.find(
        (b) =>
          b.assignedUnitNumber === unit.unitNumber &&
          datesOverlap(checkIn, checkOut, b.checkIn, b.checkOut)
      );
      if (conflict) {
        return {
          unitNumber: unit.unitNumber,
          available: false,
          reason: `Band (${conflict.checkIn} → ${conflict.checkOut})`,
        };
      }
      return {
        unitNumber: unit.unitNumber,
        available: true,
        reason: 'AVAILABLE',
      };
    });
  }, [selectedRoom, physicalRooms, bookedSlots, checkIn, checkOut]);

  const freeUnits = useMemo(
    () => unitAvailability.filter((u) => u.available),
    [unitAvailability]
  );

  useEffect(() => {
    if (freeUnits.length > 0) {
      if (!preferredUnitNumber || !freeUnits.some((u) => u.unitNumber === preferredUnitNumber)) {
        setPreferredUnitNumber(freeUnits[0].unitNumber);
      }
    } else {
      setPreferredUnitNumber('');
    }
  }, [freeUnits, preferredUnitNumber]);

  const rawNights = useMemo(() => calculateNights(checkIn, checkOut), [checkIn, checkOut]);
  const nights = Math.max(1, rawNights);

  const roomTotal = useMemo(
    () => (selectedRoom ? Math.max(0, selectedRoom.pricePerNight * nights) : 0),
    [selectedRoom, nights]
  );

  const servicesTotal = useMemo(
    () =>
      selectedServices.reduce((acc, srvId) => {
        const srv = effectiveServices.find((s) => s.id === srvId);
        return acc + (srv ? Math.max(0, srv.price) : 0);
      }, 0),
    [selectedServices, effectiveServices]
  );

  const totalPrice = Math.max(0, roomTotal + servicesTotal);

  if (!isOpen) return null;

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = async () => {
    if (isSubmitting || submittingLockRef.current) return;
    setFormError('');

    if (step === 1) {
      if (!selectedRoom.available) {
        setFormError(t(lang, 'msgRoomUnavailable'));
        return;
      }
    }

    if (step === 2) {
      if (!checkIn || checkIn < '2025-01-01') {
        setFormError(
          lang === 'uz'
            ? 'Kirish sanasi o‘tib ketgan sana bo‘lishi mumkin emas.'
            : lang === 'ru'
            ? 'Дата заезда не может быть в прошлом.'
            : 'Check-in date cannot be in the past.'
        );
        return;
      }
      if (!checkOut || rawNights <= 0) {
        setFormError(
          lang === 'uz'
            ? 'Chiqish sanasi kirish sanasidan keyin bo‘lishi shart.'
            : lang === 'ru'
            ? 'Дата выезда должна быть позже даты заезда.'
            : 'Check-out date must be after check-in date.'
        );
        return;
      }
      if (freeUnits.length === 0) {
        setFormError('Bu xona tanlangan sanalarda band.');
        return;
      }
    }

    if (step === 3) {
      if (guests < 1 || guests > selectedRoom.maxGuests) {
        setFormError(
          lang === 'uz'
            ? `Mehmonlar soni 1 dan ${selectedRoom.maxGuests} nafargacha bo‘lishi kerak.`
            : lang === 'ru'
            ? `Количество гостей должно быть от 1 до ${selectedRoom.maxGuests}.`
            : `Guests must be between 1 and ${selectedRoom.maxGuests}.`
        );
        return;
      }
    }

    if (step === 5) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (
        !guestName.trim() ||
        guestName.trim().length < 2 ||
        !emailRegex.test(guestEmail.trim()) ||
        guestPhone.trim().length < 7
      ) {
        setFormError(
          lang === 'uz'
            ? 'Iltimos, to‘liq ism, to‘g‘ri email va telefon raqamini kiriting.'
            : lang === 'ru'
            ? 'Пожалуйста, введите полное имя, корректный email и телефон.'
            : 'Please enter your full name, a valid email address, and phone number.'
        );
        return;
      }

      submittingLockRef.current = true;
      setIsSubmitting(true);
      try {
        const resultBooking = await onSubmitBooking({
          roomId: selectedRoom.id,
          preferredUnitNumber: preferredUnitNumber || undefined,
          checkIn,
          checkOut,
          guests,
          serviceIds: selectedServices,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          guestPhone: guestPhone.trim(),
          specialRequests: specialRequests.trim() || undefined,
        });
        setCreatedBooking(resultBooking);
        setStep(6);
      } catch (err: any) {
        setFormError(err?.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
      } finally {
        setIsSubmitting(false);
        submittingLockRef.current = false;
      }
      return;
    }

    setStep((s) => Math.min(6, s + 1));
  };

  const stepsLabels = [
    t(lang, 'step1'),
    t(lang, 'step2'),
    t(lang, 'step3'),
    t(lang, 'step4'),
    t(lang, 'step5'),
    t(lang, 'step6'),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/75 p-3 backdrop-blur-sm sm:p-6">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#F9F6F0] text-[#0A192F] shadow-2xl">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-6 py-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#0A192F]">
              {t(lang, 'wizardTitle')}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              {stepsLabels.map((lbl, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isDone = step > stepNum;
                return (
                  <React.Fragment key={lbl}>
                    <span
                      className={`font-medium ${
                        isActive
                          ? 'font-semibold text-[#0D9488]'
                          : isDone
                          ? 'text-[#0A192F]'
                          : 'text-slate-400'
                      }`}
                    >
                      {lbl}
                    </span>
                    {idx < stepsLabels.length - 1 && <span aria-hidden="true">·</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {formError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* STEP 1: SELECT ROOM */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                {lang === 'uz'
                  ? 'Dam olish uchun xona yoki VIP villani tanlang:'
                  : lang === 'ru'
                  ? 'Выберите категорию номера или приватную виллу:'
                  : 'Select your preferred suite or beachfront villa category:'}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {effectiveRooms.map((rm) => {
                  const isSelected = rm.id === selectedRoom.id;
                  return (
                    <div
                      key={rm.id}
                      onClick={() => {
                        setFormError('');
                        setSelectedRoomId(rm.id);
                      }}
                      className={`flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border bg-white transition-all ${
                        isSelected
                          ? 'border-2 border-[#0D9488] shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      } ${!rm.available ? 'opacity-60' : ''}`}
                    >
                      <div>
                        <div className="relative h-36 w-full overflow-hidden">
                          <ResilientImage
                            src={rm.image}
                            alt={localize(lang, rm.name)}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-display text-lg font-semibold text-[#0A192F]">
                              {localize(lang, rm.name)}
                            </h3>
                            <span className="font-mono text-sm font-semibold text-[#0D9488] tabular-nums">
                              ${rm.pricePerNight}
                              {t(lang, 'perNight')}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {rm.category} · {rm.maxGuests} {t(lang, 'guestsUnit')} · {rm.sizeSqm} m² ·{' '}
                            <span className={rm.available ? 'text-emerald-700' : 'text-red-600'}>
                              {rm.available ? t(lang, 'availableLabel') : t(lang, 'unavailableLabel')}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 px-4 py-2.5">
                        <button
                          type="button"
                          disabled={!rm.available}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormError('');
                            setSelectedRoomId(rm.id);
                            if (rm.available) {
                              setStep(2);
                            }
                          }}
                          className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                            isSelected
                              ? 'bg-[#0D9488] text-white hover:bg-[#0F766E]'
                              : 'bg-slate-100 text-[#0A192F] hover:bg-[#0D9488] hover:text-white'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          <span>
                            {isSelected
                              ? `${t(lang, 'bookNowBtn')} →`
                              : t(lang, 'bookNowBtn')}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT DATES & PHYSICAL ROOM UNIT AVAILABILITY */}
          {step === 2 && (
            <div className="mx-auto max-w-2xl space-y-5 rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3 text-[#0D9488]">
                <Calendar className="h-5 w-5" />
                <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                  {t(lang, 'step2')} — {localize(lang, selectedRoom.name)}
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {t(lang, 'checkIn')}
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    min="2025-01-01"
                    onChange={(e) => {
                      setFormError('');
                      setCheckIn(e.target.value);
                    }}
                    className="font-mono w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0A192F] tabular-nums focus:border-[#0D9488] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {t(lang, 'checkOut')}
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => {
                      setFormError('');
                      setCheckOut(e.target.value);
                    }}
                    className="font-mono w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#0A192F] tabular-nums focus:border-[#0D9488] focus:outline-none"
                  />
                </div>
              </div>

              {/* Physical Unit Selector with Overlap Check */}
              <div className="border-t border-slate-100 pt-4">
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Xona raqamini tanlang (Sanalar kesishmasligi avtomatik tekshiriladi):
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {unitAvailability.map((u) => (
                    <button
                      key={u.unitNumber}
                      type="button"
                      disabled={!u.available}
                      onClick={() => setPreferredUnitNumber(u.unitNumber)}
                      className={`rounded-lg border p-2.5 text-left text-xs transition-all ${
                        preferredUnitNumber === u.unitNumber && u.available
                          ? 'border-2 border-[#0D9488] bg-[#0D9488]/10 text-[#0A192F]'
                          : u.available
                          ? 'border-slate-200 bg-white hover:border-[#0D9488]'
                          : 'cursor-not-allowed border-red-100 bg-red-50/50 text-slate-400'
                      }`}
                    >
                      <div className="font-mono font-bold tabular-nums">Xona #{u.unitNumber}</div>
                      <div className="mt-0.5 text-[11px]">
                        {u.available ? (
                          <span className="text-emerald-700">Bo‘sh (AVAILABLE)</span>
                        ) : (
                          <span className="text-red-600">{u.reason}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-600">{t(lang, 'nightsCount')}:</span>
                <span className="font-mono font-semibold text-[#0A192F] tabular-nums">
                  {rawNights > 0 ? rawNights : 0} {t(lang, 'nightUnit')} × $
                  {selectedRoom.pricePerNight} = ${rawNights > 0 ? roomTotal : 0}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: SELECT GUESTS */}
          {step === 3 && (
            <div className="mx-auto max-w-xl space-y-5 rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3 text-[#0D9488]">
                <Users className="h-5 w-5" />
                <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                  {t(lang, 'step3')}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {localize(lang, selectedRoom.name)} — max {selectedRoom.maxGuests}{' '}
                {t(lang, 'guestsUnit')}
              </p>
              <div className="flex items-center gap-4">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={num > selectedRoom.maxGuests}
                    onClick={() => setGuests(num)}
                    className={`font-mono h-12 w-12 rounded-xl border text-sm font-semibold tabular-nums transition-all ${
                      guests === num
                        ? 'border-[#0D9488] bg-[#0D9488] text-white shadow-sm'
                        : num > selectedRoom.maxGuests
                        ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
                        : 'border-slate-200 bg-white text-[#0A192F] hover:border-[#0D9488]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: SELECT ADDITIONAL SERVICES */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {lang === 'uz'
                    ? 'Sohil va suv ko‘ngilochar xizmatlarini broningizga qo‘shing:'
                    : lang === 'ru'
                    ? 'Добавьте пляжные сервисы и водные развлечения к бронированию:'
                    : 'Enhance your stay with curated beach and marine experiences:'}
                </p>
                <span className="font-mono text-xs font-semibold text-[#0D9488] tabular-nums">
                  +${servicesTotal}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {effectiveServices.map((srv) => {
                  const chosen = selectedServices.includes(srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleService(srv.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border bg-white p-4 transition-all ${
                        chosen
                          ? 'border-2 border-[#0D9488] bg-[#0D9488]/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="pr-3">
                        <h4 className="text-sm font-semibold text-[#0A192F]">
                          {localize(lang, srv.name)}
                        </h4>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {localize(lang, srv.duration)} ·{' '}
                          <span className="font-mono font-semibold text-[#0D9488] tabular-nums">
                            ${srv.price}
                          </span>
                        </p>
                      </div>
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                          chosen
                            ? 'border-[#0D9488] bg-[#0D9488] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {chosen && <Check className="h-4 w-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: CUSTOMER INFORMATION */}
          {step === 5 && (
            <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                {t(lang, 'step5')}
              </h3>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {t(lang, 'yourName')} *
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Aziza Karimova"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {t(lang, 'yourEmail')} *
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="guest@mail.uz"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0D9488] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {t(lang, 'yourPhone')} *
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="font-mono w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm tabular-nums focus:border-[#0D9488] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {t(lang, 'specialRequestsLabel')}
                </label>
                <textarea
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-[#0D9488] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 6: BOOKING CONFIRMATION & SUMMARY */}
          {step === 6 && createdBooking && (
            <div className="mx-auto max-w-2xl space-y-5 rounded-xl border border-[#0D9488]/30 bg-white p-6">
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold">{t(lang, 'msgBookingCreated')}</h3>
                  <p className="text-xs text-emerald-700">
                    {t(lang, 'notifNewBooking')} — {createdBooking.guestEmail}
                  </p>
                </div>
              </div>

              <h4 className="font-display text-xl font-semibold text-[#0A192F]">
                {t(lang, 'bookingSummary')}
              </h4>

              <div className="grid gap-3 border-t border-b border-slate-100 py-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-xs text-slate-400">{t(lang, 'bookingIdLabel')}</span>
                  <p className="font-mono font-semibold text-[#0A192F] tabular-nums">
                    {createdBooking.id}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t(lang, 'guestNameLabel')}</span>
                  <p className="font-semibold text-[#0A192F]">{createdBooking.guestName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t(lang, 'selectedRoomLabel')}</span>
                  <p className="font-semibold text-[#0A192F]">
                    {localize(lang, selectedRoom.name)} (#{createdBooking.assignedUnitNumber})
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t(lang, 'guests')}</span>
                  <p className="font-mono font-semibold text-[#0A192F] tabular-nums">
                    {createdBooking.guests} {t(lang, 'guestsUnit')}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t(lang, 'checkIn')}</span>
                  <p className="font-mono font-semibold text-[#0A192F] tabular-nums">
                    {createdBooking.checkIn}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t(lang, 'checkOut')}</span>
                  <p className="font-mono font-semibold text-[#0A192F] tabular-nums">
                    {createdBooking.checkOut} ({createdBooking.nights} {t(lang, 'nightUnit')})
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-400">{t(lang, 'selectedServicesLabel')}</span>
                  <p className="font-medium text-[#0A192F]">
                    {createdBooking.serviceIds.length > 0
                      ? createdBooking.serviceIds
                          .map((id) => {
                            const s = services.find((item) => item.id === id);
                            return s ? localize(lang, s.name) : id;
                          })
                          .join(' · ')
                      : t(lang, 'noExtraServices')}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t(lang, 'bookingStatusLabel')}</span>
                  <p className="font-mono text-xs font-semibold text-amber-700">
                    {createdBooking.status}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">{t(lang, 'totalPriceLabel')}</span>
                  <p className="font-mono text-lg font-bold text-[#0D9488] tabular-nums">
                    ${createdBooking.totalPrice}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t(lang, 'backToSite')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToDashboard();
                  }}
                  className="rounded-lg bg-[#0A192F] px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  {t(lang, 'custMyBookings')} →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sticky Summary & Controls (Steps 1 to 5) */}
        {step < 6 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-[#0A192F]">
                {localize(lang, selectedRoom.name)}
              </span>{' '}
              · {nights} {t(lang, 'nightUnit')} × ${selectedRoom.pricePerNight} (${roomTotal}) +{' '}
              {selectedServices.length} xizmat (${servicesTotal}) ={' '}
              <span className="font-mono text-base font-bold text-[#0D9488] tabular-nums">
                ${totalPrice}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t(lang, 'prevStep')}
                </button>
              )}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Jarayonda...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {step === 5 ? t(lang, 'confirmBookingBtn') : t(lang, 'nextStep')}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface RoomDetailModalProps {
  room: Room | null;
  onClose: () => void;
  lang: Language;
  services: BeachService[];
  onProceedToBook: (
    roomId: string,
    checkIn: string,
    checkOut: string,
    guests: number,
    serviceIds: string[]
  ) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  onClose,
  lang,
  services,
  onProceedToBook,
}) => {
  const [checkIn, setCheckIn] = useState(TODAY_DATE);
  const [checkOut, setCheckOut] = useState('2026-10-03');
  const [guests, setGuests] = useState(2);
  const [selectedServices, setSelectedServices] = useState<string[]>(['srv-tapchan']);
  const [dateErr, setDateErr] = useState('');

  if (!room) return null;

  const rawNights = calculateNights(checkIn, checkOut);
  const nights = Math.max(1, rawNights);
  const roomPrice = Math.max(0, room.pricePerNight * nights);
  const extraPrice = selectedServices.reduce((sum, id) => {
    const srv = services.find((s) => s.id === id);
    return sum + (srv ? Math.max(0, srv.price) : 0);
  }, 0);
  const total = roomPrice + extraPrice;

  const toggleSrv = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/75 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white text-[#0A192F] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-12">
          {/* Left: Room Showcase & Specs */}
          <div className="p-6 md:col-span-7">
            <div className="h-64 w-full overflow-hidden rounded-xl">
              <ResilientImage
                src={room.image}
                alt={localize(lang, room.name)}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-3xl font-semibold text-[#0A192F]">
                  {localize(lang, room.name)}
                </h2>
                <span className="font-mono text-xl font-bold text-[#0D9488] tabular-nums">
                  ${room.pricePerNight}
                  <span className="text-xs font-normal text-slate-500">{t(lang, 'perNight')}</span>
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {localize(lang, room.description)}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-[#0D9488]" />
                  <span>{localize(lang, room.bedType)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0D9488]" />
                  <span>
                    Max {room.maxGuests} {t(lang, 'guestsUnit')} · {room.sizeSqm} m²
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-[#0D9488]" />
                  <span>{t(lang, 'wifiLabel')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="h-4 w-4 text-[#0D9488]" />
                  <span>{t(lang, 'acLabel')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-[#0D9488]" />
                  <span>
                    {room.bathroomCount} {t(lang, 'bathroomLabel')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#0D9488]" />
                  <span>{localize(lang, room.seaView)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Interactive Price Calculator */}
          <div className="flex flex-col justify-between border-t border-slate-100 bg-[#F9F6F0] p-6 md:col-span-5 md:border-t-0 md:border-l">
            <div className="space-y-4">
              <h3 className="font-display text-xl font-semibold text-[#0A192F]">
                {t(lang, 'priceCalcTitle')}
              </h3>

              {dateErr && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {dateErr}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {t(lang, 'checkIn')}
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    min="2025-01-01"
                    onChange={(e) => {
                      setDateErr('');
                      setCheckIn(e.target.value);
                    }}
                    className="font-mono w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    {t(lang, 'checkOut')}
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => {
                      setDateErr('');
                      setCheckOut(e.target.value);
                    }}
                    className="font-mono w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {t(lang, 'guests')}
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="font-mono w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs tabular-nums"
                >
                  {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n} {t(lang, 'guestsUnit')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  {t(lang, 'extraServicesLabel')}
                </label>
                <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                  {services.map((srv) => {
                    const active = selectedServices.includes(srv.id);
                    return (
                      <label
                        key={srv.id}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleSrv(srv.id)}
                            className="accent-[#0D9488]"
                          />
                          <span>{localize(lang, srv.name)}</span>
                        </div>
                        <span className="font-mono font-semibold text-[#0D9488] tabular-nums">
                          +${srv.price}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-slate-200 pt-4 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>
                  {t(lang, 'nightsCount')} ({rawNights > 0 ? rawNights : 0} {t(lang, 'nightUnit')})
                </span>
                <span className="font-mono font-semibold tabular-nums">
                  ${rawNights > 0 ? roomPrice : 0}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t(lang, 'extraServicesLabel')}</span>
                <span className="font-mono font-semibold tabular-nums">+${extraPrice}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-[#0A192F]">
                <span>{t(lang, 'totalPriceLabel')}</span>
                <span className="font-mono text-lg text-[#0D9488] tabular-nums">
                  ${rawNights > 0 ? total : extraPrice}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (checkIn < '2025-01-01' || rawNights <= 0) {
                    setDateErr(
                      lang === 'uz'
                        ? 'Chiqish sanasi kirish sanasidan keyin bo‘lishi kerak.'
                        : 'Check-out must be after check-in.'
                    );
                    return;
                  }
                  onProceedToBook(room.id, checkIn, checkOut, guests, selectedServices);
                }}
                className="mt-3 w-full rounded-xl bg-[#0D9488] py-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#0F766E]"
              >
                {t(lang, 'bookNowBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
