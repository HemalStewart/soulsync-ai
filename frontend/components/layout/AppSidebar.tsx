'use client';

import Link from 'next/link';
import { MessageCircle, Video, Sparkles, ImagePlus, Download } from 'lucide-react';
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
    'w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 shadow-md';
  const inactiveTileClasses =
    'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-100';

  const square = (active: boolean) =>
    `w-2 h-2 rounded-sm transition-all duration-300 ${active ? 'bg-white scale-110' : 'bg-gray-500'}`;

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
          50% { transform: scale(1.05); }
        }

        @keyframes bounce-icon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
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

        .animate-glow {
          animation: glow 2s infinite;
        }

        nav a, nav button {
          transition: all 0.3s ease;
        }

        nav button:hover, nav a:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <aside className="hidden lg:flex w-20 flex-col bg-white border-r shadow-sm h-full min-h-[calc(100vh-80px)]">
        <nav className="flex h-full flex-col items-center space-y-8 pt-8 pb-2">
          <Link
            href="/"
            className={`flex flex-col items-center space-y-1 animate-slide-in-left ${isActive('discover')}`}
            onMouseEnter={() => setHoveredIcon('discover')}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <div className={`${activeTab === 'discover' ? activeTileClasses : inactiveTileClasses} ${activeTab === 'discover' ? 'animate-pulse-soft' : ''}`}>
              <div className="grid grid-cols-2 gap-1">
                <div className={square(activeTab === 'discover')}></div>
                <div className={square(activeTab === 'discover')}></div>
                <div className={square(activeTab === 'discover')}></div>
                <div className={square(activeTab === 'discover')}></div>
              </div>
            </div>
            <span className="text-xs font-medium transition-all duration-300">Discover</span>
          </Link>

          <Link
            href="/chats"
            className={`flex flex-col items-center space-y-1 animate-slide-in-left ${isActive('chats')}`}
            onMouseEnter={() => setHoveredIcon('chats')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{ animationDelay: '0.1s' }}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${activeTab === 'chats' ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-md' : 'hover:bg-gray-100'} ${hoveredIcon === 'chats' ? 'animate-bounce-icon' : ''}`}>
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-xs transition-all duration-300">Chats</span>
          </Link>

          <Link
            href="/create"
            className={`flex flex-col items-center space-y-1 animate-slide-in-left ${isActive('create')}`}
            onMouseEnter={() => setHoveredIcon('create')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{ animationDelay: '0.2s' }}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                activeTab === 'create'
                  ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-md'
                  : 'hover:bg-gray-100'
              } ${hoveredIcon === 'create' ? 'animate-bounce-icon' : ''}`}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xs transition-all duration-300">Create</span>
          </Link>

          <Link
            href="/video"
            className={`flex flex-col items-center space-y-1 text-gray-500 hover:text-gray-900 relative transition-all duration-300 animate-slide-in-left ${isActive('video')}`}
            onMouseEnter={() => setHoveredIcon('video')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{ animationDelay: '0.3s' }}
          >
            <div className="relative w-10 h-10">
              <div className={`absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-1.5 rounded-full font-semibold shadow-md transition-all duration-300 z-10 ${hoveredIcon === 'video' ? 'scale-110 animate-pulse-soft' : 'scale-100'}`}>
                Hot
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'video'
                    ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-md'
                    : 'hover:bg-gray-100'
                } ${hoveredIcon === 'video' ? 'animate-bounce-icon' : ''}`}
              >
                <Video className="w-6 h-6" />
              </div>
            </div>
            <span className="text-xs transition-all duration-300">Video</span>
          </Link>

          <Link
            href="/generate"
            className={`flex flex-col items-center space-y-1 text-gray-500 hover:text-gray-900 transition-all duration-300 animate-slide-in-left ${isActive('generate')}`}
            onMouseEnter={() => setHoveredIcon('generate')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{ animationDelay: '0.4s' }}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                activeTab === 'generate'
                  ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-md'
                  : 'hover:bg-gray-100'
              } ${hoveredIcon === 'generate' ? 'animate-bounce-icon' : ''}`}
            >
              <ImagePlus className="w-6 h-6" />
            </div>
            <span className="text-xs transition-all duration-300">Generate</span>
          </Link>

          <button 
            className="flex flex-col items-center space-y-1 text-gray-500 hover:text-gray-900 transition-all duration-300 animate-slide-in-left"
            onMouseEnter={() => setHoveredIcon('download')}
            onMouseLeave={() => setHoveredIcon(null)}
            style={{ animationDelay: '0.5s' }}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all duration-300 ${hoveredIcon === 'download' ? 'animate-bounce-icon' : ''}`}>
              <Download className="w-6 h-6" />
            </div>
            <span className="text-xs">Download</span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default AppSidebar;
