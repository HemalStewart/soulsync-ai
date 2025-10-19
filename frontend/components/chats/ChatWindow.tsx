'use client';

import Image from 'next/image';
import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/lib/types';
import { MoreVertical, Phone, Video, Send, ChevronLeft, User, PanelRightOpen, PanelRightClose } from 'lucide-react';
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
  onToggleInfoPanel?: () => void;
  showInfoPanel?: boolean;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-end justify-start gap-2">
      <div className="h-32 sm:h-40 w-60 sm:w-80 animate-pulse rounded-3xl bg-gray-200" />
    </div>
    <div className="flex items-end justify-end gap-2">
      <div className="h-12 sm:h-16 w-48 sm:w-64 animate-pulse rounded-3xl bg-gray-300" />
    </div>
    <div className="flex items-end justify-start gap-2">
      <div className="h-16 sm:h-24 w-56 sm:w-72 animate-pulse rounded-3xl bg-gray-200" />
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
  onToggleInfoPanel,
  showInfoPanel = true,
}: ChatWindowProps) => {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const previousMessagesLengthRef = useRef(messages.length);

  // Check if user is near bottom of scroll
  const checkIfNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // If within 100px of bottom, enable auto-scroll
    return distanceFromBottom < 100;
  };

  // Handle manual scroll
  const handleScroll = () => {
    setShouldAutoScroll(checkIfNearBottom());
  };

  // Scroll helper to ensure we target the chat container instead of the page
  const scrollToBottom = (smooth = true) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    try {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } catch {
      container.scrollTop = container.scrollHeight;
    }
  };

  // Auto-scroll only when new messages arrive AND user is near bottom
  useEffect(() => {
    // Only scroll if:
    // 1. New messages were added
    // 2. User is near bottom (shouldAutoScroll is true)
    // 3. Component is sending a message
    const messagesChanged = messages.length !== previousMessagesLengthRef.current;
    
    if (messagesChanged && (shouldAutoScroll || isSending)) {
      scrollToBottom();
    }

    previousMessagesLengthRef.current = messages.length;
  }, [messages, shouldAutoScroll, isSending]);

  // Reset auto-scroll when loading new chat
  useEffect(() => {
    setShouldAutoScroll(true);
  }, [characterName]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onMessageInputChange(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
      setShouldAutoScroll(true); // Enable auto-scroll when sending
    }
  };

  const handleCopyMessage = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const avatar = characterAvatar?.trim() ?? '';

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-white">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between border-b bg-white px-3 sm:px-4 py-3 shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-full border border-gray-200 p-1.5 sm:p-2 text-gray-700 transition hover:bg-gray-100 lg:hidden flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
          {headerLoading ? (
            <>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
              <div className="h-4 w-20 sm:w-24 rounded bg-gray-200 animate-pulse" />
            </>
          ) : (
            <>
              <div className="relative h-9 w-9 sm:h-10 sm:w-10 group flex-shrink-0">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={characterName}
                    fill
                    sizes="(max-width: 640px) 36px, 40px"
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
                    <User className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-white bg-green-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">{characterName}</h2>
                <p className="text-[10px] sm:text-xs text-green-600">Active now</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center space-x-0.5 sm:space-x-1 flex-shrink-0">
          <button className="rounded-full p-1.5 sm:p-2 text-gray-700 transition-all hover:bg-gray-100" title="Call">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button className="rounded-full p-1.5 sm:p-2 text-gray-700 transition-all hover:bg-gray-100" title="Video call">
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          {onToggleInfoPanel && (
            <button 
              onClick={onToggleInfoPanel}
              className="rounded-full p-1.5 sm:p-2 text-gray-700 transition-all hover:bg-gray-100"
              title={showInfoPanel ? 'Hide details' : 'Show details'}
            >
              {showInfoPanel ? (
                <PanelRightClose className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <PanelRightOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          )}
          <button className="hidden sm:block rounded-full p-1.5 sm:p-2 text-gray-700 transition-all hover:bg-gray-100" title="More options">
            <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* Info Banner - Fixed */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-3 sm:px-4 py-2 sm:py-2.5 text-center text-xs sm:text-sm text-gray-700 flex-shrink-0">
        Mention: The chat memories of free users are preserved for only 30 days.{' '}
        <button className="font-semibold text-blue-600 transition-all duration-200 hover:text-blue-700 hover:underline">
          Get PRO
        </button>
      </div>

      {/* Messages Area - Scrollable */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 px-2 sm:px-4 py-4 sm:py-6"
      >
        <div className="space-y-4">
          {isLoading ? (
            <MessageSkeleton />
          ) : messages.length === 0 ? (
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
                      className="relative max-w-xs sm:max-w-md lg:max-w-2xl cursor-pointer rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4 text-white text-sm sm:text-base shadow-md transition-shadow duration-300 hover:shadow-xl"
                    >
                      {message.message.split('\n').map((line, lineIndex) => (
                        <p key={`${lineIndex}-${line}`} className="my-1 whitespace-pre-wrap">
                          {line}
                        </p>
                      ))}
                      <div className="absolute bottom-2 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-70">
                        <span className="text-xs text-blue-50">
                          {copiedMessageIndex === index ? 'Copied!' : 'Click to copy'}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex-shrink-0">
                      {formatTimestamp(message.created_at)}
                    </div>
                  </div>
                ) : (
                  <div className="group flex items-end justify-end gap-2">
                    <div className="text-xs text-gray-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex-shrink-0">
                      {formatTimestamp(message.created_at)}
                    </div>
                    <div className="max-w-xs sm:max-w-md lg:max-w-md rounded-2xl sm:rounded-3xl bg-blue-100 px-4 sm:px-6 py-3 sm:py-4 text-gray-900 text-sm sm:text-base shadow-md transition-shadow duration-300 hover:shadow-xl">
                      {message.message}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {isSending && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="group flex items-end justify-start gap-2">
                <div className="relative max-w-xs sm:max-w-md lg:max-w-2xl rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4 text-white shadow-md">
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/90 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/90 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/90 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
                <div className="sr-only">Companion is typing</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t bg-white px-3 sm:px-4 py-3 sm:py-4 shadow-lg flex-shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="Start a message..."
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              className={`w-full rounded-full bg-gray-100 px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-900 placeholder-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white ${
                isInputFocused ? 'shadow-md' : ''
              }`}
              disabled={isSending}
            />
            {messageInput && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 animate-in fade-in duration-300 pointer-events-none">
                Press Enter
              </div>
            )}
          </div>
          <button
            className={`rounded-full bg-gradient-to-r from-blue-600 to-blue-700 p-2.5 sm:p-3 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:from-blue-300 disabled:to-blue-300 disabled:shadow-none flex-shrink-0 ${
              messageInput.trim() ? 'animate-in zoom-in duration-200' : ''
            }`}
            onClick={() => {
              onSend();
              setShouldAutoScroll(true); // Enable auto-scroll when sending
            }}
            disabled={!messageInput.trim() || isSending}
          >
            <Send size={18} className={`sm:w-5 sm:h-5 ${isSending ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
