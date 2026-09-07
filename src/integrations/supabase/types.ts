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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      consultorios: {
        Row: {
          andar: string
          conexao_obs: string | null
          conexao_status: string
          cpu_obs: string | null
          cpu_status: string
          created_at: string
          especialidade: string | null
          estabilizador_obs: string | null
          estabilizador_status: string
          id: string
          medico1_crm: string | null
          medico1_nome: string | null
          medico2_crm: string | null
          medico2_nome: string | null
          medico3_crm: string | null
          medico3_nome: string | null
          monitor_obs: string | null
          monitor_status: string
          numero: string
          observacoes: string | null
          perifericos_obs: string | null
          perifericos_status: string
          sistemas_obs: string | null
          sistemas_status: string
          updated_at: string
        }
        Insert: {
          andar: string
          conexao_obs?: string | null
          conexao_status?: string
          cpu_obs?: string | null
          cpu_status?: string
          created_at?: string
          especialidade?: string | null
          estabilizador_obs?: string | null
          estabilizador_status?: string
          id?: string
          medico1_crm?: string | null
          medico1_nome?: string | null
          medico2_crm?: string | null
          medico2_nome?: string | null
          medico3_crm?: string | null
          medico3_nome?: string | null
          monitor_obs?: string | null
          monitor_status?: string
          numero: string
          observacoes?: string | null
          perifericos_obs?: string | null
          perifericos_status?: string
          sistemas_obs?: string | null
          sistemas_status?: string
          updated_at?: string
        }
        Update: {
          andar?: string
          conexao_obs?: string | null
          conexao_status?: string
          cpu_obs?: string | null
          cpu_status?: string
          created_at?: string
          especialidade?: string | null
          estabilizador_obs?: string | null
          estabilizador_status?: string
          id?: string
          medico1_crm?: string | null
          medico1_nome?: string | null
          medico2_crm?: string | null
          medico2_nome?: string | null
          medico3_crm?: string | null
          medico3_nome?: string | null
          monitor_obs?: string | null
          monitor_status?: string
          numero?: string
          observacoes?: string | null
          perifericos_obs?: string | null
          perifericos_status?: string
          sistemas_obs?: string | null
          sistemas_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      historico: {
        Row: {
          consultorio_id: string
          created_at: string
          data: string
          descricao: string
          equipamento: string
          id: string
          responsavel: string
          tipo: string
        }
        Insert: {
          consultorio_id: string
          created_at?: string
          data?: string
          descricao: string
          equipamento: string
          id?: string
          responsavel: string
          tipo: string
        }
        Update: {
          consultorio_id?: string
          created_at?: string
          data?: string
          descricao?: string
          equipamento?: string
          id?: string
          responsavel?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_consultorio_id_fkey"
            columns: ["consultorio_id"]
            isOneToOne: false
            referencedRelation: "consultorios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
