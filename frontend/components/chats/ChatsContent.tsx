'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useCoins } from '@/components/coins/CoinContext';
import CoinLimitModal from '@/components/coins/CoinLimitModal';
import { COIN_COSTS } from '@/lib/coins';

const MESSAGE_COST = COIN_COSTS.chatMessage;

const ChatsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const characterParam = searchParams.get('character');
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const { balance, setBalance, refresh: refreshCoinBalance } = useCoins();

  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [characters, setCharacters] = useState<Record<string, CharacterCard>>({});
  const [chatDetail, setChatDetail] = useState<CharacterChatDetail | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const previousDesktopOpenRef = useRef<boolean>(true);

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
      if (mobile) {
        setShowInfoPanel((prev) => (prev ? false : prev));
      } else {
        setShowInfoPanel((prev) => {
          const desired = previousDesktopOpenRef.current ?? true;
          return prev === desired ? prev : desired;
        });
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
          getChatSummaries(user?.id ?? undefined),
          getCharacters({ includeUser: true, userId: user?.id ?? undefined }),
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
    if (!isMobileView) {
      return;
    }

    if (characterParam) {
      setShowMobileChat(true);
      setShowInfoPanel(false);
    }
  }, [characterParam, isMobileView]);

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
      setShowInfoPanel(false);
    }
  };

  const handleToggleInfoPanel = () => {
    setShowInfoPanel((prev) => {
      const next = !prev;
      if (!isMobileView) {
        previousDesktopOpenRef.current = next;
      }
      return next;
    });
  };

  const handleSendMessage = async () => {
    if (!user || !selectedChat || !messageInput.trim()) {
      return;
    }

    const outgoing = messageInput.trim();

    if (balance !== null && balance < MESSAGE_COST) {
      setShowCoinModal(true);
      setErrorMessage('You have no coins left. Please top up to continue chatting.');
      setIsErrorVisible(true);
      return;
    }

    const optimisticId = Date.now();
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      sender: 'user',
      message: outgoing,
      created_at: new Date().toISOString(),
    };

    setSending(true);
    setMessageInput('');

    setChatDetail((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        messages: [...previous.messages, optimisticMessage],
      };
    });

    try {
      const payload = await sendChatMessage(selectedChat, outgoing);

      if (typeof payload.coinBalance === 'number') {
        setBalance(payload.coinBalance);
      } else {
        void refreshCoinBalance();
      }

      setChatDetail((previous) => {
        if (!previous) {
          return previous;
        }

        const withoutOptimistic = previous.messages.filter(
          (message) => !(message.id === optimisticId && message.sender === 'user')
        );

        const messages: ChatMessage[] = [
          ...withoutOptimistic,
          payload.userMessage,
          payload.aiMessage,
        ];

        return {
          ...previous,
          messages,
        };
      });
      setSending(false);

      // Refresh chat summaries to show latest message preview
      const refreshedSummaries = await getChatSummaries();
      setChatSummaries(refreshedSummaries);
      setErrorMessage(null);
    } catch (error) {
      setChatDetail((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          messages: previous.messages.filter(
            (message) => !(message.id === optimisticId && message.sender === 'user')
          ),
        };
      });

      setMessageInput((prev) => (prev.trim() === '' ? outgoing : prev));
      const status =
        typeof error === 'object' && error && 'status' in error
          ? (error as { status?: number }).status ?? null
          : null;

      if (status === 402) {
        setShowCoinModal(true);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'You have no coins left. Please purchase more to continue.'
        );
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to send message.'
        );
      }
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
  const resolvedRole =
    panelCharacter?.role ?? characterProfile?.role ?? null;
  const resolvedAge = useMemo(() => {
    const candidate =
      (panelCharacter?.age ?? characterProfile?.age ?? null) ?? null;

    if (typeof candidate === 'number') {
      return Number.isFinite(candidate) && candidate > 0 ? candidate : null;
    }

    if (typeof candidate === 'string') {
      const parsed = Number.parseInt(candidate, 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    return null;
  }, [panelCharacter?.age, characterProfile?.age]);
  const resolvedGreeting = useMemo(() => {
    const candidates = [
      characterProfile?.introLine,
      panelCharacter?.intro_line,
      characterProfile?.greeting,
      panelCharacter?.greeting,
    ];

    for (const candidate of candidates) {
      const trimmed =
        typeof candidate === 'string' ? candidate.trim() : '';
      if (trimmed) {
        return trimmed;
      }
    }

    return '';
  }, [
    characterProfile?.greeting,
    characterProfile?.introLine,
    panelCharacter?.greeting,
    panelCharacter?.intro_line,
  ]);
  const messagesWithGreeting = useMemo(() => {
    const baseMessages = chatDetail?.messages ?? [];

    if (!resolvedGreeting) {
      return baseMessages;
    }

    const normalize = (value: string) =>
      value.replace(/\s+/g, ' ').trim().toLowerCase();

    const normalizedGreeting = normalize(resolvedGreeting);
    const hasGreeting = baseMessages.some(
      (message) =>
        message.sender === 'ai' &&
        normalize(message.message) === normalizedGreeting
    );

    if (hasGreeting) {
      return baseMessages;
    }

    const greetingMessage: ChatMessage = {
      sender: 'ai',
      message: resolvedGreeting,
      created_at: `greeting-${selectedChat ?? 'chat'}`,
    };

    return [greetingMessage, ...baseMessages];
  }, [chatDetail?.messages, resolvedGreeting, selectedChat]);

  if (authLoading) {
    return (
      <AppLayout activeTab="chats">
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 sm:h-12 w-10 sm:w-12 animate-spin rounded-full border-4 border-gray-200" style={{ borderTopColor: 'var(--brand-primary)' }}></div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 animate-pulse">Loading your chats…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout activeTab="chats">
        <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4">
          <div className="animate-in fade-in zoom-in duration-500 rounded-2xl border border-brand-soft bg-white px-6 sm:px-12 py-8 sm:py-10 text-center shadow-brand transition-all hover:shadow-xl hover:scale-105 max-w-sm">
            <div className="mx-auto mb-4 flex h-14 sm:h-16 w-14 sm:w-16 items-center justify-center rounded-xl brand-gradient shadow-brand flex-shrink-0">
              <svg
                className="h-7 sm:h-8 w-7 sm:w-8 text-white"
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Sign in to continue</h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Log in or create an account to access this feature.
            </p>
            <button
              onClick={() => openAuthModal('login')}
              className="mt-6 rounded-xl brand-gradient px-6 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-brand transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <AppLayout activeTab="chats">
        {/* Main wrapper - NO height constraint here */}
        <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
          {/* Error notification */}
          {errorMessage && (
            <div
              className={`w-full border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-3 sm:px-6 py-2 sm:py-3 shadow-sm transition-all duration-300 ${
                isErrorVisible
                  ? 'translate-y-0 opacity-100'
                  : '-translate-y-full opacity-0'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg bg-red-200 animate-pulse flex-shrink-0">
                    <svg
                      className="h-4 sm:h-5 w-4 sm:w-5 text-red-600"
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
                  <span className="text-xs sm:text-sm font-medium text-red-800">{errorMessage}</span>
                </div>
                <button
                  onClick={() => {
                    setIsErrorVisible(false);
                    setTimeout(() => setErrorMessage(null), 300);
                  }}
                  className="rounded-lg p-1 text-red-600 transition-all duration-200 hover:bg-red-200 hover:scale-110 flex-shrink-0"
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

          {/* Chat content - Let it take remaining space */}
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Chat list */}
            {(!isMobileView || !showMobileChat) && (
              <ChatList
                chats={chatSummaries}
                selectedChat={selectedChat}
                onSelect={handleSelectChat}
                loading={loadingChats}
                fullWidth={isMobileView}
              />
            )}

            {/* Main chat area */}
            {(!isMobileView || showMobileChat) && (
              <div className="flex flex-1 overflow-hidden min-h-0">
                {selectedChat ? (
                  <>
                    {/* Chat window */}
                    <ChatWindow
                      characterName={resolvedName}
                      characterAvatar={resolvedAvatar}
                      messages={messagesWithGreeting}
                      messageInput={messageInput}
                      onMessageInputChange={setMessageInput}
                      onSend={handleSendMessage}
                      isLoading={loadingMessages}
                      isSending={sending}
                      headerLoading={headerLoading}
                      onBack={isMobileView ? () => setShowMobileChat(false) : undefined}
                      onToggleInfoPanel={handleToggleInfoPanel}
                      showInfoPanel={showInfoPanel}
                    />

                    {/* Info panel */}
                    {showInfoPanel && (
                      <div className={`transition-all duration-300 overflow-hidden ${
                        isMobileView 
                          ? 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end' 
                          : 'w-80 border-l'
                      }`}
                      onClick={isMobileView ? () => setShowInfoPanel(false) : undefined}
                      >
                        {isMobileView && (
                          <div className="w-full bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
                              <h3 className="font-semibold text-gray-900">{resolvedName || selectedChat}</h3>
                              <button
                                onClick={() => setShowInfoPanel(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <ChatInfoPanel
                              characterName={resolvedName || selectedChat}
                              characterAvatar={resolvedAvatar}
                              characterTitle={
                                panelCharacter?.title ?? characterProfile?.title ?? null
                              }
                              characterRole={resolvedRole}
                              characterAge={resolvedAge}
                              videoUrl={panelCharacter?.video_url ?? characterProfile?.videoUrl}
                              tags={characterProfile?.tags}
                              description={characterProfile?.description}
                            />
                          </div>
                        )}
                        {!isMobileView && (
                          <ChatInfoPanel
                            characterName={resolvedName || selectedChat}
                            characterAvatar={resolvedAvatar}
                            characterTitle={
                              panelCharacter?.title ?? characterProfile?.title ?? null
                            }
                            characterRole={resolvedRole}
                            characterAge={resolvedAge}
                            videoUrl={panelCharacter?.video_url ?? characterProfile?.videoUrl}
                            tags={characterProfile?.tags}
                            description={characterProfile?.description}
                          />
                        )}
                      </div>
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
      <CoinLimitModal
        open={showCoinModal}
        onClose={() => setShowCoinModal(false)}
      />
    </>
  );
};

export default ChatsContent;
