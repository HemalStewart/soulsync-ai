'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Home,
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
  const items = useMemo(
    () => [
      { id: 'discover' as const, label: 'Discover', href: '/', icon: Home },
      { id: 'chats' as const, label: 'Chats', href: '/chats', icon: MessageCircle },
      { id: 'create' as const, label: 'Create', href: '/create', icon: Sparkles },
      { id: 'video' as const, label: 'Video', href: '/video', icon: Video },
      { id: 'generate' as const, label: 'Generate', href: '/generate', icon: ImagePlus },
    ],
    []
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg shadow-[0_-4px_12px_rgba(15,23,42,0.08)] lg:hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 pt-2">
        {items.map(({ id, label, href, icon: Icon }) => {
          const isActive = activeTab === id;

          return (
            <Link
              key={id}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 text-xs font-medium transition ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  isActive
                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AppMobileNav;
