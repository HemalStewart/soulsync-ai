'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import ChatInfoPanel from './ChatInfoPanel';
import ChatEmptyState from './ChatEmptyState';
import {
  getCharacters,
  getChatSummaries,
  getCharacterChat,
  sendChatMessage,
} from '@/lib/api';
import {
  CharacterCard,
  CharacterChatDetail,
  ChatMessage,
  ChatSummary,
} from '@/lib/types';
import { useAuth } from '@/components/auth/AuthContext';

const ChatsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterParam = searchParams.get('character');
  const { user, loading: authLoading, openAuthModal } = useAuth();

  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [characters, setCharacters] = useState<Record<string, CharacterCard>>(
    {}
  );
  const [chatDetail, setChatDetail] = useState<CharacterChatDetail | null>(
    null
  );
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const defaultChatSlug = useMemo(
    () => chatSummaries[0]?.character_slug ?? null,
    [chatSummaries]
  );

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      setIsErrorVisible(true);
      const timer = setTimeout(() => {
        setIsErrorVisible(false);
        setTimeout(() => setErrorMessage(null), 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = typeof window !== 'undefined' && window.innerWidth < 1024;
      setIsMobileView(mobile);
      if (!mobile) {
        setShowMobileChat(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        if (isMounted) {
          setChatSummaries([]);
          setCharacters({});
          setLoadingChats(false);
        }
        return;
      }

      try {
        setLoadingChats(true);
        const [chats, characterCards] = await Promise.all([
          getChatSummaries(),
          getCharacters(),
        ]);

        if (!isMounted) return;

        const mappedCharacters = characterCards.reduce<Record<string, CharacterCard>>(
          (acc, character) => {
            acc[character.slug] = character;
            return acc;
          },
          {}
        );

        setChatSummaries(chats);
        setCharacters(mappedCharacters);
        setErrorMessage(null);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to load chats.'
        );
      } finally {
        if (isMounted) {
          setLoadingChats(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  useEffect(() => {
    const slug =
      characterParam ??
      selectedChat ??
      defaultChatSlug ??
      Object.keys(characters)[0] ??
      null;

    if (slug && slug !== selectedChat) {
      setSelectedChat(slug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterParam, defaultChatSlug, characters]);

  useEffect(() => {
    if (!user || !selectedChat) {
      setShowMobileChat(false);
      setChatDetail(null);
      return;
    }

    let isMounted = true;

    const loadChat = async () => {
      try {
        setLoadingMessages(true);
        const detail = await getCharacterChat(selectedChat);
        if (!isMounted) return;
        setChatDetail(detail);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load conversation.'
        );
      } finally {
        if (isMounted) {
          setLoadingMessages(false);
        }
      }
    };

    loadChat();

    return () => {
      isMounted = false;
    };
  }, [selectedChat, user]);

  const handleSelectChat = (slug: string) => {
    setSelectedChat(slug);
    const params = new URLSearchParams(searchParams.toString());
    params.set('character', slug);
    router.replace(`/chats?${params.toString()}`, { scroll: false });
    if (isMobileView) {
      setShowMobileChat(true);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedChat || !messageInput.trim()) {
      return;
    }

    try {
      setSending(true);
      const payload = await sendChatMessage(selectedChat, messageInput.trim());

      setChatDetail((previous) => {
        if (!previous) {
          return previous;
        }

        const messages: ChatMessage[] = [
          ...previous.messages,
          payload.userMessage,
          payload.aiMessage,
        ];

        return {
          ...previous,
          messages,
        };
      });
      setMessageInput('');

      // Refresh chat summaries to show latest message preview
      const refreshedSummaries = await getChatSummaries();
      setChatSummaries(refreshedSummaries);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to send message.'
      );
    } finally {
      setSending(false);
    }
  };

  const characterProfile =
    (selectedChat ? characters[selectedChat] : null) ?? null;
  const panelCharacter = chatDetail?.character;
  const headerLoading =
    loadingMessages || (!panelCharacter && !characterProfile);
  const resolvedName =
    panelCharacter?.name ?? characterProfile?.name ?? '';
  const resolvedAvatar =
    panelCharacter?.avatar ?? characterProfile?.avatar ?? null;

  if (authLoading) {
    return (
      <AppLayout activeTab="chats">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            <p className="text-sm font-medium text-gray-600 animate-pulse">Loading your chats…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout activeTab="chats">
        <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="animate-in fade-in zoom-in duration-500 rounded-2xl border border-gray-200 bg-white px-12 py-10 text-center shadow-xl transition-all hover:shadow-2xl hover:scale-105">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to continue</h2>
            <p className="text-sm text-gray-600">
              Log in or create an account to access this feature.
            </p>
            <button
              onClick={() => openAuthModal('login')}
              className="mt-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeTab="chats">
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* Error notification with slide animation */}
        {errorMessage && (
          <div
            className={`w-full border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-6 py-3 shadow-sm transition-all duration-300 ${
              isErrorVisible
                ? 'translate-y-0 opacity-100'
                : '-translate-y-full opacity-0'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-200 animate-pulse">
                  <svg
                    className="h-5 w-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-red-800">{errorMessage}</span>
              </div>
              <button
                onClick={() => {
                  setIsErrorVisible(false);
                  setTimeout(() => setErrorMessage(null), 300);
                }}
                className="rounded-full p-1 text-red-600 transition-all duration-200 hover:bg-red-200 hover:scale-110"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div className="flex flex-1 overflow-hidden">
          {/* Chat list with slide animation */}
          {(!isMobileView || !showMobileChat) && (
            <ChatList
              chats={chatSummaries}
              selectedChat={selectedChat}
              onSelect={handleSelectChat}
              loading={loadingChats}
              fullWidth={isMobileView}
            />
          )}
          
          {(!isMobileView || showMobileChat) && (
            <div className="flex flex-1 overflow-hidden">
              {selectedChat ? (
                <>
                  {/* Main chat window with fade animation */}
                  <ChatWindow
                    characterName={resolvedName}
                    characterAvatar={resolvedAvatar}
                    messages={chatDetail?.messages ?? []}
                    messageInput={messageInput}
                    onMessageInputChange={setMessageInput}
                    onSend={handleSendMessage}
                    isLoading={loadingMessages}
                    isSending={sending}
                    headerLoading={headerLoading}
                    onBack={isMobileView ? () => setShowMobileChat(false) : undefined}
                  />
                  
                  {/* Info panel with slide animation */}
                  {!isMobileView && (
                    <ChatInfoPanel
                      characterName={resolvedName || selectedChat}
                      characterAvatar={resolvedAvatar}
                      characterTitle={
                        panelCharacter?.title ?? characterProfile?.title ?? null
                      }
                      videoUrl={panelCharacter?.video_url ?? characterProfile?.videoUrl}
                      tags={characterProfile?.tags}
                      description={characterProfile?.description}
                    />
                  )}
                </>
              ) : (
                <div className="flex-1 animate-in fade-in zoom-in duration-700">
                  <ChatEmptyState />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ChatsContent;
