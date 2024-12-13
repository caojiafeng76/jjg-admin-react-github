export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      'syney-po-items': {
        Row: {
          created_at: string
          id: number
          No: string | null
          ParamSpec: string | null
          PartCode: string | null
          PartModel: string | null
          PartName: string | null
          PartName2: string | null
          PartNo: string | null
          PoId: number | null
          Qty: number | null
          Remark: string | null
          SONo: string | null
          Spec: string | null
          Unit: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          No?: string | null
          ParamSpec?: string | null
          PartCode?: string | null
          PartModel?: string | null
          PartName?: string | null
          PartName2?: string | null
          PartNo?: string | null
          PoId?: number | null
          Qty?: number | null
          Remark?: string | null
          SONo?: string | null
          Spec?: string | null
          Unit?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          No?: string | null
          ParamSpec?: string | null
          PartCode?: string | null
          PartModel?: string | null
          PartName?: string | null
          PartName2?: string | null
          PartNo?: string | null
          PoId?: number | null
          Qty?: number | null
          Remark?: string | null
          SONo?: string | null
          Spec?: string | null
          Unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'syney-po-items_PoId_fkey'
            columns: ['PoId']
            isOneToOne: false
            referencedRelation: 'syney-pos'
            referencedColumns: ['id']
          },
        ]
      }
      'syney-pos': {
        Row: {
          Brand: string | null
          created_at: string
          EndDate: string | null
          id: number
          No: string | null
          Qty: number | null
          Remark: string | null
          SerialNo: number | null
          SONo: string | null
          Spec: string | null
          Status: string | null
          Technique: string | null
        }
        Insert: {
          Brand?: string | null
          created_at?: string
          EndDate?: string | null
          id?: number
          No?: string | null
          Qty?: number | null
          Remark?: string | null
          SerialNo?: number | null
          SONo?: string | null
          Spec?: string | null
          Status?: string | null
          Technique?: string | null
        }
        Update: {
          Brand?: string | null
          created_at?: string
          EndDate?: string | null
          id?: number
          No?: string | null
          Qty?: number | null
          Remark?: string | null
          SerialNo?: number | null
          SONo?: string | null
          Spec?: string | null
          Status?: string | null
          Technique?: string | null
        }
        Relationships: []
      }
      'syney-serial-no': {
        Row: {
          created_at: string
          id: number
          SyneySerialNo: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          SyneySerialNo?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          SyneySerialNo?: number | null
        }
        Relationships: []
      }
      'syney-specs': {
        Row: {
          created_at: string
          id: number
          ParamSpec: string | null
          PartName: string | null
          PartNo: string | null
          Spec: string | null
          Unit: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          ParamSpec?: string | null
          PartName?: string | null
          PartNo?: string | null
          Spec?: string | null
          Unit?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          ParamSpec?: string | null
          PartName?: string | null
          PartNo?: string | null
          Spec?: string | null
          Unit?: string | null
        }
        Relationships: []
      }
      'syney-store-report-items': {
        Row: {
          created_at: string
          id: number
          No: string | null
          ParamSpec: string | null
          PartName: string | null
          PartNo: string | null
          Qty: number | null
          Remark: string | null
          SONo: string | null
          Spec: string | null
          TaxTotalPrice: number | null
          TaxUnitPrice: number | null
          Unit: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          No?: string | null
          ParamSpec?: string | null
          PartName?: string | null
          PartNo?: string | null
          Qty?: number | null
          Remark?: string | null
          SONo?: string | null
          Spec?: string | null
          TaxTotalPrice?: number | null
          TaxUnitPrice?: number | null
          Unit?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          No?: string | null
          ParamSpec?: string | null
          PartName?: string | null
          PartNo?: string | null
          Qty?: number | null
          Remark?: string | null
          SONo?: string | null
          Spec?: string | null
          TaxTotalPrice?: number | null
          TaxUnitPrice?: number | null
          Unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'syney-store-report-items_No_fkey'
            columns: ['No']
            isOneToOne: false
            referencedRelation: 'syney-store-reports'
            referencedColumns: ['No']
          },
        ]
      }
      'syney-store-reports': {
        Row: {
          created_at: string
          id: number
          No: string
          Status: string
          TotalAmount: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          No: string
          Status?: string
          TotalAmount?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          No?: string
          Status?: string
          TotalAmount?: number | null
        }
        Relationships: []
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

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never
