'use client';

import Image from 'next/image';
import { ChatSummary } from '@/lib/types';

interface ChatListProps {
  chats: ChatSummary[];
  selectedChat: string | null;
  onSelect: (slug: string) => void;
  loading?: boolean;
  fullWidth?: boolean;
}

const SkeletonItem = () => (
  <div className="flex animate-pulse items-center space-x-3 border-b p-4">
    <div className="h-14 w-14 flex-shrink-0 rounded-full bg-gray-200" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-24 rounded bg-gray-200" />
      <div className="h-3 w-32 rounded bg-gray-100" />
    </div>
  </div>
);

const ChatList = ({ chats, selectedChat, onSelect, loading, fullWidth }: ChatListProps) => (
  <div
    className={`flex flex-col bg-white ${
      fullWidth ? 'w-full border-b border-slate-200 lg:w-80 lg:border-b-0 lg:border-r' : 'w-80 border-r'
    }`}
  >
    <div className="border-b p-4">
      <h2 className="text-2xl font-bold text-gray-900">Chats</h2>
    </div>
    <div className="flex-1 overflow-y-auto">
      {loading && !chats.length ? (
        <>
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonItem key={index} />
          ))}
        </>
      ) : chats.length ? (
        chats.map((chat) => (
          <button
            key={chat.character_slug}
            onClick={() => onSelect(chat.character_slug)}
            className={`flex w-full items-center space-x-3 border-b p-4 text-left transition ${
              selectedChat === chat.character_slug
                ? 'bg-blue-50'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="relative h-14 w-14 flex-shrink-0">
              <Image
                src={
                  chat.character_avatar ||
                  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop'
                }
                alt={chat.character_name}
                fill
                sizes="56px"
                className="rounded-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900">
                {chat.character_name}
              </h3>
              <p className="truncate text-sm text-gray-500">
                {chat.sender === 'ai' ? '' : 'You: '}
                {chat.message}
              </p>
            </div>
          </button>
        ))
      ) : (
        <div className="p-4 text-sm text-gray-500">
          No chats yet. Start a conversation from the Discover page.
        </div>
      )}
    </div>
  </div>
);

export default ChatList;
