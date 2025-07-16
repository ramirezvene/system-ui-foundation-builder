export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      cadastro_estado: {
        Row: {
          created_at: string
          estado: string
          id: number
          nome_estado: string
          st_ativo: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado: string
          id?: number
          nome_estado: string
          st_ativo?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: number
          nome_estado?: string
          st_ativo?: number
          updated_at?: string
        }
        Relationships: []
      }
      cadastro_loja: {
        Row: {
          cidade_nome: string | null
          cod_loja: number
          dre_negativo: number | null
          estado: string
          loja: string
          meta_loja: number | null
          microregiao_nome: string | null
          qtde_token: number | null
          st_token: number | null
        }
        Insert: {
          cidade_nome?: string | null
          cod_loja: number
          dre_negativo?: number | null
          estado: string
          loja: string
          meta_loja?: number | null
          microregiao_nome?: string | null
          qtde_token?: number | null
          st_token?: number | null
        }
        Update: {
          cidade_nome?: string | null
          cod_loja?: number
          dre_negativo?: number | null
          estado?: string
          loja?: string
          meta_loja?: number | null
          microregiao_nome?: string | null
          qtde_token?: number | null
          st_token?: number | null
        }
        Relationships: []
      }
      cadastro_produto: {
        Row: {
          alcada: number | null
          aliq_pr: number | null
          aliq_rs: number | null
          aliq_sc: number | null
          cmg_pr: number | null
          cmg_rs: number | null
          cmg_sc: number | null
          id_produto: number
          ncm: string | null
          nome_produto: string
          observacao: string | null
          piscofins: number | null
          pmc_pr: number | null
          pmc_rs: number | null
          pmc_sc: number | null
          st_pricing: number | null
          st_ruptura: number | null
          subgrupo_id: number | null
        }
        Insert: {
          alcada?: number | null
          aliq_pr?: number | null
          aliq_rs?: number | null
          aliq_sc?: number | null
          cmg_pr?: number | null
          cmg_rs?: number | null
          cmg_sc?: number | null
          id_produto: number
          ncm?: string | null
          nome_produto: string
          observacao?: string | null
          piscofins?: number | null
          pmc_pr?: number | null
          pmc_rs?: number | null
          pmc_sc?: number | null
          st_pricing?: number | null
          st_ruptura?: number | null
          subgrupo_id?: number | null
        }
        Update: {
          alcada?: number | null
          aliq_pr?: number | null
          aliq_rs?: number | null
          aliq_sc?: number | null
          cmg_pr?: number | null
          cmg_rs?: number | null
          cmg_sc?: number | null
          id_produto?: number
          ncm?: string | null
          nome_produto?: string
          observacao?: string | null
          piscofins?: number | null
          pmc_pr?: number | null
          pmc_rs?: number | null
          pmc_sc?: number | null
          st_pricing?: number | null
          st_ruptura?: number | null
          subgrupo_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cadastro_produto_subgrupo_id_fkey"
            columns: ["subgrupo_id"]
            isOneToOne: false
            referencedRelation: "subgrupo_margem"
            referencedColumns: ["cod_subgrupo"]
          },
        ]
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
      produto_margem: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          desconto: number | null
          id: number
          id_produto: number
          margem: number
          margem_adc: number | null
          observacao: string | null
          st_ativo: number
          tipo_aplicacao: string
          tipo_margem: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          desconto?: number | null
          id?: number
          id_produto: number
          margem: number
          margem_adc?: number | null
          observacao?: string | null
          st_ativo?: number
          tipo_aplicacao: string
          tipo_margem?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          desconto?: number | null
          id?: number
          id_produto?: number
          margem?: number
          margem_adc?: number | null
          observacao?: string | null
          st_ativo?: number
          tipo_aplicacao?: string
          tipo_margem?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_produto_margem_produto"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "cadastro_produto"
            referencedColumns: ["id_produto"]
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
      subgrupo_margem: {
        Row: {
          cod_subgrupo: number
          data_fim: string | null
          data_inicio: string | null
          desconto: number | null
          margem: number
          margem_adc: number | null
          nome_subgrupo: string
          observacao: string | null
          st_ativo: number
        }
        Insert: {
          cod_subgrupo: number
          data_fim?: string | null
          data_inicio?: string | null
          desconto?: number | null
          margem: number
          margem_adc?: number | null
          nome_subgrupo: string
          observacao?: string | null
          st_ativo?: number
        }
        Update: {
          cod_subgrupo?: number
          data_fim?: string | null
          data_inicio?: string | null
          desconto?: number | null
          margem?: number
          margem_adc?: number | null
          nome_subgrupo?: string
          observacao?: string | null
          st_ativo?: number
        }
        Relationships: []
      }
      token_loja: {
        Row: {
          cod_loja: number
          codigo_token: string
          data_criacao: string | null
          data_validacao: string | null
          id: number
          st_aprovado: number | null
        }
        Insert: {
          cod_loja: number
          codigo_token: string
          data_criacao?: string | null
          data_validacao?: string | null
          id?: number
          st_aprovado?: number | null
        }
        Update: {
          cod_loja?: number
          codigo_token?: string
          data_criacao?: string | null
          data_validacao?: string | null
          id?: number
          st_aprovado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "token_loja_cod_loja_fkey"
            columns: ["cod_loja"]
            isOneToOne: false
            referencedRelation: "cadastro_loja"
            referencedColumns: ["cod_loja"]
          },
        ]
      }
      token_loja_detalhado: {
        Row: {
          cmg_produto: number | null
          codigo_token: number
          desc_alcada: string | null
          desconto: string | null
          id: number
          margem_uf: string | null
          margem_zvdc: string | null
          observacao: string | null
          preco_min: number | null
          preco_regul: number | null
          produto: string | null
          qtde_solic: number | null
          vlr_solic: number | null
        }
        Insert: {
          cmg_produto?: number | null
          codigo_token: number
          desc_alcada?: string | null
          desconto?: string | null
          id?: number
          margem_uf?: string | null
          margem_zvdc?: string | null
          observacao?: string | null
          preco_min?: number | null
          preco_regul?: number | null
          produto?: string | null
          qtde_solic?: number | null
          vlr_solic?: number | null
        }
        Update: {
          cmg_produto?: number | null
          codigo_token?: number
          desc_alcada?: string | null
          desconto?: string | null
          id?: number
          margem_uf?: string | null
          margem_zvdc?: string | null
          observacao?: string | null
          preco_min?: number | null
          preco_regul?: number | null
          produto?: string | null
          qtde_solic?: number | null
          vlr_solic?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "token_loja_detalhado_codigo_token_fkey"
            columns: ["codigo_token"]
            isOneToOne: false
            referencedRelation: "token_loja"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_token_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
