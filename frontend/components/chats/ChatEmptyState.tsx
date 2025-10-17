'use client';

import { MessageCircle } from 'lucide-react';

const ChatEmptyState = () => (
  // MODIFICATION: Replaced flex-1 with h-full and added flex-col
  <div className="h-full flex flex-col items-center justify-center bg-gray-50">
    <div className="text-center">
      <MessageCircle size={64} className="text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-600">
        Select a chat to start messaging
      </h3>
    </div>
  </div>
);

export default ChatEmptyState;