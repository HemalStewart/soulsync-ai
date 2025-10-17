'use client';

import Image from 'next/image';
import { Video } from 'lucide-react';

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
}: ChatInfoPanelProps) => (
  <div className="w-96 overflow-y-auto border-l bg-white p-6">
    <div className="relative mb-4 h-80 w-full">
      {videoUrl ? (
        <video
          src={videoUrl}
          className="h-full w-full rounded-2xl object-cover"
          controls
          poster={
            characterAvatar ||
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop'
          }
        />
      ) : (
        <Image
          src={
            characterAvatar ||
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop'
          }
          alt={characterName}
          fill
          sizes="384px"
          className="rounded-2xl object-cover"
        />
      )}
    </div>

    <div className="mb-6 flex space-x-3">
      <button className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-blue-600 py-3 font-semibold text-white">
        <Video size={20} />
        <span>Generate Video</span>
      </button>
    </div>

    <button className="mb-6 flex w-full items-center justify-center space-x-2 rounded-xl border-2 border-blue-600 py-3 font-semibold text-blue-600">
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4h2v4h14v-4h2zM17 9l-1.41-1.41L13 10.17V3h-2v7.17L8.41 7.59 7 9l5 5 5-5z" />
      </svg>
      <span>Generate Photo</span>
    </button>

    <h2 className="mb-1 text-2xl font-bold text-gray-900">{characterName}</h2>
    {characterTitle && (
      <p className="mb-4 text-sm text-gray-600">{characterTitle}</p>
    )}

    {!!tags.length && (
      <div className="mb-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
          >
            {tag}
          </span>
        ))}
      </div>
    )}

    {description && (
      <p className="text-sm leading-relaxed text-gray-700">{description}</p>
    )}
  </div>
);

export default ChatInfoPanel;
