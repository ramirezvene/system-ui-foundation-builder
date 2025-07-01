export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auditorias: {
        Row: {
          created_at: string
          data_inicio: string
          forma_inventario: string
          id: string
          numero_auditoria: string
          percentual_auditado: number | null
          tipo_auditoria: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_inicio?: string
          forma_inventario: string
          id?: string
          numero_auditoria: string
          percentual_auditado?: number | null
          tipo_auditoria: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_inicio?: string
          forma_inventario?: string
          id?: string
          numero_auditoria?: string
          percentual_auditado?: number | null
          tipo_auditoria?: string
          updated_at?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          created_at: string
          id: string
          matricula: string
          nome_funcionario: string
        }
        Insert: {
          created_at?: string
          id?: string
          matricula: string
          nome_funcionario: string
        }
        Update: {
          created_at?: string
          id?: string
          matricula?: string
          nome_funcionario?: string
        }
        Relationships: []
      }
      itens_auditados: {
        Row: {
          auditoria_id: string
          codigo_produto: string
          created_at: string
          id: string
          nome_produto: string
          quantidade_auditada: number
          quantidade_estoque: number
          usuario_matricula: string | null
          usuario_nome: string | null
        }
        Insert: {
          auditoria_id: string
          codigo_produto: string
          created_at?: string
          id?: string
          nome_produto: string
          quantidade_auditada?: number
          quantidade_estoque?: number
          usuario_matricula?: string | null
          usuario_nome?: string | null
        }
        Update: {
          auditoria_id?: string
          codigo_produto?: string
          created_at?: string
          id?: string
          nome_produto?: string
          quantidade_auditada?: number
          quantidade_estoque?: number
          usuario_matricula?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itens_auditados_auditoria_id_fkey"
            columns: ["auditoria_id"]
            isOneToOne: false
            referencedRelation: "auditorias"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          auditoria_id: string
          codigo_produto: string
          created_at: string
          id: string
          nome_produto: string
          quantidade_estoque: number
        }
        Insert: {
          auditoria_id: string
          codigo_produto: string
          created_at?: string
          id?: string
          nome_produto: string
          quantidade_estoque?: number
        }
        Update: {
          auditoria_id?: string
          codigo_produto?: string
          created_at?: string
          id?: string
          nome_produto?: string
          quantidade_estoque?: number
        }
        Relationships: [
          {
            foreignKeyName: "produtos_auditoria_id_fkey"
            columns: ["auditoria_id"]
            isOneToOne: false
            referencedRelation: "auditorias"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
