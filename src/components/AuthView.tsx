import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Language, UserAccount } from '../types/resort';
import { t } from '../i18n/translations';
import { ResilientImage } from './ResilientImage';
import { IMG_ROOM_VILLA } from '../data/initialData';
import { resortApi } from '../services/api';

interface AuthViewProps {
  lang: Language;
  initialMode: 'login' | 'register' | 'admin';
  onAuthSuccess: (user: UserAccount) => void;
  onBackToSite: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  lang,
  initialMode,
  onAuthSuccess,
  onBackToSite,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback & Loading states
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (newMode: 'login' | 'register' | 'admin') => {
    setMode(newMode);
    setErrorMsg('');
    setForgotSent(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      setErrorMsg(
        lang === 'uz'
          ? 'Iltimos, email manzilingizni kiriting.'
          : lang === 'ru'
          ? 'Пожалуйста, введите ваш email.'
          : 'Please enter your email address.'
      );
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg(
        lang === 'uz'
          ? 'Email formati noto‘g‘ri!'
          : lang === 'ru'
          ? 'Неверный формат email!'
          : 'Invalid email format!'
      );
      return;
    }

    if (!password) {
      setErrorMsg(
        lang === 'uz'
          ? 'Iltimos, parolni kiriting.'
          : lang === 'ru'
          ? 'Пожалуйста, введите пароль.'
          : 'Please enter your password.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await resortApi.login({
        email: trimmedEmail,
        password,
        mode: mode === 'admin' ? 'admin' : 'login',
      });
      onAuthSuccess(loggedUser);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !password || !confirmPassword) {
      setErrorMsg(
        lang === 'uz'
          ? 'Barcha maydonlarni to‘ldirish majburiy!'
          : lang === 'ru'
          ? 'Пожалуйста, заполните все обязательные поля!'
          : 'All fields are required!'
      );
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg(
        lang === 'uz'
          ? 'Email formati noto‘g‘ri!'
          : lang === 'ru'
          ? 'Неверный формат email!'
          : 'Invalid email address format!'
      );
      return;
    }

    if (trimmedPhone.length < 7) {
      setErrorMsg(
        lang === 'uz'
          ? 'Telefon raqami kamida 7 ta raqamdan iborat bo‘lishi kerak.'
          : lang === 'ru'
          ? 'Введите корректный номер телефона.'
          : 'Please enter a valid phone number.'
      );
      return;
    }

    if (password.length < 4) {
      setErrorMsg(
        lang === 'uz'
          ? 'Parol kamida 4 ta belgidan iborat bo‘lishi kerak.'
          : lang === 'ru'
          ? 'Пароль должен содержать минимум 4 символа.'
          : 'Password must be at least 4 characters long.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(
        lang === 'uz'
          ? 'Parollar bir-biriga mos kelmadi!'
          : lang === 'ru'
          ? 'Пароли не совпадают!'
          : 'Passwords do not match!'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await resortApi.register({
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password,
        confirmPassword,
      });
      onAuthSuccess(created);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#F9F6F0]">
      {/* Left Side: Cinematic Split-Screen Resort Visual */}
      <div className="relative hidden lg:flex lg:col-span-6 flex-col justify-between overflow-hidden bg-[#0A192F] p-12 text-white">
        <div className="absolute inset-0">
          <ResilientImage
            src={IMG_ROOM_VILLA}
            alt="BEACH Luxury Sanctuary"
            className="h-full w-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F] via-[#0A192F]/50 to-[#0A192F]/30" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToSite}
            className="font-display text-3xl font-semibold tracking-[0.22em] text-white"
          >
            BEACH
          </button>
          <button
            type="button"
            onClick={onBackToSite}
            className="flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-md hover:bg-white/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t(lang, 'backToSite')}
          </button>
        </div>

        <div className="relative z-10 max-w-lg space-y-4">
          <p className="font-display text-2xl italic leading-relaxed text-[#F9F6F0]">
            {t(lang, 'authSplitQuote')}
          </p>
          <p className="text-xs tracking-wider text-[#5EEAD4] uppercase">
            BEACH · Private Coastline & Marine Sanctuary
          </p>
        </div>
      </div>

      {/* Right Side: Modern Authentication Form */}
      <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:col-span-6 xl:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Back link */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <span className="font-display text-2xl font-bold tracking-[0.2em] text-[#0A192F]">
              BEACH
            </span>
            <button
              type="button"
              onClick={onBackToSite}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#0D9488]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t(lang, 'backToSite')}
            </button>
          </div>

          {/* Segmented Auth Mode Tabs (Login / Register) */}
          {mode !== 'admin' && (
            <div className="mb-6 flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 whitespace-nowrap rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-[#0A192F] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#0A192F]'
                }`}
              >
                {t(lang, 'loginBtn')}
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 whitespace-nowrap rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-[#0A192F] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#0A192F]'
                }`}
              >
                {t(lang, 'registerBtn')}
              </button>
            </div>
          )}

          <h1 className="font-display text-3xl font-semibold text-[#0A192F]">
            {mode === 'login'
              ? t(lang, 'loginTitle')
              : mode === 'register'
              ? t(lang, 'registerTitle')
              : t(lang, 'adminLoginTitle')}
          </h1>

          {errorMsg && (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {forgotSent && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{t(lang, 'msgEmailSent')}</span>
            </div>
          )}

          {/* LOGIN OR PROTECTED ADMIN LOGIN FORM */}
          {(mode === 'login' || mode === 'admin') && (
            <form noValidate onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-[#0A192F] focus:border-[#0D9488] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  {t(lang, 'passwordLabel')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-[#0A192F] focus:border-[#0D9488] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={t(lang, 'showPassword')}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#0D9488]"
                  />
                  <span>{t(lang, 'rememberMe')}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotSent(true)}
                  className="font-medium text-[#0D9488] hover:underline"
                >
                  {t(lang, 'forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A192F] py-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{t(lang, 'loginBtn')}</span>
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form noValidate onSubmit={handleRegister} className="mt-6 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {t(lang, 'yourName')} *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={lang === 'uz' ? 'Ism va familiya' : 'Full Name'}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-[#0A192F] focus:border-[#0D9488] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {t(lang, 'yourEmail')} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-[#0A192F] focus:border-[#0D9488] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  {t(lang, 'yourPhone')} *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="font-mono w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-[#0A192F] tabular-nums focus:border-[#0D9488] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {t(lang, 'passwordLabel')} *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#0A192F] focus:border-[#0D9488] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {t(lang, 'confirmPasswordLabel')} *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-[#0A192F] focus:border-[#0D9488] focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D9488] py-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#0F766E] disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{t(lang, 'registerBtn')}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
