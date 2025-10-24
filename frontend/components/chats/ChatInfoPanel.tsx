'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { Video, User } from 'lucide-react';
import { COIN_COSTS } from '@/lib/coins';

interface ChatInfoPanelProps {
  characterName: string;
  characterAvatar: string | null;
  characterTitle?: string | null;
  characterRole?: string | null;
  characterAge?: number | null;
  videoUrl?: string | null;
  tags?: string[];
  description?: string;
  onGenerateVideo?: () => void;
  onGenerateImage?: () => void;
  hasPresetVideos?: boolean;
  hasPresetImages?: boolean;
  isGeneratingImage?: boolean;
  isGeneratingVideo?: boolean;
}

const ChatInfoPanel = ({
  characterName,
  characterAvatar,
  characterTitle,
  characterRole,
  characterAge,
  videoUrl,
  tags = [],
  description,
  onGenerateVideo,
  onGenerateImage,
  hasPresetVideos = false,
  hasPresetImages = false,
  isGeneratingImage = false,
  isGeneratingVideo = false,
}: ChatInfoPanelProps) => {
  const avatar = characterAvatar?.trim() ?? '';
  const videoPosterProps = avatar ? { poster: avatar } : {};
  const showRole =
    !!characterRole &&
    (!characterTitle ||
      characterTitle.localeCompare(characterRole, undefined, { sensitivity: 'accent' }) !== 0);
  const metaDetails: string[] = [];
  if (showRole && characterRole) {
    metaDetails.push(characterRole);
  }
  if (typeof characterAge === 'number' && characterAge > 0) {
    metaDetails.push(`${characterAge} yrs old`);
  }

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!event.cancelable) {
        return;
      }

      const delta = event.deltaY;
      if (delta === 0) {
        return;
      }

      const maxScroll = element.scrollHeight - element.clientHeight;
      const next = Math.min(Math.max(element.scrollTop + delta, 0), maxScroll);

      event.preventDefault();
      element.scrollTop = next;
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStartRef.current = touch ? touch.clientY : null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const startY = touchStartRef.current;
      const touch = event.touches[0];

      if (!touch || startY === null) {
        return;
      }

      const delta = startY - touch.clientY;
      if (Math.abs(delta) < 1) {
        return;
      }

      if (!event.cancelable) {
        touchStartRef.current = touch.clientY;
        return;
      }

      const maxScroll = element.scrollHeight - element.clientHeight;
      const next = Math.min(Math.max(element.scrollTop + delta, 0), maxScroll);

      event.preventDefault();
      element.scrollTop = next;
      touchStartRef.current = touch.clientY;
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    element.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    element.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('wheel', handleWheel, { capture: true });
      element.removeEventListener('touchstart', handleTouchStart, { capture: true });
      element.removeEventListener('touchmove', handleTouchMove, { capture: true });
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div className="flex flex-col bg-white h-full overflow-hidden w-full lg:w-80">
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 sm:p-5 lg:p-6">
          {/* Video/Image Section */}
          <div className="relative mb-4 sm:mb-5 h-48 sm:h-56 md:h-64 lg:h-80 w-full rounded-xl overflow-hidden">
            {videoUrl ? (
              <video
                src={videoUrl}
                className="h-full w-full object-cover"
                controls
                {...videoPosterProps}
              />
            ) : avatar ? (
              <Image
                src={avatar}
                alt={characterName}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 384px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center brand-gradient">
                <User className="h-12 sm:h-14 lg:h-16 w-12 sm:w-14 lg:w-16 text-white drop-shadow-lg" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mb-4 sm:mb-5 lg:mb-6 flex flex-col gap-4">
            <button
              className="flex items-center justify-center space-x-2 rounded-lg sm:rounded-xl brand-gradient px-4 py-2.5 sm:py-3 font-semibold text-white text-sm shadow-brand transition-all duration-200 hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
              onClick={onGenerateVideo}
              disabled={
                !onGenerateVideo ||
                !hasPresetVideos ||
                isGeneratingVideo ||
                isGeneratingImage
              }
              title={
                hasPresetVideos && !isGeneratingVideo && !isGeneratingImage
                  ? 'Share a predefined video'
                  : (isGeneratingVideo || isGeneratingImage)
                    ? 'Please wait for the current generation to finish'
                  : 'No predefined videos available'
              }
            >
              <Video size={18} />
              <span>{isGeneratingVideo ? 'Generating…' : 'Generate Video'}</span>
              <span className="text-[11px] font-medium text-white/80">
                {COIN_COSTS.shareChatVideo} coins
              </span>
            </button>
            <button
              className="flex items-center justify-center space-x-2 rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 sm:py-3 font-semibold text-gray-700 text-sm shadow-sm transition-all duration-200 hover:border-brand-primary hover:bg-brand-tint hover:text-brand-primary hover:shadow-brand active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-700"
              onClick={onGenerateImage}
              disabled={
                !onGenerateImage ||
                !hasPresetImages ||
                isGeneratingImage ||
                isGeneratingVideo
              }
              title={
                hasPresetImages && !isGeneratingImage && !isGeneratingVideo
                  ? 'Share a predefined image'
                  : (isGeneratingImage || isGeneratingVideo)
                    ? 'Please wait for the current generation to finish'
                  : 'No predefined images available'
              }
            >
              <svg className="h-4 sm:h-5 w-4 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4h2v4h14v-4h2zM17 9l-1.41-1.41L13 10.17V3h-2v7.17L8.41 7.59 7 9l5 5 5-5z" />
              </svg>
              <span>{isGeneratingImage ? 'Generating…' : 'Generate Photo'}</span>
              <span className="text-[11px] font-medium text-gray-500">
                {COIN_COSTS.shareChatImage} coins
              </span>
            </button>
          </div>

          {/* Character Info */}
          <h2 className="mb-1 text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{characterName}</h2>
          {characterTitle && (
            <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">{characterTitle}</p>
          )}
          {!!metaDetails.length && (
            <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
              {metaDetails.join(' • ')}
            </p>
          )}

          {/* Tags */}
          {!!tags.length && (
            <div className="mb-3 sm:mb-4 flex flex-wrap gap-1.5 sm:gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2.5 sm:px-3 py-1 text-xs text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs sm:text-sm leading-relaxed text-gray-700">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInfoPanel;
