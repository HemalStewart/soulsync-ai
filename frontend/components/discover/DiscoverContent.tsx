'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import FreeChatBanner from './FreeChatBanner';
import PromoCarousel from './PromoCarousel';
import RecentChats from './RecentChats';
import CharacterGrid from './CharacterGrid';
import FloatingChatButton from './FloatingChatButton';
import { getCharacters, getChatSummaries } from '@/lib/api';
import { CharacterCard, ChatSummary } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthContext';

const DiscoverContent = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [characters, setCharacters] = useState<CharacterCard[]>([]);
  const [recentChats, setRecentChats] = useState<ChatSummary[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [charactersError, setCharactersError] = useState<string | null>(null);
  const [chatsError, setChatsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCharacters = async () => {
      try {
        setCharactersLoading(true);
        const characterData = await getCharacters();
        if (!isMounted) return;
        setCharacters(characterData);
        setCharactersError(null);
      } catch (err) {
        if (!isMounted) return;
        setCharactersError(
          err instanceof Error ? err.message : 'Failed to load characters.'
        );
      } finally {
        if (isMounted) {
          setCharactersLoading(false);
        }
      }
    };

    loadCharacters();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadChats = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        if (isMounted) {
          setRecentChats([]);
          setChatsError(null);
          setChatsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setChatsLoading(true);
          setChatsError(null);
        }
        const chatData = await getChatSummaries();
        if (!isMounted) return;
        setRecentChats(chatData);
      } catch (err) {
        if (!isMounted) return;
        setChatsError(
          err instanceof Error ? err.message : 'Failed to load chats.'
        );
      } finally {
        if (isMounted) {
          setChatsLoading(false);
        }
      }
    };

    loadChats();

    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  const handleChatSelect = (slug: string) => {
    router.push(`/chats?character=${encodeURIComponent(slug)}`);
  };

  return (
    <>
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

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

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          60% {
            opacity: 1;
            transform: translateY(-5px);
          }
          80% {
            transform: translateY(2px);
          }
          100% {
            transform: translateY(0);
          }
        }

        .animate-fade-in-down {
          animation: fadeInDown 0.6s ease-out;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.6s ease-out;
        }

        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .page-container {
          animation: fadeInUp 0.7s ease-out;
        }

        .section-header {
          animation: slideInLeft 0.6s ease-out;
        }

        .section-content {
          animation: fadeInUp 0.6s ease-out;
        }

        .error-banner {
          animation: bounce-in 0.5s ease-out;
        }

        h1 {
          transition: all 0.3s ease;
        }

        p {
          transition: all 0.3s ease;
        }
      `}</style>

      <AppLayout activeTab="discover">
        <div className="flex-1 overflow-auto px-4 py-8 space-y-8 page-container">
          <div className="animate-fade-in-down">
            {user ? <FreeChatBanner /> : <PromoCarousel />}
          </div>

          {user && !authLoading && (
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <RecentChats
                chats={recentChats}
                loading={chatsLoading}
                isAuthenticated={true}
                error={chatsError}
                onChatSelect={handleChatSelect}
                onViewAll={() => router.push('/chats')}
              />
            </div>
          )}

          <div className="max-w-7xl mx-auto section-header" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent hover:from-gray-800 hover:to-gray-900 transition-all duration-300">
              Discover
            </h1>
            <p className="text-gray-600 mt-2 text-lg hover:text-gray-700 transition-all duration-300">
              Meet curated AI companions tailored for every mood. Browse profiles to find your perfect match.
            </p>
          </div>

          {charactersError && (
            <div className="max-w-7xl mx-auto rounded-lg bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 text-red-700 border border-red-200 error-banner shadow-md">
              {charactersError}
            </div>
          )}

          <div className="section-content" style={{ animationDelay: '0.3s' }}>
            <CharacterGrid
              loading={charactersLoading}
              characters={characters}
              hoveredCard={hoveredCard}
              onCardHover={setHoveredCard}
              onOpenChat={handleChatSelect}
            />
          </div>
        </div>
        <FloatingChatButton />
      </AppLayout>
    </>
  );
};

export default DiscoverContent;