import { ReactNode } from 'react';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import AppMobileNav from './AppMobileNav';

export type ActiveTab = 'discover' | 'chats' | 'create' | 'video' | 'generate';

interface AppLayoutProps {
  activeTab: ActiveTab;
  children: ReactNode;
}

const AppLayout = ({ activeTab, children }: AppLayoutProps) => (
  <div className="min-h-screen bg-gray-50">
    <AppHeader />
    <div className="flex h-[calc(100vh-80px)] min-h-0">
      <AppSidebar activeTab={activeTab} />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-24 lg:pb-0">
        {children}
      </main>
    </div>
    <AppMobileNav activeTab={activeTab} />
  </div>
);

export default AppLayout;