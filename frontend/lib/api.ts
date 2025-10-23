import {
  CharacterApiModel,
  CharacterCard,
  CharacterChatDetail,
  ChatMessage,
  ChatSummary,
  GeneratedImageRecord,
  GeneratedImageReportReason,
  GeneratedVideoRecord,
  UserCharacterRecord,
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
    const error = new Error(
      typeof message === 'string'
        ? message
        : message?.message ?? response.statusText
    ) as Error & { status?: number; payload?: unknown };
    error.status = response.status;
    error.payload = message;
    throw error;
  }

  return (isJson ? response.json() : response.text()) as Promise<T>;
};

const mapCharacter = (character: CharacterApiModel): CharacterCard => {
  const tags = parseDelimitedList(character.tags);
  const description =
    character.personality ||
    character.title ||
    character.role ||
    'Always ready for a great conversation.';

  const isUserSource = character.source === 'user';
  const rawAvatar = typeof character.avatar === 'string' ? character.avatar.trim() : '';
  const avatar = rawAvatar !== ''
    ? rawAvatar
    : isUserSource
      ? ''
      : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop';
  const rawRole = typeof character.role === 'string' ? character.role.trim() : '';
  const role = rawRole !== '' ? rawRole : null;
  const age =
    typeof character.age === 'number'
      ? character.age
      : typeof character.age === 'string' && character.age.trim() !== ''
        ? Number.isFinite(Number(character.age)) ? Number(character.age) : null
        : null;
  const rawIntroLine =
    typeof character.intro_line === 'string' ? character.intro_line.trim() : '';
  const rawGreeting =
    typeof character.greeting === 'string' ? character.greeting.trim() : '';
  const introLine = rawIntroLine !== '' ? rawIntroLine : rawGreeting;
  const greeting =
    rawGreeting !== ''
      ? rawGreeting
      : rawIntroLine !== ''
        ? rawIntroLine
        : null;
  const rawTitle = typeof character.title === 'string' ? character.title.trim() : '';
  const title =
    rawTitle !== ''
      ? rawTitle
      : role ?? 'AI Companion';

  return {
    id: character.id,
    name: character.name,
    slug: character.slug,
    avatar,
    title,
    description,
    tags: tags.length ? tags : ['AI Companion'],
    videoUrl: character.video_url || undefined,
    source: character.source ?? 'global',
    greeting,
    introLine: introLine || null,
    role,
    age: age ?? null,
  };
};

export interface GetCharactersOptions {
  includeUser?: boolean;
  userId?: string | null;
}

export const getCharacters = async (
  options: GetCharactersOptions = {}
): Promise<CharacterCard[]> => {
  const params = new URLSearchParams();

  if (options.includeUser) {
    params.set('include_user', 'true');
  }

  if (options.userId) {
    params.set('user_id', options.userId);
  }

  const query = params.toString();
  const endpoint = query ? `/characters?${query}` : '/characters';

  const payload = await fetchJson<{ data: CharacterApiModel[] }>(endpoint);
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
): Promise<{
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  coinBalance?: number;
}> => {
  const payload = await fetchJson<{
    userMessage: ChatMessage;
    aiMessage: ChatMessage;
    coin_balance?: number;
  }>(`/chats/${slug}`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  return {
    userMessage: payload.userMessage,
    aiMessage: payload.aiMessage,
    coinBalance:
      typeof payload.coin_balance === 'number'
        ? payload.coin_balance
        : undefined,
  };
};

export interface ShareChatMediaPayload {
  type: 'image' | 'video';
  url: string;
  title?: string | null;
  thumbnailUrl?: string | null;
}

export const shareChatMedia = async (
  slug: string,
  payload: ShareChatMediaPayload
): Promise<ChatMessage> => {
  const response = await fetchJson<{ message: ChatMessage }>(
    `/chats/${slug}/media`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  return response.message;
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

export const getCoinBalance = async (): Promise<number> => {
  const response = await fetchJson<{ balance: number }>('/coins');
  return typeof response.balance === 'number' ? response.balance : 0;
};

export const listGeneratedVideos = async (
  userId?: string | null,
  limit = 12,
): Promise<GeneratedVideoRecord[]> => {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (userId) {
    params.set('user_id', userId);
  }

  const query = params.toString();
  const payload = await fetchJson<{ data: GeneratedVideoRecord[] }>(
    `/generated-videos${query ? `?${query}` : ''}`,
  );

  return payload.data ?? [];
};

export interface CreateGeneratedVideoPayload {
  remote_url: string;
  prompt: string;
  model?: string;
  duration_seconds?: number | null;
  thumbnail_url?: string | null;
}

export const createGeneratedVideo = async (
  payload: CreateGeneratedVideoPayload,
): Promise<{ record: GeneratedVideoRecord; coinBalance?: number }> => {
  const response = await fetchJson<{
    data: GeneratedVideoRecord;
    coin_balance?: number;
  }>(
    '/generated-videos',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  return {
    record: response.data,
    coinBalance:
      typeof response.coin_balance === 'number'
        ? response.coin_balance
        : undefined,
  };
};

export const deleteGeneratedVideo = async (id: number): Promise<void> => {
  await fetchJson(`/generated-videos/${id}`, {
    method: 'DELETE',
  });
};

export const clearGeneratedVideos = async (): Promise<void> => {
  await fetchJson('/generated-videos', {
    method: 'DELETE',
  });
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
): Promise<{ record: GeneratedImageRecord; coinBalance?: number }> => {
  const response = await fetchJson<{
    data: GeneratedImageRecord;
    coin_balance?: number;
  }>(
    '/generated-images',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  return {
    record: response.data,
    coinBalance:
      typeof response.coin_balance === 'number'
        ? response.coin_balance
        : undefined,
  };
};

export interface ReportGeneratedImagePayload {
  reason: GeneratedImageReportReason;
  details?: string | null;
}

export const reportGeneratedImage = async (
  id: number,
  payload: ReportGeneratedImagePayload
): Promise<{ message: string }> => {
  const response = await fetchJson<{ message?: string }>(
    `/generated-images/${id}/report`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  const message =
    typeof response.message === 'string' && response.message.trim() !== ''
      ? response.message.trim()
      : 'Report submitted.';

  return { message };
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

export interface CreateUserCharacterPayload {
  name: string;
  title: string;
  avatar?: string | null;
  personality: string;
  backstory?: string;
  expertise?: string;
  traits: string[];
  greeting?: string;
  tone?: string;
  voice?: string;
  memory_mode: 'user' | 'global' | 'none';
  visibility: 'private' | 'public';
  age?: number | null;
}

export const getUserCharacters = async (): Promise<UserCharacterRecord[]> => {
  const payload = await fetchJson<{ data: UserCharacterRecord[] }>(
    '/user-characters'
  );

  return payload.data ?? [];
};

export const createUserCharacter = async (
  payload: CreateUserCharacterPayload
): Promise<{ record: UserCharacterRecord; coinBalance?: number }> => {
  const response = await fetchJson<{
    data: UserCharacterRecord;
    coin_balance?: number;
  }>(
    '/user-characters',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  return {
    record: response.data,
    coinBalance:
      typeof response.coin_balance === 'number'
        ? response.coin_balance
        : undefined,
  };
};

export const updateUserCharacter = async (
  id: string,
  payload: Partial<CreateUserCharacterPayload>
): Promise<UserCharacterRecord> => {
  const response = await fetchJson<{ data: UserCharacterRecord }>(
    `/user-characters/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );

  return response.data;
};
