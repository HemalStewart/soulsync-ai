'use client';

import Image from 'next/image';
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/lib/types';
import { MoreVertical, Phone, Video, Send, ChevronLeft, User } from 'lucide-react';
import ChatEmptyState from './ChatEmptyState';

interface ChatWindowProps {
  characterName: string;
  characterAvatar: string | null;
  messages: ChatMessage[];
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  isSending?: boolean;
  headerLoading?: boolean;
  onBack?: () => void;
  coinCost?: number;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? '' // Return empty string for invalid dates
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- NEW COMPONENT: MessageSkeleton for a better loading experience ---
const MessageSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-end justify-start gap-2">
      <div className="h-40 w-80 animate-pulse rounded-3xl bg-gray-200" />
    </div>
    <div className="flex items-end justify-end gap-2">
      <div className="h-16 w-64 animate-pulse rounded-3xl bg-gray-300" />
    </div>
    <div className="flex items-end justify-start gap-2">
      <div className="h-24 w-72 animate-pulse rounded-3xl bg-gray-200" />
    </div>
  </div>
);

const ChatWindow = ({
  characterName,
  characterAvatar,
  messages,
  messageInput,
  onMessageInputChange,
  onSend,
  isLoading,
  isSending,
  headerLoading = false,
  onBack,
  coinCost,
}: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!messagesEndRef.current) {
      return;
    }

    try {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } catch {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [messages, isLoading]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onMessageInputChange(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  const handleCopyMessage = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const avatar = characterAvatar?.trim() ?? '';

  return (
    <div className="flex flex-1 flex-col">
      {/* Header with subtle animation */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:px-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-full border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 lg:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {headerLoading ? (
            <>
              <div className="h-11 w-11 rounded-full bg-gray-200 animate-pulse sm:h-12 sm:w-12" />
              <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
            </>
          ) : (
            <>
              <div className="relative h-11 w-11 group sm:h-12 sm:w-12">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={characterName}
                    fill
                    sizes="48px"
                    className="rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 transition-transform duration-300 group-hover:scale-105">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500 animate-pulse" />
              </div>
              <div className="transition-transform duration-300 hover:translate-x-1">
                <h2 className="text-xl font-bold text-gray-900">{characterName}</h2>
                <p className="text-xs text-green-600">Active now</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button className="rounded-full p-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:scale-110 active:scale-95">
            <Phone size={24} />
          </button>
          <button className="rounded-full p-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:scale-110 active:scale-95">
            <Video size={24} />
          </button>
          <button className="rounded-full p-2 text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:scale-110 active:scale-95">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 text-center text-sm text-gray-700 animate-in slide-in-from-top duration-500 sm:px-6">
        Mention: The chat memories of free users are preserved for only 30 days.{' '}
        <button className="font-semibold text-blue-600 transition-all duration-200 hover:text-blue-700 hover:underline">
          Get PRO
        </button>
      </div>

      {/* Messages area with staggered animations */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-6 sm:px-6">
        {/* --- MODIFICATION: CORRECTED LOGIC --- */}
        {isLoading ? (
          <MessageSkeleton />
        ) : (
          messages.length === 0 ? (
            <ChatEmptyState />
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.created_at}-${index}`}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {message.sender === 'ai' ? (
                  <div className="group flex items-end justify-start gap-2">
                    <div
                      onClick={() => handleCopyMessage(message.message, index)}
                      className="relative max-w-2xl cursor-pointer rounded-3xl bg-gradient-to-br from-cyan-400 to-cyan-500 px-6 py-4 text-black shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                    >
                      {message.message.split('\n').map((line, lineIndex) => (
                        <p key={`${lineIndex}-${line}`} className="my-1 whitespace-pre-wrap">
                          {line}
                        </p>
                      ))}
                      <div className="absolute bottom-2 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-70">
                        <span className="text-xs text-cyan-900">
                          {copiedMessageIndex === index ? 'Copied!' : 'Click to copy'}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {formatTimestamp(message.created_at)}
                    </div>
                  </div>
                ) : (
                  <div className="group flex items-end justify-end gap-2">
                    <div className="text-xs text-gray-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {formatTimestamp(message.created_at)}
                    </div>
                    <div className="max-w-md rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 px-6 py-3 text-gray-900 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                      {message.message}
                    </div>
                  </div>
                )}
              </div>
            ))
          )
        )}

        {isSending && (
          <div className="flex justify-end animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="max-w-md rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 px-6 py-3 text-gray-900 shadow-md">
              <div className="flex space-x-2">
                <div className="h-2 w-2 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-white px-6 py-4 shadow-lg transition-shadow duration-300">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Start a message..."
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              className={`w-full rounded-full bg-gray-100 px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                isInputFocused ? 'shadow-md' : ''
              }`}
              disabled={isSending}
            />
            {messageInput && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-in fade-in duration-300">
                Press Enter
              </div>
            )}
          </div>
          <button
            className={`rounded-full bg-gradient-to-r from-blue-600 to-blue-700 p-3 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-300 disabled:shadow-none ${
              messageInput.trim() ? 'animate-in zoom-in duration-200' : ''
            }`}
            onClick={onSend}
            disabled={!messageInput.trim() || isSending}
          >
            <Send size={20} className={isSending ? 'animate-pulse' : ''} />
          </button>
        </div>
        {/* {coinCost !== undefined && (
          <p className="mt-3 text-center text-xs font-medium text-blue-600/70">
            Costs {coinCost} SoulCoin{coinCost === 1 ? '' : 's'} per message
          </p>
        )} */}
      </div>
    </div>
  );
};

export default ChatWindow;
