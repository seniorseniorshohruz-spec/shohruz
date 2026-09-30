import React, { useEffect, useState } from 'react';
import { Bell, Menu, User, X, ShieldCheck, Briefcase, LogOut } from 'lucide-react';
import { AppNotification, Language, UserAccount, UserRole } from '../types/resort';
import { localize, t } from '../i18n/translations';

interface NavbarProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  currentUser: UserAccount | null;
  onOpenAuth: (mode: 'login' | 'register' | 'admin') => void;
  onNavigateView: (
    view: 'home' | 'customer_dashboard' | 'reception_dashboard' | 'admin_dashboard'
  ) => void;
  onLogout: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onChangeLang,
  currentUser,
  onOpenAuth,
  onNavigateView,
  onLogout,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 32);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const scrollToSection = (sectionId: string) => {
    onNavigateView('home');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  const openDashboardForUser = () => {
    if (!currentUser) return;
    if (currentUser.role === UserRole.ADMIN) {
      onNavigateView('admin_dashboard');
    } else if (currentUser.role === UserRole.RECEPTION) {
      onNavigateView('reception_dashboard');
    } else {
      onNavigateView('customer_dashboard');
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/15 bg-[#0A192F]/90 py-3.5 text-white shadow-lg backdrop-blur-xl'
          : 'bg-gradient-to-b from-[#0A192F]/80 to-transparent py-5 text-white'
      }`}
    >
      <div className="mx-auto flex max-w-[1360px] items-center justify-between px-4 sm:px-8">
        {/* Zone 1: Brand Wordmark (Single clean text element) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('top');
          }}
          className="font-display text-2xl font-semibold tracking-[0.22em] text-white transition-opacity hover:opacity-90 sm:text-3xl"
        >
          BEACH
        </a>

        {/* Zone 2: Clean Typography Navigation Links (Max 5 visible on md, 6th on xl) */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-white/90 lg:flex">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('top');
            }}
            className="whitespace-nowrap underline-offset-8 transition-colors hover:text-[#5EEAD4] hover:underline"
          >
            {t(lang, 'navHome')}
          </a>
          <a
            href="#rooms"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('rooms');
            }}
            className="whitespace-nowrap underline-offset-8 transition-colors hover:text-[#5EEAD4] hover:underline"
          >
            {t(lang, 'navRooms')}
          </a>
          <a
            href="#services"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('services');
            }}
            className="whitespace-nowrap underline-offset-8 transition-colors hover:text-[#5EEAD4] hover:underline"
          >
            {t(lang, 'navServices')}
          </a>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('about');
            }}
            className="whitespace-nowrap underline-offset-8 transition-colors hover:text-[#5EEAD4] hover:underline"
          >
            {t(lang, 'navAbout')}
          </a>
          <a
            href="#gallery"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('gallery');
            }}
            className="whitespace-nowrap underline-offset-8 transition-colors hover:text-[#5EEAD4] hover:underline"
          >
            {t(lang, 'navGallery')}
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('contact');
            }}
            className="hidden whitespace-nowrap underline-offset-8 transition-colors hover:text-[#5EEAD4] hover:underline xl:inline-block"
          >
            {t(lang, 'navContact')}
          </a>
        </nav>

        {/* Zone 3: Language Selector + Notifications + Primary Auth/Portal Actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher: UZ | RU | EN */}
          <div
            role="group"
            aria-label="Language selector"
            className="flex items-center rounded-lg border border-white/20 bg-white/10 p-0.5 backdrop-blur-md"
          >
            {(['uz', 'ru', 'en'] as Language[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onChangeLang(code)}
                className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold uppercase transition-all ${
                  lang === code
                    ? 'bg-white text-[#0A192F] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="font-mono absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0D9488] px-1 text-[10px] font-semibold text-white tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 text-[#0A192F] shadow-2xl sm:w-96">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    {t(lang, 'custNotifications')} ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={onMarkAllNotificationsRead}
                      className="text-xs font-medium text-[#0D9488] hover:underline"
                    >
                      {t(lang, 'markAsReadBtn')}
                    </button>
                  )}
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">
                      Hozircha yangi bildirishnomalar yo‘q
                    </p>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        className={`cursor-pointer rounded-lg border p-2.5 text-left transition-colors ${
                          n.read
                            ? 'border-slate-100 bg-slate-50/50 text-slate-600'
                            : 'border-[#0D9488]/30 bg-[#0D9488]/5 text-[#0A192F]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold">{localize(lang, n.title)}</p>
                          <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                            {n.createdAt.split(' ')[1] || n.createdAt}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {localize(lang, n.description)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Auth or Active Role Portal Buttons */}
          {currentUser ? (
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={openDashboardForUser}
                className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#0F766E]"
              >
                {currentUser.role === UserRole.ADMIN ? (
                  <ShieldCheck className="h-4 w-4" />
                ) : currentUser.role === UserRole.RECEPTION ? (
                  <Briefcase className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span>
                  {currentUser.role === UserRole.ADMIN
                    ? t(lang, 'adminPortalBtn')
                    : currentUser.role === UserRole.RECEPTION
                    ? t(lang, 'receptionPortalBtn')
                    : t(lang, 'customerPortalBtn')}
                </span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                title={t(lang, 'logoutBtn')}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2.5 sm:flex">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="whitespace-nowrap rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                {t(lang, 'loginBtn')}
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="whitespace-nowrap rounded-lg bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#0F766E]"
              >
                {t(lang, 'registerBtn')}
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-white/15 bg-[#0A192F]/95 px-6 py-5 text-white backdrop-blur-xl lg:hidden">
          <div className="flex flex-col space-y-3 text-sm font-medium">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('top');
              }}
              className="py-1.5 hover:text-[#5EEAD4]"
            >
              {t(lang, 'navHome')}
            </a>
            <a
              href="#rooms"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('rooms');
              }}
              className="py-1.5 hover:text-[#5EEAD4]"
            >
              {t(lang, 'navRooms')}
            </a>
            <a
              href="#services"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('services');
              }}
              className="py-1.5 hover:text-[#5EEAD4]"
            >
              {t(lang, 'navServices')}
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('about');
              }}
              className="py-1.5 hover:text-[#5EEAD4]"
            >
              {t(lang, 'navAbout')}
            </a>
            <a
              href="#gallery"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('gallery');
              }}
              className="py-1.5 hover:text-[#5EEAD4]"
            >
              {t(lang, 'navGallery')}
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('contact');
              }}
              className="py-1.5 hover:text-[#5EEAD4]"
            >
              {t(lang, 'navContact')}
            </a>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 border-t border-white/15 pt-4">
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={openDashboardForUser}
                  className="flex-1 whitespace-nowrap rounded-lg bg-[#0D9488] px-4 py-2.5 text-center text-xs font-semibold text-white"
                >
                  {t(lang, 'dashboardBtn')} ({currentUser.role})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="whitespace-nowrap rounded-lg border border-white/25 px-4 py-2.5 text-xs font-semibold text-white"
                >
                  {t(lang, 'logoutBtn')}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 whitespace-nowrap rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white"
                >
                  {t(lang, 'loginBtn')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 whitespace-nowrap rounded-lg bg-[#0D9488] px-4 py-2.5 text-xs font-semibold text-white"
                >
                  {t(lang, 'registerBtn')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
