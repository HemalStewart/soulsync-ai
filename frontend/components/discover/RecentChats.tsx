'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { ChatSummary } from '@/lib/types';

interface RecentChatsProps {
  chats: ChatSummary[];
  onChatSelect: (slug: string) => void;
  loading?: boolean;
  isAuthenticated: boolean;
  error?: string | null;
  onViewAll?: () => void;
}

const RecentChats = ({
  chats,
  onChatSelect,
  loading = false,
  isAuthenticated,
  error,
  onViewAll,
}: RecentChatsProps) => {
  const visibleChats = chats.slice(0, 7);
  const hasMore = chats.length > visibleChats.length;

  return (
    <>
      <style>{`
        /* ... (all other keyframes and styles remain the same) ... */

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0%, 100% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.6s ease-out;
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }

        .skeleton-loader {
          background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out;
        }

        .chat-item {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .chat-item:hover {
          transform: translateY(-8px) scale(1.05);
        }

        .avatar-ring {
          transition: all 0.3s ease;
        }

        .chat-item:hover .avatar-ring {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3), 0 8px 20px rgba(59, 130, 246, 0.2);
        }

        .view-all-button {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        /* MODIFICATION 1: Removed box-shadow from the wrapper's hover state */
        .view-all-button:hover {
          transform: translateY(-8px) scale(1.05);
        }

        /* MODIFICATION 2: Added this new rule to target the inner circle on hover */
        .view-all-button:hover .view-all-circle {
           box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .error-banner {
          animation: slideUp 0.5s ease-out;
        }

        .empty-state {
          animation: fadeIn 0.6s ease-out;
        }

        .chat-items-container {
          overflow: visible;
        }

        .chat-item-wrapper {
          display: flex;
          flex-shrink: 0;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: rgb(31, 41, 55);
          min-height: 130px;
          z-index: 10;
        }

        .chat-item-wrapper:hover {
          z-index: 20;
        }
      `}</style>
      
      {/* ... (rest of the component up to the "View all" button) ... */}

      <div className="mx-auto mb-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 animate-slide-in-left">
            Recent Chats
          </h2>
          {hasMore && onViewAll && (
            <button
              onClick={onViewAll}
              className="hidden items-center space-x-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 md:flex animate-slide-in-right shadow-sm hover:shadow-md"
            >
              <span>View all chats</span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-xs font-bold text-white shadow-md">
                {chats.length - visibleChats.length}
              </span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 animate-slide-up rounded-lg bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 text-sm text-red-700 border border-red-200 shadow-sm error-banner">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex space-x-4 overflow-x-auto overflow-y-visible pb-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex h-[130px] w-[90px] flex-shrink-0 flex-col items-center justify-center space-y-3 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 skeleton-loader" />
                <div className="h-3 w-16 rounded bg-gradient-to-r from-gray-200 to-gray-300 skeleton-loader" />
              </div>
            ))}
          </div>
        ) : visibleChats.length ? (
          <div className="chat-items-container flex space-x-4 overflow-x-auto overflow-y-visible pb-4 pr-2">
            {visibleChats.map((chat, index) => {
              const avatar = chat.character_avatar?.trim() ?? '';

              return (
                <div
                  key={chat.character_slug}
                  className="chat-item-wrapper chat-item animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    onClick={() => onChatSelect(chat.character_slug)}
                    className="flex flex-col items-center space-y-2 text-gray-800 w-full"
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white shadow-lg avatar-ring flex-shrink-0">
                      {avatar ? (
                        <Image
                          src={avatar}
                          alt={chat.character_name}
                          fill
                          sizes="80px"
                          className="h-full w-full rounded-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 transition-transform duration-300 hover:scale-110">
                          <User className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="max-w-[100px] truncate text-xs font-semibold text-gray-900 transition-all duration-300">
                      {chat.character_name}
                    </p>
                  </button>
                </div>
              );
            })}
            {hasMore && onViewAll && (
              <div
                className="chat-item-wrapper view-all-button animate-scale-in"
                style={{ animationDelay: `${visibleChats.length * 0.05}s` }}
              >
                <button
                  onClick={onViewAll}
                  className="flex flex-col items-center justify-center space-y-2 text-gray-500 w-full"
                >
                  {/* MODIFICATION 3: Added the new 'view-all-circle' class here */}
                  <div className="view-all-circle flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 text-lg font-semibold text-gray-600 transition-all duration-300 hover:border-blue-400 hover:bg-blue-50 shadow-sm flex-shrink-0">
                    +{chats.length - visibleChats.length}
                  </div>
                  <span className="text-xs font-semibold transition-all duration-300">View all</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center shadow-sm empty-state hover:shadow-md transition-shadow duration-300">
            <p className="text-sm text-gray-600">
              {isAuthenticated
                ? 'You have no recent chats yet. Start a conversation from the Discover section.'
                : 'Log in to see your recent chats and continue conversations.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default RecentChats;
