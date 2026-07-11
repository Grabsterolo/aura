export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      approval_queue: {
        Row: {
          estado: string
          fecha: string
          id: string
          outreach_attempt_id: string
          owner_id: string
          revisado_por: string | null
        }
        Insert: {
          estado?: string
          fecha?: string
          id?: string
          outreach_attempt_id: string
          owner_id?: string
          revisado_por?: string | null
        }
        Update: {
          estado?: string
          fecha?: string
          id?: string
          outreach_attempt_id?: string
          owner_id?: string
          revisado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_queue_outreach_attempt_id_fkey"
            columns: ["outreach_attempt_id"]
            isOneToOne: false
            referencedRelation: "outreach_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          fecha: string
          funcionalidad_sitio: Json
          id: string
          medio_contacto: Json
          owner_id: string
          potencial_oportunidad: Json
          prospect_id: string
          velocidad: Json | null
        }
        Insert: {
          fecha?: string
          funcionalidad_sitio?: Json
          id?: string
          medio_contacto?: Json
          owner_id?: string
          potencial_oportunidad?: Json
          prospect_id: string
          velocidad?: Json | null
        }
        Update: {
          fecha?: string
          funcionalidad_sitio?: Json
          id?: string
          medio_contacto?: Json
          owner_id?: string
          potencial_oportunidad?: Json
          prospect_id?: string
          velocidad?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audits_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      aura_actions: {
        Row: {
          fecha: string
          id: string
          input: Json
          output: Json
          owner_id: string
          prospect_id: string
          razonamiento: string | null
          tipo_accion: string
        }
        Insert: {
          fecha?: string
          id?: string
          input?: Json
          output?: Json
          owner_id?: string
          prospect_id: string
          razonamiento?: string | null
          tipo_accion: string
        }
        Update: {
          fecha?: string
          id?: string
          input?: Json
          output?: Json
          owner_id?: string
          prospect_id?: string
          razonamiento?: string | null
          tipo_accion?: string
        }
        Relationships: [
          {
            foreignKeyName: "aura_actions_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          canal: string
          creado_en: string
          criterio_busqueda: Json
          estado: string
          id: string
          industria: string | null
          nombre: string
          owner_id: string
          tono_voz: string | null
          umbral_score: number
          zona: string | null
        }
        Insert: {
          canal?: string
          creado_en?: string
          criterio_busqueda?: Json
          estado?: string
          id?: string
          industria?: string | null
          nombre: string
          owner_id?: string
          tono_voz?: string | null
          umbral_score?: number
          zona?: string | null
        }
        Update: {
          canal?: string
          creado_en?: string
          criterio_busqueda?: Json
          estado?: string
          id?: string
          industria?: string | null
          nombre?: string
          owner_id?: string
          tono_voz?: string | null
          umbral_score?: number
          zona?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          actualizado_en: string
          canal: string
          estado: string
          grado_interes: string | null
          id: string
          mensajes: Json
          owner_id: string
          prospect_id: string
        }
        Insert: {
          actualizado_en?: string
          canal?: string
          estado?: string
          grado_interes?: string | null
          id?: string
          mensajes?: Json
          owner_id?: string
          prospect_id: string
        }
        Update: {
          actualizado_en?: string
          canal?: string
          estado?: string
          grado_interes?: string | null
          id?: string
          mensajes?: Json
          owner_id?: string
          prospect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_attempts: {
        Row: {
          angulo_usado: string | null
          canal: string
          contenido: string | null
          creado_en: string
          estado: string
          fecha_por_estado: Json
          id: string
          owner_id: string
          prospect_id: string
        }
        Insert: {
          angulo_usado?: string | null
          canal?: string
          contenido?: string | null
          creado_en?: string
          estado?: string
          fecha_por_estado?: Json
          id?: string
          owner_id?: string
          prospect_id: string
        }
        Update: {
          angulo_usado?: string | null
          canal?: string
          contenido?: string | null
          creado_en?: string
          estado?: string
          fecha_por_estado?: Json
          id?: string
          owner_id?: string
          prospect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_attempts_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_context: {
        Row: {
          creado_en: string
          id: string
          link_id_unico: string
          owner_id: string
          prospect_id: string
          resumen_hallazgo: string | null
          tono_sugerido: string | null
        }
        Insert: {
          creado_en?: string
          id?: string
          link_id_unico: string
          owner_id?: string
          prospect_id: string
          resumen_hallazgo?: string | null
          tono_sugerido?: string | null
        }
        Update: {
          creado_en?: string
          id?: string
          link_id_unico?: string
          owner_id?: string
          prospect_id?: string
          resumen_hallazgo?: string | null
          tono_sugerido?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_context_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          barrio: string | null
          campaign_id: string | null
          categoria: string | null
          contactable: boolean | null
          contacto: Json
          creado_en: string
          estado: string
          fuente: string | null
          fuente_ids: Json
          id: string
          lat: number | null
          lon: number | null
          nombre_negocio: string
          nombre_normalizado: string | null
          owner_id: string
        }
        Insert: {
          barrio?: string | null
          campaign_id?: string | null
          categoria?: string | null
          contactable?: boolean | null
          contacto?: Json
          creado_en?: string
          estado?: string
          fuente?: string | null
          fuente_ids?: Json
          id?: string
          lat?: number | null
          lon?: number | null
          nombre_negocio: string
          nombre_normalizado?: string | null
          owner_id?: string
        }
        Update: {
          barrio?: string | null
          campaign_id?: string | null
          categoria?: string | null
          contactable?: boolean | null
          contacto?: Json
          creado_en?: string
          estado?: string
          fuente?: string | null
          fuente_ids?: Json
          id?: string
          lat?: number | null
          lon?: number | null
          nombre_negocio?: string
          nombre_normalizado?: string | null
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospects_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          criterio_usado: Json
          fecha: string
          id: string
          owner_id: string
          prospect_id: string
          puntaje: number
        }
        Insert: {
          criterio_usado?: Json
          fecha?: string
          id?: string
          owner_id?: string
          prospect_id: string
          puntaje: number
        }
        Update: {
          criterio_usado?: Json
          fecha?: string
          id?: string
          owner_id?: string
          prospect_id?: string
          puntaje?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      immutable_unaccent: { Args: { "": string }; Returns: string }
      normalize_nombre_negocio: { Args: { "": string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
