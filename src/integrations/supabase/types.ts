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
      cadastro_loja: {
        Row: {
          cod_loja: number
          estado: string
          loja: string
          qtde_token: number | null
          st_token: number | null
        }
        Insert: {
          cod_loja: number
          estado: string
          loja: string
          qtde_token?: number | null
          st_token?: number | null
        }
        Update: {
          cod_loja?: number
          estado?: string
          loja?: string
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
          margem: number
          nome_subgrupo: string
        }
        Insert: {
          cod_subgrupo: number
          data_fim?: string | null
          data_inicio?: string | null
          margem: number
          nome_subgrupo: string
        }
        Update: {
          cod_subgrupo?: number
          data_fim?: string | null
          data_inicio?: string | null
          margem?: number
          nome_subgrupo?: string
        }
        Relationships: []
      }
      token_loja: {
        Row: {
          cod_loja: number
          codigo_token: string
          data_criacao: string | null
          id: number
          st_aprovado: number | null
        }
        Insert: {
          cod_loja: number
          codigo_token: string
          data_criacao?: string | null
          id?: number
          st_aprovado?: number | null
        }
        Update: {
          cod_loja?: number
          codigo_token?: string
          data_criacao?: string | null
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
