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

// SkeletonCard from V2 (Unchanged)
const SkeletonCard = () => (
  <div className="h-[28rem] sm:h-[26rem] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
);

const CharacterGrid = ({
  loading,
  characters,
  hoveredCard,
  onCardHover,
  onOpenChat,
}: CharacterGridProps) => {
  const handleMouseLeave = useCallback(() => onCardHover(null), [onCardHover]);

  // Loading block from V2 (Unchanged)
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
      {/* V2 Styles + Merged V1 Styles */}
      <style>{`
        /* V2 Original Keyframes (Unchanged) */
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
        
        /* V2 Original Classes (Unchanged) */
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

        /* V2 .grid-item for promo card (Unchanged) */
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
        
        /* --- Styles Added/Merged from V1 --- */

        /* Keyframes from V1 for character card */
        @keyframes glow {
          0%, 100% { 
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          }
          50% { 
            text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* .card-item animation for character cards (from V1) */
        .card-item {
          animation: slideInUp 0.6s ease-out;
        }

        /* Gradient Border (from V1) */
        .gradient-border {
          position: relative;
        }

        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 1.5rem; /* Matches rounded-3xl */
          padding: 2px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.5), rgba(236, 72, 153, 0.5), rgba(59, 130, 246, 0.5));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .gradient-border:hover::before {
          opacity: 1;
        }

        /* Character Card base + hover - NO LIFT */
        .character-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .image-overlay {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Action Button styles (from V1) - Replaces V2's .action-button */
        .action-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .action-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .action-btn:hover::before {
          opacity: 1;
        }

        .action-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
        }

        .action-btn:active {
          transform: scale(0.95);
        }
        
        /* Tag styles (from V1) - Replaces V2's .tag */
        .tag-item {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .tag-item::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .tag-item:hover::before {
          transform: translateX(100%);
        }

        .tag-item:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        
        /* Glass/Glow styles (from V1) */
        .glass-effect {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .text-glow {
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
        }
      `}</style>

      {/* Grid from V2 (Unchanged) */}
      <div className="mx-auto px-4 grid max-w-7xl grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        
        {/* Promo Card from V2 (Unchanged) */}
        <div className="relative h-[28rem] sm:h-[26rem] cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl grid-item shadow-lg hover:shadow-3xl transition-shadow duration-300">
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

        {/* Character Cards (Updated with V1 hover styles) */}
        {characters.map((character, index) => {
          const hasVideo = Boolean(character.videoUrl);
          const hasAvatar = Boolean(character.avatar && character.avatar.trim() !== '');
          const imageTransitionClass =
            hoveredCard === index && hasVideo ? 'opacity-0 scale-110' : 'opacity-100 scale-100';
          const trimmedRole = (character.role ?? '').trim();
          const metaDetails: string[] = [];
          if (typeof character.age === 'number' && character.age > 0) {
            metaDetails.push(`${character.age} yrs`);
          }
          if (trimmedRole !== '') {
            metaDetails.push(trimmedRole);
          }
          const metaLine = metaDetails.join(' • ');

          return (
            <div
              key={character.slug}
              className="character-card gradient-border relative h-[28rem] sm:h-[26rem] cursor-pointer overflow-hidden rounded-3xl card-item group shadow-xl"
              onMouseEnter={() => onCardHover(index)}
              onMouseLeave={handleMouseLeave}
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
            >
              {/* Image/Avatar Layer */}
              {hasAvatar ? (
                <Image
                  src={character.avatar}
                  alt={character.name}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className={`absolute inset-0 h-full w-full object-cover image-overlay ${imageTransitionClass}`}
                  priority={index < 2}
                />
              ) : (
                <div
                  className={`absolute inset-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 image-overlay ${imageTransitionClass}`}
                >
                  <User className="h-16 w-16 sm:h-20 sm:w-20 text-white/80 drop-shadow-2xl" />
                </div>
              )}

              {/* Video Layer */}
              {hasVideo && (
                <video
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                    hoveredCard === index ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
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

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div
                className={`absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/20 transition-opacity duration-500 ${
                  hoveredCard === index ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Hover Action Buttons */}
              <div
                className={`absolute top-3 right-3 flex gap-1 sm:gap-2 transition-all duration-300 ${
                  hoveredCard === index
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}
              >
                <button className="action-btn flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-full glass-effect">
                  <Video size={18} className="sm:w-5 sm:h-5 text-white" />
                </button>
                <button className="action-btn flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-full glass-effect">
                  <Phone size={18} className="sm:w-5 sm:h-5 text-white" />
                </button>
                
                <button
                  onClick={() => onOpenChat(character.slug)}
                  className="action-btn flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-full glass-effect"
                >
                  <MessageCircle size={18} className="sm:w-5 sm:h-5 text-white" />
                </button>
              </div>

              

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-6 space-y-2 sm:space-y-3">
                {/* Name */}
                <div className="flex items-start gap-3">
                  <h3 className="text-lg sm:text-2xl font-bold text-white leading-tight truncate flex-1 group-hover:scale-105 transition-transform duration-300">
                    {character.name}
                  </h3>
                </div>

                {/* Meta Info */}
                {metaLine && (
                  <p className="text-xs sm:text-sm text-white/90 font-medium truncate mb-2">
                    {metaLine}
                  </p>
                )}

                {/* Description on Hover */}
                {hoveredCard === index && (
                  <p 
                    className="text-xs sm:text-sm text-white/90 leading-relaxed line-clamp-2"
                    style={{ animation: 'slideInUp 0.5s ease-out' }}
                  >
                    {character.description}
                  </p>
                )}

                {/* Tags */}
                {character.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {character.tags.map((tag, tagIndex) => (
                      <span
                        key={`${character.slug}-${tag}`}
                        className="tag-item rounded-full glass-effect px-3 py-1.5 text-xs sm:text-sm text-white font-medium"
                        style={{ animationDelay: `${tagIndex * 0.05}s` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Shine Effect on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ${
                hoveredCard === index ? 'translate-x-full' : '-translate-x-full'
              }`} />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default CharacterGrid;
