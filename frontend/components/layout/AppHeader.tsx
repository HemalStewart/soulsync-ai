'use client';

import { useEffect, useState } from 'react';
import { Menu, User, X, LogOut } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/components/auth/AuthContext';

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
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoverGetPro, setHoverGetPro] = useState(false);

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
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        
        .animate-slide-down {
          animation: slideDown 0.5s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
        
        .banner-item {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .animate-slide-in {
          animation: slideIn 0.6s ease-out;
        }
        
        .animate-pulse-scale {
          animation: pulse-scale 1.5s ease-in-out infinite;
        }
        
        header {
          transition: box-shadow 0.3s ease;
        }
      `}
      </style>

      <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3 animate-slide-down">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg animate-float">
              <div className="h-6 w-6 rounded-full bg-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">SoulFun</span>
          </div>

          <div className="hidden items-center space-x-4 rounded-full bg-gradient-to-r from-green-700 to-green-600 px-6 py-2 text-white md:flex shadow-lg animate-slide-down hover:shadow-xl transition-all duration-300">
            <span className="font-semibold banner-item">FIRST SUBSCRIPTION</span>
            <div className="rounded-full bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-1 shadow-md animate-pulse-scale">
              <span className="font-bold banner-item">up to 75% off</span>
            </div>
            <div className="flex space-x-2 font-mono text-sm">
              <span className="rounded bg-black/20 px-2 py-1 backdrop-blur-sm banner-item">
                {formatUnit(timeLeft.hours)}
              </span>
              <span>:</span>
              <span className="rounded bg-black/20 px-2 py-1 backdrop-blur-sm banner-item">
                {formatUnit(timeLeft.minutes)}
              </span>
              <span>:</span>
              <span className="rounded bg-black/20 px-2 py-1 backdrop-blur-sm banner-item">
                {formatUnit(timeLeft.seconds)}
              </span>
            </div>
            <button className="rounded-full p-1 hover:bg-white/20 transition-all duration-200 hover:scale-110">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onMouseEnter={() => setHoverGetPro(true)}
              onMouseLeave={() => setHoverGetPro(false)}
              className={`relative rounded-lg px-6 py-2 font-medium text-white overflow-hidden group transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-500 ${hoverGetPro ? 'shadow-lg shadow-blue-400 scale-105' : 'shadow-md hover:shadow-lg'}`}
            >
              <span className="relative z-10">Get Pro</span>
              <div className={`absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 opacity-0 transition-all duration-300 ${hoverGetPro ? 'opacity-100' : ''}`} />
            </button>
            {loading ? (
              <div className="flex items-center space-x-3">
                <div className="h-9 w-24 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-9 w-24 rounded-full bg-blue-200/60 animate-pulse hidden sm:block" />
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse sm:hidden" />
              </div>
            ) : !user ? (
              <>
                <button
                  className="hidden rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900 hover:bg-gray-50 sm:inline-block animate-slide-in"
                  onClick={() => openModal('login')}
                >
                  Log in
                </button>
                <button
                  className="hidden rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 sm:inline-block animate-slide-in"
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
            <button className="rounded-full p-2 text-gray-700 hover:bg-gray-100 transition-all duration-200 hover:scale-110">
              <Menu size={24} />
            </button>
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