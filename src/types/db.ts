export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  locale: string;
  timezone: string;
  theme: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ConversationRow = {
  id: string;
  user_id: string;
  title: string;
  model: string;
  system_prompt: string | null;
  is_archived: boolean;
  is_pinned: boolean;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: string;
  content: string;
  model: string | null;
  client_message_id: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  superseded: boolean;
  metadata: Json;
  created_at: string;
};

export type MessageFeedbackRow = {
  id: string;
  message_id: string;
  user_id: string;
  vote: number;
  created_at: string;
};

export type AiModelRow = {
  id: string;
  slug: string;
  name: string;
  provider: string;
  description: string | null;
  context_window: number | null;
  is_enabled: boolean;
  is_free: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type UsageRecordRow = {
  id: string;
  user_id: string;
  conversation_id: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request_status: string;
  request_duration_ms: number | null;
  metadata: Json;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export type ApiKeyRow = {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type SavedSnippetRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  source_message_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactMessageRow = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AuditLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  metadata: Json;
  created_at: string;
};

export type SystemSettingsRow = {
  id: number;
  daily_message_limit: number;
  daily_token_limit: number;
  default_model: string;
  updated_at: string;
};

export type RateLimitWindowRow = {
  bucket_key: string;
  window_start: string;
  count: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          locale?: string;
          timezone?: string;
          theme?: string;
          role?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          locale?: string;
          timezone?: string;
          theme?: string;
          role?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      conversations: {
        Row: ConversationRow;
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          model: string;
          system_prompt?: string | null;
          is_archived?: boolean;
          is_pinned?: boolean;
          message_count?: number;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          is_archived?: boolean;
          is_pinned?: boolean;
          message_count?: number;
          last_message_at?: string | null;
          model?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: string;
          content: string;
          model?: string | null;
          client_message_id?: string | null;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          superseded?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          content?: string;
          superseded?: boolean;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          metadata?: Json;
        };
        Relationships: [];
      };
      message_feedback: {
        Row: MessageFeedbackRow;
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          vote: number;
          created_at?: string;
        };
        Update: {
          vote?: number;
        };
        Relationships: [];
      };
      ai_models: {
        Row: AiModelRow;
        Insert: {
          id?: string;
          slug: string;
          name: string;
          provider: string;
          description?: string | null;
          context_window?: number | null;
          is_enabled?: boolean;
          is_free?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          provider?: string;
          description?: string | null;
          context_window?: number | null;
          is_enabled?: boolean;
          is_free?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      usage_records: {
        Row: UsageRecordRow;
        Insert: {
          id?: string;
          user_id: string;
          conversation_id?: string | null;
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          request_status: string;
          request_duration_ms?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          request_status?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          action_url?: string | null;
          is_read?: boolean;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          is_read?: boolean;
          read_at?: string | null;
        };
        Relationships: [];
      };
      api_keys: {
        Row: ApiKeyRow;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          last_used_at?: string | null;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      saved_snippets: {
        Row: SavedSnippetRow;
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          source_message_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: ContactMessageRow;
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          subject: string;
          message: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      system_settings: {
        Row: SystemSettingsRow;
        Insert: {
          id: number;
          daily_message_limit?: number;
          daily_token_limit?: number;
          default_model: string;
          updated_at?: string;
        };
        Update: {
          daily_message_limit?: number;
          daily_token_limit?: number;
          default_model?: string;
        };
        Relationships: [];
      };
      rate_limit_windows: {
        Row: RateLimitWindowRow;
        Insert: {
          bucket_key: string;
          window_start: string;
          count: number;
        };
        Update: {
          count?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_rate_limit: {
        Args: { p_bucket: string; p_window_seconds: number; p_max: number };
        Returns: boolean;
      };
    };
  };
};

export type Profile = ProfileRow;
export type Conversation = ConversationRow;
export type Message = MessageRow;
export type AiModel = AiModelRow;
export type UsageRecord = UsageRecordRow;
export type Notification = NotificationRow;
export type ApiKey = ApiKeyRow;
export type SavedSnippet = SavedSnippetRow;
export type ContactMessage = ContactMessageRow;
export type AuditLog = AuditLogRow;
export type SystemSettings = SystemSettingsRow;
export type MessageFeedback = MessageFeedbackRow;
