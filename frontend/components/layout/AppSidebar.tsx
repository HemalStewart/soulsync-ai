'use client';

import Link from 'next/link';
import { MessageCircle, Video, Sparkles, ImagePlus, Download, Grid2X2 } from 'lucide-react';
import { useState } from 'react';
import type { ActiveTab } from './AppLayout';

interface AppSidebarProps {
  activeTab: ActiveTab;
}

const AppSidebar = ({ activeTab }: AppSidebarProps) => {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  const isActive = (tab: ActiveTab) =>
    tab === activeTab ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900';

  const activeTileClasses =
    'w-11 h-11 rounded-xl flex items-center justify-center brand-gradient text-white shadow-brand';
  const inactiveTileClasses =
    'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-brand-tint hover:shadow-sm';

  return (
    <>
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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

        @keyframes shimmer {
          0%, 100% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.5s ease-out;
        }

        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }

        .animate-bounce-icon {
          animation: bounce-icon 0.6s ease-in-out;
        }

        nav a, nav button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        nav button:hover, nav a:hover {
          transform: translateY(-3px);
        }
      `}</style>

      <aside className="hidden lg:flex w-24 flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/60 shadow-sm h-full min-h-[calc(100vh-80px)]">
        <nav className="flex h-full flex-col items-center space-y-6 pt-10 pb-6">
          <Link
            href="/"
            className={`flex flex-col items-center space-y-2 animate-slide-in-left ${isActive('discover')}`}
            onMouseEnter={() => setHoveredIcon('discover')}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <div className={`${activeTab === 'discover' ? activeTileClasses : inactiveTileClasses} ${activeTab === 'discover' ? 'animate-pulse-soft' : ''}`}>
              <Grid2X2 className={`w-5 h-5 ${activeTab === 'discover' ? 'text-white' : 'text-gray-700'}`} />
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${activeTab === 'discover' ? 'text-gray-900' : 'text-gray-500'}`}>Discover</span>
          </Link>

          <Link
            href="/chats"
            className={`flex flex-col items-center space-y-2 animate-slide-in-left ${isActive('chats')}`}
            onMouseEnter={() => setHoveredIcon('chats')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{ animationDelay: '0.1s' }}
          >
            <div className={`${activeTab === 'chats' ? activeTileClasses : inactiveTileClasses} ${hoveredIcon === 'chats' ? 'animate-bounce-icon' : ''}`}>
              <MessageCircle className={`w-5 h-5 ${activeTab === 'chats' ? 'text-white' : 'text-gray-700'}`} />
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${activeTab === 'chats' ? 'text-gray-900' : 'text-gray-500'}`}>Chats</span>
          </Link>

          <Link
            href="/create"
            className={`flex flex-col items-center space-y-2 animate-slide-in-left ${isActive('create')}`}
            onMouseEnter={() => setHoveredIcon('create')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{ animationDelay: '0.2s' }}
          >
            <div className={`${activeTab === 'create' ? activeTileClasses : inactiveTileClasses} ${hoveredIcon === 'create' ? 'animate-bounce-icon' : ''}`}>
              <Sparkles className={`w-5 h-5 ${activeTab === 'create' ? 'text-white' : 'text-gray-700'}`} />
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${activeTab === 'create' ? 'text-gray-900' : 'text-gray-500'}`}>Create</span>
          </Link>

          <Link
            href="/video"
            className={`flex flex-col items-center space-y-2 relative transition-all duration-300 animate-slide-in-left ${isActive('video')}`}
            onMouseEnter={() => setHoveredIcon('video')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{ animationDelay: '0.3s' }}
          >
            <div className="relative w-11">
              <div className={`absolute -top-3 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg transition-all duration-300 z-10 ${hoveredIcon === 'video' ? 'scale-110 animate-pulse-soft' : 'scale-100'}`}>
                Hot
              </div>
              <div className={`${activeTab === 'video' ? activeTileClasses : inactiveTileClasses} ${hoveredIcon === 'video' ? 'animate-bounce-icon' : ''}`}>
                <Video className={`w-5 h-5 ${activeTab === 'video' ? 'text-white' : 'text-gray-700'}`} />
              </div>
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${activeTab === 'video' ? 'text-gray-900' : 'text-gray-500'}`}>Video</span>
          </Link>

          <Link
            href="/generate"
            className={`flex flex-col items-center space-y-2 transition-all duration-300 animate-slide-in-left ${isActive('generate')}`}
            onMouseEnter={() => setHoveredIcon('generate')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{ animationDelay: '0.4s' }}
          >
            <div className={`${activeTab === 'generate' ? activeTileClasses : inactiveTileClasses} ${hoveredIcon === 'generate' ? 'animate-bounce-icon' : ''}`}>
              <ImagePlus className={`w-5 h-5 ${activeTab === 'generate' ? 'text-white' : 'text-gray-700'}`} />
            </div>
            <span className={`text-xs font-semibold transition-all duration-300 ${activeTab === 'generate' ? 'text-gray-900' : 'text-gray-500'}`}>Generate</span>
          </Link>

          <button 
            className="flex flex-col items-center space-y-2 text-gray-500 hover:text-gray-900 transition-all duration-300 animate-slide-in-left"
            onMouseEnter={() => setHoveredIcon('download')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{ animationDelay: '0.5s' }}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center hover:bg-gray-100/80 transition-all duration-300 ${hoveredIcon === 'download' ? 'animate-bounce-icon' : ''}`}>
              <Download className="w-5 h-5 text-gray-700" />
            </div>
            <span className="text-xs font-semibold text-gray-500">Download</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default AppSidebar;
