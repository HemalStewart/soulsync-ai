'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import AppMobileNav from './AppMobileNav';
import AuthModalBoundary from '@/components/auth/AuthModalBoundary';

export type ActiveTab = 'discover' | 'chats' | 'create' | 'video' | 'generate';

interface AppLayoutProps {
  activeTab: ActiveTab;
  children: ReactNode;
}

const KEYBOARD_VISUAL_THRESHOLD = 140;

const AppLayout = ({ activeTab, children }: AppLayoutProps) => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const viewport = window.visualViewport ?? null;

    const handleViewportChange = () => {
      if (!viewport) {
        return;
      }

      const heightDiff = window.innerHeight - viewport.height;
      setKeyboardVisible(heightDiff > KEYBOARD_VISUAL_THRESHOLD);
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tagName = target.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.isContentEditable
      ) {
        setKeyboardVisible(true);
      }
    };

    const handleFocusOut = () => {
      setKeyboardVisible(false);
    };

    if (viewport) {
      handleViewportChange();
      viewport.addEventListener('resize', handleViewportChange);
      viewport.addEventListener('scroll', handleViewportChange);
    } else {
      window.addEventListener('focusin', handleFocusIn);
      window.addEventListener('focusout', handleFocusOut);
    }

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', handleViewportChange);
        viewport.removeEventListener('scroll', handleViewportChange);
      } else {
        window.removeEventListener('focusin', handleFocusIn);
        window.removeEventListener('focusout', handleFocusOut);
      }
    };
  }, []);

  const mainPaddingClass = useMemo(() => {
    return keyboardVisible
      ? 'pb-[calc(env(safe-area-inset-bottom,0px)+16px)]'
      : 'pb-[calc(env(safe-area-inset-bottom,0px)+80px)]';
  }, [keyboardVisible]);

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <AppHeader />
      <div className="flex h-[calc(100dvh-80px)] min-h-0">
        <AppSidebar activeTab={activeTab} />
        <main
          className={`flex min-h-0 flex-1 flex-col overflow-hidden lg:overflow-y-auto lg:pb-0 ${mainPaddingClass}`}
        >
          {children}
        </main>
      </div>
      {!keyboardVisible && <AppMobileNav activeTab={activeTab} />}
      <AuthModalBoundary />
    </div>
  );
};

export default AppLayout;
