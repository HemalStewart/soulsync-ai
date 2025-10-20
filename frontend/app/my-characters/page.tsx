import { Suspense } from 'react';
import MyCharactersContent from '@/components/create/MyCharactersContent';
import AppLayout from '@/components/layout/AppLayout';

const MyCharactersFallback = () => (
  <AppLayout activeTab="create">
    <div className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-12 w-48 rounded-lg bg-gray-200/80 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`character-fallback-${index}`}
              className="h-32 sm:h-36 rounded-xl border border-gray-200 bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  </AppLayout>
);

const MyCharactersPage = () => (
  <Suspense fallback={<MyCharactersFallback />}>
    <MyCharactersContent />
  </Suspense>
);

export default MyCharactersPage;
