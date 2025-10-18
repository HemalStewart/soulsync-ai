'use client';

import { useEffect, useState } from 'react';
import { Menu, User, X, LogOut, Coins as CoinsIcon } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/components/auth/AuthContext';
import { useCoins } from '@/components/coins/CoinContext';

const initialCountdown = { hours: 59, minutes: 46, seconds: 89 };

const formatUnit = (value: number) => String(value).padStart(2, '0');

const AppHeader = () => {
  const [timeLeft, setTimeLeft] = useState(initialCountdown);
  const {
    user,
    logout,
    loading,
    openAuthModal,
    closeAuthModal,
    authModalMode,
    isAuthModalOpen,
  } = useAuth();
  const { balance, loading: coinLoading } = useCoins();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoverGetPro, setHoverGetPro] = useState(false);

  const formattedBalance = balance != null ? balance.toLocaleString() : '--';

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds -= 1;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes -= 1;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours -= 1;
            }
          }
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openModal = (mode: 'login' | 'register') => {
    openAuthModal(mode);
    setShowAccountMenu(false);
  };

  const initials = user?.email
    ? user.email
        .split('@')[0]
        .split(/[._-]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || user.email[0]?.toUpperCase()
    : null;

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg">
              <div className="h-6 w-6 rounded-full bg-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">SoulFun</span>
          </div>

          <div className="hidden items-center space-x-4 rounded-full bg-gradient-to-r from-green-700 to-green-600 px-6 py-2 text-white md:flex shadow-lg">
            <span className="font-semibold">FIRST SUBSCRIPTION</span>
            <div className="rounded-full bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-1 shadow-md">
              <span className="font-bold">up to 75% off</span>
            </div>
            <div className="flex space-x-2 font-mono text-sm">
              <span className="rounded bg-black/20 px-2 py-1 backdrop-blur-sm">
                {formatUnit(timeLeft.hours)}
              </span>
              <span>:</span>
              <span className="rounded bg-black/20 px-2 py-1 backdrop-blur-sm">
                {formatUnit(timeLeft.minutes)}
              </span>
              <span>:</span>
              <span className="rounded bg-black/20 px-2 py-1 backdrop-blur-sm">
                {formatUnit(timeLeft.seconds)}
              </span>
            </div>
            <button className="rounded-full p-1 hover:bg-white/20 transition-all duration-200 hover:scale-110">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 sm:flex">
                <CoinsIcon className="h-4 w-4 text-white/90" />
                {coinLoading ? (
                  <span className="h-3 w-10 rounded-full bg-white/40 animate-pulse" />
                ) : (
                  <span className="tabular-nums">{formattedBalance}</span>
                )}
              </div>
            )}
            <button 
              onMouseEnter={() => setHoverGetPro(true)}
              onMouseLeave={() => setHoverGetPro(false)}
              className={`relative rounded-full px-6 py-2 font-medium text-white overflow-hidden transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-500 ${hoverGetPro ? 'shadow-lg shadow-blue-400 scale-105' : 'shadow-md hover:shadow-lg'}`}
            >
              <span className="relative z-10">Get Pro</span>
              <div className={`absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 opacity-0 transition-all duration-300 ${hoverGetPro ? 'opacity-100' : ''}`} />
            </button>
            {user && (
              <div className="flex items-center sm:hidden">
                <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  <CoinsIcon className="h-3.5 w-3.5 text-white/90" />
                  {coinLoading ? '…' : formattedBalance}
                </div>
              </div>
            )}
            {loading ? (
              <div className="flex items-center space-x-3">
                <div className="h-9 w-24 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-9 w-24 rounded-full bg-blue-200/60 animate-pulse hidden sm:block" />
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse sm:hidden" />
              </div>
            ) : !user ? (
              <>
                <button
                  className="hidden rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50 sm:inline-block"
                  onClick={() => openModal('login')}
                >
                  Log in
                </button>
                <button
                  className="hidden rounded-full border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 sm:inline-block"
                  onClick={() => openModal('register')}
                  style={{ animationDelay: '0.1s' }}
                >
                  Register
                </button>
                <button
                  className="rounded-full p-2 text-gray-700 hover:bg-blue-50 sm:hidden transition-all duration-200 hover:scale-110"
                  onClick={() => openModal('login')}
                >
                  <User size={22} />
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  className="flex items-center space-x-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900 hover:scale-105 duration-200"
                  onClick={() => setShowAccountMenu((prev) => !prev)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shadow-md">
                    {initials ?? 'U'}
                  </span>
                  <span className="hidden sm:inline-block">
                    {user.email || user.mobile || 'Account'}
                  </span>
                </button>

                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white shadow-lg animate-slide-down">
                    <div className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.email || user.mobile}
                      </p>
                      {user.email && (
                        <p className="text-xs text-gray-500">{user.email}</p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        setShowAccountMenu(false);
                        await logout();
                      }}
                      className="flex w-full rounded-xl items-center space-x-2 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                      <LogOut size={18} />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </header>

      <AuthModal
        open={isAuthModalOpen}
        mode={authModalMode}
        onClose={closeAuthModal}
        onSwitchMode={openAuthModal}
      />
    </>
  );
};

export default AppHeader;
