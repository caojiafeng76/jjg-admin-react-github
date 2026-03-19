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
      'syney-safe-part-settings': {
        Row: {
          id: string
          part_no: string
          need_print_label: boolean
          is_safe_part: boolean
          remark: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          part_no: string
          need_print_label?: boolean
          is_safe_part?: boolean
          remark?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          part_no?: string
          need_print_label?: boolean
          is_safe_part?: boolean
          remark?: string | null
          created_at?: string | null
          updated_at?: string | null
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
      process_standards: {
        Row: {
          created_at: string
          id: string
          model: string
          operation: string
          standard_seconds: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          model: string
          operation: string
          standard_seconds: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          operation?: string
          standard_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      production_order_items: {
        Row: {
          bonus_seconds: number
          created_at: string
          customer_model: string | null
          defect_hours: number | null
          defect_quantity_1: number
          defect_quantity_2: number
          defect_reason_1: string | null
          defect_reason_2: string | null
          id: string
          length_mm: number | null
          operation: string
          order_id: string
          product_model: string | null
          project_no: string
          qualified_hours: number | null
          qualified_quantity: number
          standard_seconds: number
          updated_at: string
        }
        Insert: {
          bonus_seconds?: number
          created_at?: string
          customer_model?: string | null
          defect_hours?: number | null
          defect_quantity_1?: number
          defect_quantity_2?: number
          defect_reason_1?: string | null
          defect_reason_2?: string | null
          id?: string
          length_mm?: number | null
          operation: string
          order_id: string
          product_model?: string | null
          project_no: string
          qualified_hours?: number | null
          qualified_quantity?: number
          standard_seconds: number
          updated_at?: string
        }
        Update: {
          bonus_seconds?: string
          created_at?: string
          customer_model?: string | null
          defect_hours?: number | null
          defect_quantity_1?: number
          defect_quantity_2?: number
          defect_reason_1?: string | null
          defect_reason_2?: string | null
          id?: string
          length_mm?: number | null
          operation?: string
          order_id?: string
          product_model?: string | null
          project_no?: string
          qualified_hours?: number | null
          qualified_quantity?: number
          standard_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'production_order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'production_orders'
            referencedColumns: ['id']
          },
        ]
      }
      production_orders: {
        Row: {
          created_at: string
          efficiency: number | null
          employee_id: string | null
          id: string
          order_date: string
          remark: string | null
          status: string
          total_qualified_hours: number | null
          updated_at: string
          work_hours: number
        }
        Insert: {
          created_at?: string
          efficiency?: number | null
          employee_id?: string | null
          id?: string
          order_date?: string
          remark?: string | null
          status?: string
          total_qualified_hours?: number | null
          updated_at?: string
          work_hours: number
        }
        Update: {
          created_at?: string
          efficiency?: number | null
          employee_id?: string | null
          id?: string
          order_date?: string
          remark?: string | null
          status?: string
          total_qualified_hours?: number | null
          updated_at?: string
          work_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: 'production_orders_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      sales_orders: {
        Row: {
          color_name: string | null
          created_at: string | null
          customer_model: string | null
          id: string
          length_mm: number | null
          material_code: string | null
          material_name: string | null
          order_quantity: number | null
          package_name: string | null
          product_category: string | null
          product_delivery_date: string | null
          product_model: string | null
          project_no: string | null
          updated_at: string | null
          weight_per_meter_kg: number | null
        }
        Insert: {
          color_name?: string | null
          created_at?: string | null
          customer_model?: string | null
          id?: string
          length_mm?: number | null
          material_code?: string | null
          material_name?: string | null
          order_quantity?: number | null
          package_name?: string | null
          product_category?: string | null
          product_delivery_date?: string | null
          product_model?: string | null
          project_no?: string | null
          updated_at?: string | null
          weight_per_meter_kg?: number | null
        }
        Update: {
          color_name?: string | null
          created_at?: string | null
          customer_model?: string | null
          id?: string
          length_mm?: number | null
          material_code?: string | null
          material_name?: string | null
          order_quantity?: number | null
          package_name?: string | null
          product_category?: string | null
          product_delivery_date?: string | null
          product_model?: string | null
          project_no?: string | null
          updated_at?: string | null
          weight_per_meter_kg?: number | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
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
  EnumName extends PublicEnumNameOrOptions extends {
    schema: keyof Database
  }
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
  CompositeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never
