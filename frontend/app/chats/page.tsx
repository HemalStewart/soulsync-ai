import { Suspense } from 'react';
import ChatsContent from '@/components/chats/ChatsContent';

const ChatsPage = () => (
  <Suspense fallback={<div className="px-6 py-10 text-center text-sm text-gray-500">Loading chats…</div>}>
    <ChatsContent />
  </Suspense>
);

export default ChatsPage;
