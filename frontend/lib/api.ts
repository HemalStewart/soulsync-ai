import {
  CharacterApiModel,
  CharacterCard,
  CharacterChatDetail,
  ChatMessage,
  ChatSummary,
  GeneratedImageRecord,
} from './types';
import { parseDelimitedList } from './utils';

const DEFAULT_API_BASE = '/api/backend';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_API_BASE;

const DEFAULT_BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
  (API_BASE_URL.startsWith('http')
    ? API_BASE_URL.replace(/\/api(?:\/.+)?$/, '')
    : 'http://localhost:8888/soulsync-full/backend/public');

const BACKEND_BASE_URL = DEFAULT_BACKEND_BASE.replace(/\/$/, '');

const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? '';

type FetchOptions = RequestInit & { skipCredentials?: boolean };

const buildUrl = (endpoint: string) => {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }

  if (API_BASE_URL.startsWith('http')) {
    const base = API_BASE_URL.endsWith('/')
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
  }

  const base = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

const fetchJson = async <T>(endpoint: string, options: FetchOptions = {}) => {
  const { skipCredentials, headers, ...rest } = options;

  const url = buildUrl(endpoint);

  const response = await fetch(url, {
    method: 'GET',
    credentials: skipCredentials ? 'same-origin' : 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    ...rest,
  });

  const isJson =
    response.headers.get('content-type')?.includes('application/json');

  if (!response.ok) {
    const message = isJson ? await response.json() : await response.text();
    throw new Error(
      typeof message === 'string'
        ? message
        : message?.message ?? response.statusText
    );
  }

  return (isJson ? response.json() : response.text()) as Promise<T>;
};

const mapCharacter = (character: CharacterApiModel): CharacterCard => {
  const tags = parseDelimitedList(character.tags);
  const description =
    character.personality ||
    character.title ||
    'Always ready for a great conversation.';

  return {
    id: character.id,
    name: character.name,
    slug: character.slug,
    avatar:
      character.avatar ||
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
    title: character.title || 'AI Companion',
    description,
    tags: tags.length ? tags : ['AI Companion'],
    videoUrl: character.video_url || undefined,
  };
};

export const getCharacters = async (): Promise<CharacterCard[]> => {
  const payload = await fetchJson<{ data: CharacterApiModel[] }>('/characters');
  return (payload.data ?? []).map(mapCharacter);
};

export const getChatSummaries = async (
  userId?: string | null
): Promise<ChatSummary[]> => {
  const fallbackUserId = (DEFAULT_USER_ID ?? '').trim();
  const rawUserId =
    userId === undefined ? fallbackUserId : userId == null ? '' : userId;
  const resolvedUserId =
    typeof rawUserId === 'string' ? rawUserId.trim() : String(rawUserId);

  const params = new URLSearchParams({ limit: '20' });
  if (resolvedUserId) {
    params.set('user_id', resolvedUserId);
  }

  const query = params.toString();
  const payload = await fetchJson<{ data: ChatSummary[] }>(
    `/chats${query ? `?${query}` : ''}`
  );

  return payload.data ?? [];
};

export const getCharacterChat = async (
  slug: string,
  userId?: string | null
): Promise<CharacterChatDetail> => {
  const fallbackUserId = (DEFAULT_USER_ID ?? '').trim();
  const rawUserId =
    userId === undefined ? fallbackUserId : userId == null ? '' : userId;
  const resolvedUserId =
    typeof rawUserId === 'string' ? rawUserId.trim() : String(rawUserId);

  const params =
    resolvedUserId !== ''
      ? `?user_id=${encodeURIComponent(resolvedUserId)}`
      : '';
  const payload = await fetchJson<CharacterChatDetail>(
    `/chats/${slug}${params}`
  );
  return payload;
};

export const sendChatMessage = async (
  slug: string,
  message: string
): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> => {
  const payload = await fetchJson<{
    userMessage: ChatMessage;
    aiMessage: ChatMessage;
  }>(`/chats/${slug}`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  return payload;
};

export const apiConfig = {
  baseUrl: API_BASE_URL,
  backendBaseUrl: BACKEND_BASE_URL,
  defaultUserId: DEFAULT_USER_ID,
};

export const listGeneratedImages = async (
  userId?: string | null,
  limit = 24
): Promise<GeneratedImageRecord[]> => {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (userId) {
    params.set('user_id', userId);
  }

  const query = params.toString();
  const payload = await fetchJson<{ data: GeneratedImageRecord[] }>(
    `/generated-images${query ? `?${query}` : ''}`
  );

  return payload.data ?? [];
};

export interface CreateGeneratedImagePayload {
  remote_url: string;
  prompt: string;
  negative_prompt?: string | null;
  style: string;
  aspect_ratio: string;
  quality: number;
  api_type: string;
}

export const createGeneratedImage = async (
  payload: CreateGeneratedImagePayload
): Promise<GeneratedImageRecord> => {
  const response = await fetchJson<{ data: GeneratedImageRecord }>(
    '/generated-images',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  return response.data;
};

export const deleteGeneratedImage = async (id: number): Promise<void> => {
  await fetchJson(`/generated-images/${id}`, {
    method: 'DELETE',
  });
};

export const clearGeneratedImages = async (): Promise<void> => {
  await fetchJson('/generated-images', {
    method: 'DELETE',
  });
};
