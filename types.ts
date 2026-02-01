export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface DesignStyle {
  id: string;
  name: string;
  prompt: string;
  thumbnailClass: string; // Tailwind color/gradient class for placeholder
}

export type LoadingState = 'idle' | 'uploading' | 'generating' | 'chatting';
