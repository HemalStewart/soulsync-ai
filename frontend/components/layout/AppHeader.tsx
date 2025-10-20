'use client';

import { useEffect, useState } from 'react';
import { User, LogOut, Coins as CoinsIcon, ChevronDown } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/components/auth/AuthContext';
import { useCoins } from '@/components/coins/CoinContext';
import AccountSettingsModal from '@/components/account/AccountSettingsModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    initialized,
  } = useAuth();
  const { balance, loading: coinLoading } = useCoins();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) {
      setShowAccountSettings(false);
    }
  }, [user]);

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

  const handleNavigate = (path: string) => {
    setShowAccountMenu(false);
    router.push(path);
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
      <header className={`sticky top-0 z-50 backdrop-blur-xl bg-white/80 transition-all duration-300 border-b shadow-sm min-h-[72px] ${scrolled ? 'border-gray-200/60 shadow-sm' : 'border-gray-100/40 shadow-sm'}`}>
        {/* Main Header Row */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 sm:gap-4 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          {/* Logo Section */}
          <Link
            href="/"
            className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 cursor-pointer select-none hover:opacity-90 transition"
          >
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-lg hover:scale-105 transition-transform duration-200">
              <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-md bg-white/20 backdrop-blur-sm" />
            </div>
            <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
              SoulFun
            </span>
          </Link>

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
            <button className="group relative px-3 sm:px-4 md:px-5 py-2 sm:py-2 md:py-2.5 rounded-lg font-semibold text-white overflow-hidden transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
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
                <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-gray-100 bg-white shadow-xl backdrop-blur-md z-50 overflow-hidden">
                  <div className="flex flex-col divide-y divide-gray-100">
                    
                    {/* My Character */}
                    <button
                      className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-purple-50/80 transition-all duration-200"
                      onClick={() => handleNavigate('/my-characters')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
                          <User size={18} />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold text-gray-900">My Characters</span>
                          <span className="text-xs text-gray-500">Manage AI companions</span>
                        </div>
                      </div>
                      <ChevronDown size={16} className="text-gray-400 rotate-270" />
                    </button>

                    {/* Video Gallery */}
                    <button
                      className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-blue-50/80 transition-all duration-200"
                      onClick={() => handleNavigate('/my-videos')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553 2.276a1 1 0 010 1.448L15 16V10z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h11v12H4z" />
                          </svg>
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold text-gray-900">Video Gallery</span>
                          <span className="text-xs text-gray-500">Your video collection</span>
                        </div>
                      </div>
                      <ChevronDown size={16} className="text-gray-400 rotate-270" />
                    </button>

                    {/* Coins Summary */}
                    <div className="px-4 py-3 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                            <CoinsIcon size={18} />
                          </div>
                          <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white rounded-full px-1 font-bold">!</span>
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold text-gray-900">Coins: {balance ?? 150}</span>
                          <span className="text-xs text-gray-500">Low balance!</span>
                        </div>
                      </div>
                      <button className="px-3 py-2 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition">
                        Get PRO
                      </button>
                    </div>

                    {/* Account */}
                    <button
                      className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-indigo-50/80 transition-all duration-200"
                      onClick={() => {
                        setShowAccountMenu(false);
                        setShowAccountSettings(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6a1.5 1.5 0 013 0v3h3a1.5 1.5 0 010 3h-3v3a1.5 1.5 0 01-3 0v-3h-3a1.5 1.5 0 010-3h3V6z" />
                          </svg>
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold text-gray-900">Account</span>
                          <span className="text-xs text-gray-500">Account settings</span>
                        </div>
                      </div>
                      <ChevronDown size={16} className="text-gray-400 rotate-270" />
                    </button>

                    {/* Log Out */}
                    <button
                      onClick={async () => {
                        setShowAccountMenu(false);
                        await logout();
                      }}
                      className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-red-50/80 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
                          <LogOut size={18} />
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-semibold text-red-600">Log Out</span>
                          <span className="text-xs text-red-400">Sign out securely</span>
                        </div>
                      </div>
                      <ChevronDown size={16} className="text-red-400 rotate-270" />
                    </button>

                  </div>
                </div>
              )}

              </div>
            )}
          </div>
        </div>

      </header>

      {initialized && (
        <>
          <AuthModal
            open={isAuthModalOpen}
            mode={authModalMode}
            onClose={closeAuthModal}
            onSwitchMode={openAuthModal}
          />
          <AccountSettingsModal
            open={showAccountSettings}
            onClose={() => setShowAccountSettings(false)}
            user={user}
          />
        </>
      )}
    </>
  );
};

export default AppHeader;
