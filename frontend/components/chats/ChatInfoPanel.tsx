'use client';
import Image from 'next/image';
import { Video, User } from 'lucide-react';

interface ChatInfoPanelProps {
  characterName: string;
  characterAvatar: string | null;
  characterTitle?: string | null;
  videoUrl?: string | null;
  tags?: string[];
  description?: string;
}

const ChatInfoPanel = ({
  characterName,
  characterAvatar,
  characterTitle,
  videoUrl,
  tags = [],
  description,
}: ChatInfoPanelProps) => {
  const avatar = characterAvatar?.trim() ?? '';
  const videoPosterProps = avatar ? { poster: avatar } : {};

  return (
    <div className="flex flex-col bg-white h-full overflow-hidden w-full lg:w-80">
      <div className="flex-1 overflow-y-auto">
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
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
      <User className="h-12 sm:h-14 lg:h-16 w-12 sm:w-14 lg:w-16 text-white drop-shadow-lg" />
    </div>
  )}
</div>


          {/* Action Buttons */}
          <div className="mb-4 sm:mb-5 lg:mb-6 flex flex-col gap-2 sm:gap-2.5">
            <button className="flex items-center justify-center space-x-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 sm:py-3 font-semibold text-white text-sm shadow-md transition-all duration-200 hover:shadow-lg hover:from-blue-700 hover:to-blue-800 active:scale-95">
              <Video size={18} />
              <span>Generate Video</span>
            </button>
            <button className="flex items-center justify-center space-x-2 rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 sm:py-3 font-semibold text-gray-700 text-sm shadow-sm transition-all duration-200 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md active:scale-95">
              <svg className="h-4 sm:h-5 w-4 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4h2v4h14v-4h2zM17 9l-1.41-1.41L13 10.17V3h-2v7.17L8.41 7.59 7 9l5 5 5-5z" />
              </svg>
              <span>Generate Photo</span>
            </button>
          </div>

          {/* Character Info */}
          <h2 className="mb-1 text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{characterName}</h2>
          {characterTitle && (
            <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">{characterTitle}</p>
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