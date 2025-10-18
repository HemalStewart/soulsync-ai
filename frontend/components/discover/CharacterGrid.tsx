'use client';

import Image from 'next/image';
import { useCallback } from 'react';
import { MessageCircle, Phone, Video, User } from 'lucide-react';
import { CharacterCard } from '@/lib/types';

interface CharacterGridProps {
  loading: boolean;
  characters: CharacterCard[];
  hoveredCard: number | null;
  onCardHover: (index: number | null) => void;
  onOpenChat: (slug: string) => void;
}

const SkeletonCard = () => (
  <div className="h-80 sm:h-96 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
);

const CharacterGrid = ({
  loading,
  characters,
  hoveredCard,
  onCardHover,
  onOpenChat,
}: CharacterGridProps) => {
  const handleMouseLeave = useCallback(() => onCardHover(null), [onCardHover]);

  if (loading && !characters.length) {
    return (
      <>
        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
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

          @keyframes shimmer {
            0%, 100% {
              background-position: -1000px 0;
            }
            100% {
              background-position: 1000px 0;
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }

          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
            }
            50% {
              box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
            }
          }

          @keyframes rotate-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .animate-slide-in {
            animation: slideIn 0.6s ease-out;
          }

          .animate-scale-in {
            animation: scaleIn 0.5s ease-out;
          }

          .skeleton-card {
            background: linear-gradient(90deg, #f3f4f6, #e5e7eb, #f3f4f6);
            background-size: 1000px 100%;
            animation: shimmer 2s infinite;
          }

          .animate-float {
            animation: float 3s ease-in-out infinite;
          }

          .animate-pulse-glow {
            animation: pulse-glow 2s infinite;
          }

          .grid-item {
            animation: slideIn 0.6s ease-out;
          }
        `}</style>
        <div className="mx-auto px-4 grid max-w-7xl grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="grid-item" style={{ animationDelay: `${index * 0.1}s` }}>
              <SkeletonCard />
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes buttonBounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .animate-slide-in {
          animation: slideIn 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s infinite;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }

        .animate-button-bounce {
          animation: buttonBounce 0.4s ease-in-out;
        }

        .grid-item {
          animation: slideIn 0.6s ease-out;
        }

        .card-content {
          transition: all 0.3s ease;
        }

        .promo-button {
          transition: all 0.3s ease;
        }

        .promo-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .action-button {
          transition: all 0.3s ease;
        }

        .action-button:hover {
          transform: scale(1.15) rotate(5deg);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        .tag {
          transition: all 0.3s ease;
        }

        .tag:hover {
          background-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .character-card {
          transition: box-shadow 0.3s ease;
        }

        .character-card:hover {
          box-shadow: 0 25px 50px rgba(59, 130, 246, 0.15);
        }
      `}</style>

      <div className="mx-auto px-4 grid max-w-7xl grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="relative h-80 sm:h-96 cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl grid-item shadow-lg hover:shadow-3xl transition-shadow duration-300">
          <video autoPlay loop muted playsInline className="h-full w-full object-cover">
            <source
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/40 via-orange-400/40 via-pink-400/40 via-purple-400/40 to-blue-400/40" />
          <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
            <div className="mb-4 text-center animate-fade-in-up">
              <p className="mb-3 text-xs sm:text-sm text-white drop-shadow-lg">
                Unlock your imagination with SoulFun&apos;s AI character creator and craft your perfect companion experience.
              </p>
              <button className="promo-button rounded-full bg-white px-4 sm:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-base text-gray-900 shadow-lg hover:bg-white/90">
                Generate Your Own Character
              </button>
            </div>
          </div>
        </div>

        {characters.map((character, index) => {
          const hasVideo = Boolean(character.videoUrl);
          const hasAvatar = Boolean(character.avatar && character.avatar.trim() !== '');
          const imageTransitionClass =
            hoveredCard === index && hasVideo ? 'opacity-0 scale-95' : 'opacity-100 scale-100';

          return (
            <div
              key={character.slug}
              className="character-card relative h-80 sm:h-96 cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl grid-item group"
              onMouseEnter={() => onCardHover(index)}
              onMouseLeave={handleMouseLeave}
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              {hasAvatar ? (
                <Image
                  src={character.avatar}
                  alt={character.name}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${imageTransitionClass}`}
                  priority={index < 2}
                />
              ) : (
                <div
                  className={`absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 transition-all duration-500 ${imageTransitionClass}`}
                >
                  <User className="h-12 sm:h-16 w-12 sm:w-16 text-white drop-shadow-lg" />
                </div>
              )}

              {hasVideo && (
                <video
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${
                    hoveredCard === index ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  ref={(element) => {
                    if (!element) return;
                    if (hoveredCard === index) {
                      element.play().catch(() => {});
                    } else {
                      element.pause();
                      element.currentTime = 0;
                    }
                  }}
                >
                  <source src={character.videoUrl} type="video/mp4" />
                </video>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {hoveredCard === index && (
                <button
                  onClick={() => onOpenChat(character.slug)}
                  className="action-button absolute right-3 sm:right-4 top-3 sm:top-4 z-10 flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition animate-scale-in"
                >
                  <MessageCircle size={20} className="sm:w-6 sm:h-6 text-white" />
                </button>
              )}

              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-6 card-content">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg group-hover:translate-y-0 transition-all duration-300 truncate">
                    {character.name}
                  </h3>
                  <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                    <button className="action-button flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30">
                      <Phone size={16} className="sm:w-5 sm:h-5 text-white" />
                    </button>
                    <button className="action-button flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30">
                      <Video size={16} className="sm:w-5 sm:h-5 text-white" />
                    </button>
                  </div>
                </div>

                {hoveredCard === index && (
                  <p className="mb-3 text-xs sm:text-sm text-white drop-shadow-lg animate-fade-in-up line-clamp-2">
                    {character.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {character.tags.map((tag, tagIndex) => (
                    <span
                      key={tag}
                      className="tag rounded-full bg-white/20 px-2 sm:px-3 py-1 text-xs sm:text-sm text-white backdrop-blur-sm"
                      style={{ animationDelay: `${tagIndex * 0.05}s` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default CharacterGrid;