export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_trials: {
        Row: {
          ends_at: string
          started_at: string
          user_id: string
        }
        Insert: {
          ends_at?: string
          started_at?: string
          user_id?: string
        }
        Update: {
          ends_at?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_ai_access: {
        Row: {
          denial: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          denial: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          denial?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          attention_message: string | null
          created_at: string
          document_count: number
          id: string
          last_synced_at: string | null
          notion_cursor: Json | null
          notion_oauth_nonce: string | null
          provider: string
          source: string
          status: Database["public"]["Enums"]["connection_status"]
          user_id: string
        }
        Insert: {
          attention_message?: string | null
          created_at?: string
          document_count?: number
          id?: string
          last_synced_at?: string | null
          notion_cursor?: Json | null
          notion_oauth_nonce?: string | null
          provider: string
          source?: string
          status?: Database["public"]["Enums"]["connection_status"]
          user_id?: string
        }
        Update: {
          attention_message?: string | null
          created_at?: string
          document_count?: number
          id?: string
          last_synced_at?: string | null
          notion_cursor?: Json | null
          notion_oauth_nonce?: string | null
          provider?: string
          source?: string
          status?: Database["public"]["Enums"]["connection_status"]
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_sample: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_sample?: boolean
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_sample?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string
          content_hash: string | null
          created_at: string
          excluded: boolean
          external_id: string
          external_url: string
          id: string
          inaccessible: boolean
          is_sample: boolean
          search_vector: unknown
          source: Database["public"]["Enums"]["document_source"]
          source_modified_at: string | null
          status: Database["public"]["Enums"]["document_status"]
          summary: string
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          content_hash?: string | null
          created_at?: string
          excluded?: boolean
          external_id: string
          external_url: string
          id?: string
          inaccessible?: boolean
          is_sample?: boolean
          search_vector?: unknown
          source: Database["public"]["Enums"]["document_source"]
          source_modified_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          summary?: string
          tags?: string[]
          title: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string
          content_hash?: string | null
          created_at?: string
          excluded?: boolean
          external_id?: string
          external_url?: string
          id?: string
          inaccessible?: boolean
          is_sample?: boolean
          search_vector?: unknown
          source?: Database["public"]["Enums"]["document_source"]
          source_modified_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          summary?: string
          tags?: string[]
          title?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          answer_metadata: Json
          citations: Json
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_sample: boolean
          role: Database["public"]["Enums"]["message_role"]
          user_id: string
        }
        Insert: {
          answer_metadata?: Json
          citations?: Json
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_sample?: boolean
          role: Database["public"]["Enums"]["message_role"]
          user_id?: string
        }
        Update: {
          answer_metadata?: Json
          citations?: Json
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_sample?: boolean
          role?: Database["public"]["Enums"]["message_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment: string
          id?: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_runs: {
        Row: {
          connection_id: string
          error_message: string | null
          finished_at: string | null
          id: string
          inaccessible_documents: number
          is_sample: boolean
          lease_until: string | null
          new_documents: number
          progress: Json
          started_at: string
          status: Database["public"]["Enums"]["sync_status"]
          trigger: string
          updated_documents: number
          user_id: string
        }
        Insert: {
          connection_id: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          inaccessible_documents?: number
          is_sample?: boolean
          lease_until?: string | null
          new_documents?: number
          progress?: Json
          started_at?: string
          status?: Database["public"]["Enums"]["sync_status"]
          trigger?: string
          updated_documents?: number
          user_id?: string
        }
        Update: {
          connection_id?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          inaccessible_documents?: number
          is_sample?: boolean
          lease_until?: string | null
          new_documents?: number
          progress?: Json
          started_at?: string
          status?: Database["public"]["Enums"]["sync_status"]
          trigger?: string
          updated_documents?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_runs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_approvals: {
        Row: {
          approved_at: string | null
          decided_at: string | null
          registered_at: string
          status: Database["public"]["Enums"]["approval_status"]
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          decided_at?: string | null
          registered_at?: string
          status?: Database["public"]["Enums"]["approval_status"]
          user_id?: string
        }
        Update: {
          approved_at?: string | null
          decided_at?: string | null
          registered_at?: string
          status?: Database["public"]["Enums"]["approval_status"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decide_user_approval: {
        Args: {
          decision: Database["public"]["Enums"]["approval_status"]
          target_user: string
        }
        Returns: undefined
      }
      delete_sample_data: { Args: never; Returns: undefined }
      ensure_app_trial: {
        Args: never
        Returns: {
          ends_at: string
          started_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "app_trials"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      finish_notion_sync:
        | {
            Args: {
              new_count: number
              sync_id: string
              sync_progress: Json
              updated_count: number
            }
            Returns: number
          }
        | {
            Args: {
              new_count: number
              owner: string
              sync_id: string
              sync_progress: Json
              updated_count: number
            }
            Returns: number
          }
      has_app_access: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      load_sample_data: { Args: never; Returns: undefined }
      search_chat_documents: {
        Args: { question: string }
        Returns: {
          document_id: string
          excerpt: string
          modified_at: string
          rank: number
          source: Database["public"]["Enums"]["document_source"]
          title: string
        }[]
      }
      search_chat_documents_by_date: {
        Args: { period_end?: string; period_start?: string; topic?: string }
        Returns: {
          document_id: string
          excerpt: string
          modified_at: string
          rank: number
          source: Database["public"]["Enums"]["document_source"]
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      approval_status: "pendiente" | "aprobado" | "rechazado"
      connection_status: "conectado" | "desconectado" | "proximamente"
      document_source:
        | "notion"
        | "drive"
        | "dropbox"
        | "granola"
        | "garmin"
        | "gmail"
      document_status: "indexado" | "procesando" | "error"
      document_type: "nota" | "pdf" | "reunion" | "entreno"
      message_role: "user" | "assistant"
      sync_status: "en_curso" | "completada" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      approval_status: ["pendiente", "aprobado", "rechazado"],
      connection_status: ["conectado", "desconectado", "proximamente"],
      document_source: [
        "notion",
        "drive",
        "dropbox",
        "granola",
        "garmin",
        "gmail",
      ],
      document_status: ["indexado", "procesando", "error"],
      document_type: ["nota", "pdf", "reunion", "entreno"],
      message_role: ["user", "assistant"],
      sync_status: ["en_curso", "completada", "error"],
    },
  },
} as const
