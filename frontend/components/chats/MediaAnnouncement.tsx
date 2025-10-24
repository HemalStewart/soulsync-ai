'use client';

import { useEffect, useState } from 'react';
import { subscribeToAppEvent } from '@/lib/events';

interface MediaAnnouncementProps {
  visible: boolean;
}

const MediaAnnouncement = ({ visible }: MediaAnnouncementProps) => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return () => undefined;
    }

    const unsubscribe = subscribeToAppEvent('media:generated', (payload) => {
      const label = payload.title && payload.title.trim() !== ''
        ? payload.title.trim()
        : payload.type === 'image'
          ? 'a new image'
          : 'a new video';

      setMessage(() => (payload.type === 'image'
        ? `A new photo was shared: ${label}`
        : `A new video was shared: ${label}`));

      setTimeout(() => {
        setMessage(null);
      }, 5000);
    });

    return unsubscribe;
  }, [visible]);

  if (!visible || !message) {
    return null;
  }

  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-brand-soft bg-white px-4 py-3 shadow-lg">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-primary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path d="M12 8v4m0 4h.01" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">Media Shared</p>
        <p className="text-xs text-gray-600">{message}</p>
      </div>
      <div className="h-2 w-2 animate-ping rounded-full bg-brand-primary" />
    </div>
  );
};

export default MediaAnnouncement;
