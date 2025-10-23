export interface CharacterApiModel {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  title: string | null;
  personality?: string | null;
  expertise?: string | null;
  tone?: string | null;
  tags?: string | null;
  video_url?: string | null;
  bio?: string | null;
  greeting?: string | null;
  intro_line?: string | null;
  source?: 'global' | 'user';
  age?: number | string | null;
  role?: string | null;
}

export interface CharacterCard {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  title: string;
  description: string;
  tags: string[];
  videoUrl?: string;
  source?: 'global' | 'user';
  greeting?: string | null;
  introLine?: string | null;
  age?: number | null;
  role?: string | null;
}

export interface ChatSummary {
  id: number;
  character_slug: string;
  character_name: string;
  character_avatar: string | null;
  character_title: string | null;
  character_role?: string | null;
  character_age?: number | null;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
}

export interface ChatMessage {
  id?: number;
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
}

export interface CharacterChatDetail {
  character: {
    slug: string;
    name: string;
    avatar: string | null;
    title: string | null;
    video_url: string | null;
    intro_line?: string | null;
    greeting?: string | null;
    source?: 'global' | 'user';
    role?: string | null;
    age?: number | string | null;
  };
  messages: ChatMessage[];
}

export interface GeneratedImageRecord {
  id: number;
  user_id: string;
  remote_url: string;
  prompt: string;
  negative_prompt: string | null;
  style: string;
  aspect_ratio: string;
  quality: number;
  api_type: string;
  created_at: string;
}

export type GeneratedImageReportReason =
  | 'sexual_content'
  | 'violent_content'
  | 'hate_speech'
  | 'self_harm'
  | 'spam'
  | 'other';

export interface GeneratedVideoRecord {
  id: number;
  user_id: string;
  remote_url: string;
  prompt: string;
  model: string | null;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  created_at: string;
}

export interface UserCharacterRecord {
  id: number;
  user_id: string;
  name: string;
  slug: string;
  avatar: string | null;
  title: string | null;
  personality: string | null;
  backstory: string | null;
  expertise: string | null;
  traits: string[];
  greeting: string | null;
  voice: string | null;
  tone: string | null;
  memory_mode: 'user' | 'global' | 'none';
  visibility: 'private' | 'public';
  created_at: string;
  updated_at: string | null;
  source: 'user';
  age?: number | null;
  role?: string | null;
}
