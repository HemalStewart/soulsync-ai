'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Grid2X2,
  MessageCircle,
  Sparkles,
  Video,
  ImagePlus,
} from 'lucide-react';
import type { ActiveTab } from './AppLayout';

interface AppMobileNavProps {
  activeTab: ActiveTab;
}

const AppMobileNav = ({ activeTab }: AppMobileNavProps) => {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const items = useMemo(
    () => [
      { id: 'discover' as const, label: 'Discover', href: '/', icon: Grid2X2 },
      { id: 'chats' as const, label: 'Chats', href: '/chats', icon: MessageCircle },
      { id: 'create' as const, label: 'Create', href: '/create', icon: Sparkles },
      { id: 'video' as const, label: 'Video', href: '/video', icon: Video, badge: 'Hot' },
      { id: 'generate' as const, label: 'Generate', href: '/generate', icon: ImagePlus },
    ],
    []
  );

  const activeTileClasses =
    'w-11 h-11 rounded-xl flex items-center justify-center brand-gradient text-white shadow-brand';
  const inactiveTileClasses =
    'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-brand-tint hover:shadow-sm';

  return (
    <>
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes bounce-icon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .animate-slide-in-up {
          animation: slideInUp 0.5s ease-out;
        }

        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }

        .animate-bounce-icon {
          animation: bounce-icon 0.6s ease-in-out;
        }

        nav a {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        nav a:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/30 bg-white/80 backdrop-blur-xl shadow-[0_-4px_18px_rgba(79,70,229,0.15)] lg:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 pt-2">
          {items.map(({ id, label, href, icon: Icon, badge }, index) => {
            const isActive = activeTab === id;

            return (
              <Link
                key={id}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1.5 text-xs font-semibold transition-all duration-300 animate-slide-in-up ${
                  isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                }`}
                onMouseEnter={() => setHoveredIcon(id)}
                onMouseLeave={() => setHoveredIcon(null)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="relative w-11">
                  {badge && (
                    <div
                      className={`absolute -top-2 -right-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold shadow-lg transition-all duration-300 z-10 ${
                        hoveredIcon === id ? 'scale-110 animate-pulse-soft' : 'scale-100'
                      }`}
                    >
                      {badge}
                    </div>
                  )}
                  <div
                    className={`${isActive ? activeTileClasses : inactiveTileClasses} ${
                      hoveredIcon === id && !isActive ? 'animate-bounce-icon' : ''
                    } ${isActive ? 'animate-pulse-soft' : ''}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isActive ? 'text-white' : 'text-gray-700'
                      }`}
                    />
                  </div>
                </div>
                <span
                  className={`transition-all duration-300 ${
                    isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default AppMobileNav;
