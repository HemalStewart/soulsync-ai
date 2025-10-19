'use client';

import { useEffect, useState } from 'react';
import { User, LogOut, Coins as CoinsIcon, ChevronDown } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/components/auth/AuthContext';
import { useCoins } from '@/components/coins/CoinContext';
// import HeaderPromoBanner from './HeaderPromoBanner';

const AppHeader = () => {
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedBalance = balance != null ? balance.toLocaleString() : '--';

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
      {/* {bannerVisible && (
        <HeaderPromoBanner timeLeft={timeLeft} onClose={closeBanner} />
      )} */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl bg-white/80 transition-all duration-300 border-b shadow-sm ${scrolled ? 'border-gray-200/60 shadow-sm' : 'border-gray-100/40 shadow-sm'}`}>
        {/* Main Header Row */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          {/* Logo Section */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-lg">
              <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-md bg-white/20 backdrop-blur-sm" />
            </div>
            <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">SoulFun</span>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Coins Display - Desktop */}
            {user && mounted && (
              <div className="hidden md:flex items-center gap-2.5 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-gradient-to-r from-amber-400/10 via-yellow-400/10 to-orange-400/10 border border-amber-300/40 text-sm font-semibold shadow-sm hover:border-amber-300/60 transition-all duration-200">
                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-md">
                  <CoinsIcon className="h-3 w-3 text-white" />
                </div>
                {coinLoading ? (
                  <span className="h-3.5 w-10 rounded-full bg-gray-300 animate-pulse" />
                ) : (
                  <span className="tabular-nums bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{formattedBalance}</span>
                )}
              </div>
            )}

            {/* Coins Display - Mobile */}
            {user && mounted && (
              <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400/10 via-yellow-400/10 to-orange-400/10 border border-amber-300/40 text-xs font-semibold shadow-sm">
                <div className="flex items-center justify-center h-4 w-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500">
                  <CoinsIcon className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent tabular-nums">{coinLoading ? '…' : formattedBalance}</span>
              </div>
            )}

            {/* Get Pro Button - Fixed width */}
            <button className="group relative px-3 sm:px-4 md:px-5 py-2 sm:py-2 md:py-2.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
              <span className="relative z-10">Get Pro</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {loading ? (
              <>
                <div className="hidden sm:block h-9 w-20 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
                <div className="hidden sm:block h-9 w-20 rounded-xl bg-gray-200 animate-pulse flex-shrink-0" />
                <div className="sm:hidden p-2 text-gray-300">
                  <div className="h-5 w-5 rounded bg-gray-200 animate-pulse" />
                </div>
              </>
            ) : !user ? (
              <>
                <button
                  className="hidden sm:inline-block px-3 md:px-4 py-2 rounded-xl font-semibold text-gray-700 bg-gray-100/80 hover:bg-gray-200 transition-all duration-200 text-sm border border-gray-200/50 whitespace-nowrap"
                  onClick={() => openModal('login')}
                >
                  Log in
                </button>
                <button
                  className="hidden sm:inline-block px-3 md:px-4 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-sm whitespace-nowrap"
                  onClick={() => openModal('register')}
                >
                  Sign up
                </button>
                <button
                  className="sm:hidden p-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  onClick={() => openModal('login')}
                >
                  <User size={20} />
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-xl border border-gray-200/60 hover:border-gray-300 bg-white/50 backdrop-blur-sm hover:bg-gray-50 font-medium text-sm text-gray-700 transition-all duration-200 hover:scale-105"
                  onClick={() => setShowAccountMenu((prev) => !prev)}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-xs font-bold text-white shadow-md">
                    {initials ?? 'U'}
                  </span>
                  <span className="hidden lg:inline-block max-w-[120px] truncate text-sm">{user.email || user.mobile || 'Account'}</span>
                  <ChevronDown size={16} className={`hidden lg:block transition-transform duration-300 ${showAccountMenu ? 'rotate-180' : ''}`} />
                </button>

                {showAccountMenu && (
                  <div className="absolute right-0 mt-3 w-56 rounded-xl border border-gray-200/60 bg-white/95 backdrop-blur-md shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-gray-100/50">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.email || user.mobile}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        setShowAccountMenu(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 transition-all duration-200 font-medium rounded-b-xl"
                    >
                      <LogOut size={16} className="text-red-600" />
                      <span>Sign out</span>
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
