'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { RefreshCw, User, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/components/auth/AuthContext';
import { getUserCharacters } from '@/lib/api';
import { UserCharacterRecord } from '@/lib/types';

interface CreatedCharacter {
  id: string;
  slug: string;
  name: string;
  image: string;
  createdAt: string;
  record: UserCharacterRecord | null;
}

const MyCharactersContent = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [characters, setCharacters] = useState<CreatedCharacter[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [charactersError, setCharactersError] = useState<string | null>(null);

  const mapRecordToCharacter = useCallback(
    (record: UserCharacterRecord): CreatedCharacter => ({
      id: `user-${record.id}`,
      slug: record.slug,
      name: record.name,
      image:
        record.avatar && record.avatar.trim() !== ''
          ? record.avatar
          : '',
      createdAt: new Date(record.created_at ?? Date.now()).toLocaleString(),
      record,
    }),
    []
  );

  const loadCharacters = useCallback(async () => {
    if (!user) {
      setCharacters([]);
      setCharactersError(null);
      return;
    }

    try {
      setCharactersLoading(true);
      const payload = await getUserCharacters();
      setCharacters(payload.map(mapRecordToCharacter));
      setCharactersError(null);
    } catch (error) {
      setCharactersError(
        error instanceof Error
          ? error.message
          : 'Unable to load your characters right now.'
      );
    } finally {
      setCharactersLoading(false);
    }
  }, [mapRecordToCharacter, user]);

  useEffect(() => {
    if (loading) {
      return;
    }
    loadCharacters();
  }, [loading, loadCharacters]);

  useEffect(() => {
    if (!searchParams) {
      return;
    }

    if (searchParams.get('refresh') === '1') {
      loadCharacters();
      const params = new URLSearchParams(searchParams.toString());
      params.delete('refresh');
      router.replace(`/my-characters${params.size ? `?${params}` : ''}`);
    }
  }, [searchParams, loadCharacters, router]);

  const handleEdit = useCallback(
    (character: CreatedCharacter) => {
      const recordId = character.record?.id;
      if (!recordId) {
        return;
      }

      const params = new URLSearchParams();
      params.set('edit', recordId.toString());
      router.push(`/create?${params.toString()}`);
    },
    [router]
  );

  const handleLaunch = useCallback(
    (character: CreatedCharacter) => {
      const slug = character.slug?.trim();
      if (!slug) {
        return;
      }

      router.push(`/chats?character=${encodeURIComponent(slug)}`);
    },
    [router]
  );

  const handleCreateNew = useCallback(() => {
    router.push('/create');
  }, [router]);

  const content = useMemo(() => {
    if (loading || charactersLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`character-skeleton-${index}`}
              className="h-32 sm:h-36 rounded-lg border border-gray-200 bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      );
    }

    if (!user) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 sm:px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Sign in to view your characters
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Log in to continue building and managing your companions.
          </p>
        </div>
      );
    }

    if (charactersError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {charactersError}
        </div>
      );
    }

    if (!characters.length) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 sm:px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            You haven&apos;t created any characters yet
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Build your first companion to see it listed here.
          </p>
          <button
            onClick={handleCreateNew}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-primary-strong"
          >
            <Plus className="h-4 w-4" />
            Create character
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {characters.map((character) => (
          <div
            key={character.id}
            className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-brand-primary hover:-translate-y-1 hover:shadow-brand"
          >
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow">
                {character.image ? (
                  <Image
                    src={character.image}
                    alt={character.name}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center brand-gradient">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {character.name}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {character.createdAt}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleEdit(character)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => handleLaunch(character)}
                className="flex-1 rounded-lg bg-brand-soft px-3 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-tint"
              >
                Launch
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }, [
    characters,
    charactersError,
    charactersLoading,
    handleEdit,
    handleLaunch,
    loading,
    handleCreateNew,
    user,
  ]);

  return (
    <AppLayout activeTab="create">
      <div className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My characters</h1>
              <p className="text-sm text-gray-600">
                Manage and iterate on the companions you have built.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadCharacters}
                disabled={loading || charactersLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    charactersLoading ? 'animate-spin' : ''
                  }`}
                />
                Refresh
              </button>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 rounded-lg brand-gradient px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-primary-strong"
              >
                <Plus className="h-4 w-4" />
                New character
              </button>
            </div>
          </div>

          {content}
        </div>
      </div>
    </AppLayout>
  );
};

export default MyCharactersContent;
