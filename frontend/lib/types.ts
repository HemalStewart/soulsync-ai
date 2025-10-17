export interface CharacterApiModel {
  id: number;
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
}

export interface CharacterCard {
  id: number;
  name: string;
  slug: string;
  avatar: string;
  title: string;
  description: string;
  tags: string[];
  videoUrl?: string;
}

export interface ChatSummary {
  id: number;
  character_slug: string;
  character_name: string;
  character_avatar: string | null;
  character_title: string | null;
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
