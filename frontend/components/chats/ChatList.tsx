'use client';
import Image from 'next/image';
import { User } from 'lucide-react';
import { ChatSummary } from '@/lib/types';

interface ChatListProps {
  chats: ChatSummary[];
  selectedChat: string | null;
  onSelect: (slug: string) => void;
  loading?: boolean;
  fullWidth?: boolean;
}

const SkeletonItem = () => (
  <div className="flex animate-pulse items-center space-x-2.5 sm:space-x-3 border-b p-3 sm:p-4">
    <div className="h-11 sm:h-12 md:h-14 w-11 sm:w-12 md:w-14 flex-shrink-0 rounded-xl bg-gray-200" />
    <div className="flex-1 space-y-2 min-w-0">
      <div className="h-3 w-20 sm:w-24 rounded bg-gray-200" />
      <div className="h-2.5 w-28 sm:w-32 rounded bg-gray-100" />
    </div>
  </div>
);

const ChatList = ({ chats, selectedChat, onSelect, loading, fullWidth }: ChatListProps) => (
  <div
    className={`flex flex-col bg-white ${
      fullWidth 
        ? 'w-full border-b border-gray-200 lg:w-80 lg:border-b-0 lg:border-r' 
        : 'w-full sm:w-72 md:w-80 border-r'
    }`}
  >
    {/* Header */}
    <div className="border-b p-3 sm:p-4">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Chats</h2>
    </div>

    {/* Chat List */}
    <div className="flex-1 overflow-y-auto">
      {loading && !chats.length ? (
        <>
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonItem key={index} />
          ))}
        </>
      ) : chats.length ? (
        chats.map((chat) => {
          const avatar = chat.character_avatar?.trim() ?? '';
          return (
            <button
              key={chat.character_slug}
              onClick={() => onSelect(chat.character_slug)}
              className={`flex w-full items-center space-x-2.5 sm:space-x-3 border-b p-3 sm:p-4 text-left transition-all duration-200 ${
                selectedChat === chat.character_slug
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : 'hover:bg-gray-50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="relative h-11 sm:h-12 md:h-14 w-11 sm:w-12 md:w-14 flex-shrink-0">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={chat.character_name}
                    fill
                    sizes="(max-width: 640px) 44px, (max-width: 768px) 48px, 56px"
                    className="rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
                    <User className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate mb-0.5">
                  {chat.character_name}
                </h3>
                <p className="truncate text-xs sm:text-sm text-gray-500">
                  {chat.sender === 'ai' ? '' : 'You: '}
                  {chat.message}
                </p>
              </div>
            </button>
          );
        })
      ) : (
        <div className="p-4 sm:p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 sm:h-14 w-12 sm:w-14 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 sm:h-7 w-6 sm:w-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            No chats yet. Start a conversation from the Discover page.
          </p>
        </div>
      )}
    </div>
  </div>
);

export default ChatList;
