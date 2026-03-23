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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      employees: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          id: string
          is_active: boolean
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      material_transfers: {
        Row: {
          created_at: string
          customer_model: string | null
          id: string
          length_mm: number | null
          operator_employee_id: string
          product_model: string | null
          project_no: string
          recipient_name: string
          remark: string | null
          target_workshop: string
          transfer_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_model?: string | null
          id?: string
          length_mm?: number | null
          operator_employee_id: string
          product_model?: string | null
          project_no: string
          recipient_name: string
          remark?: string | null
          target_workshop: string
          transfer_quantity: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_model?: string | null
          id?: string
          length_mm?: number | null
          operator_employee_id?: string
          product_model?: string | null
          project_no?: string
          recipient_name?: string
          remark?: string | null
          target_workshop?: string
          transfer_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_transfers_operator_employee_id_fkey"
            columns: ["operator_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
          remark: string | null
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
          remark?: string | null
          standard_seconds: number
          updated_at?: string
        }
        Update: {
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
          operation?: string
          order_id?: string
          product_model?: string | null
          project_no?: string
          qualified_hours?: number | null
          qualified_quantity?: number
          remark?: string | null
          standard_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_product_model_operation_fkey"
            columns: ["product_model", "operation"]
            isOneToOne: false
            referencedRelation: "process_standards"
            referencedColumns: ["model", "operation"]
          },
        ]
      }
      production_orders: {
        Row: {
          audited_at: string | null
          created_at: string
          efficiency: number | null
          employee_id: string | null
          extra_qualified_hours: number
          id: string
          is_audited: boolean
          order_date: string
          remark: string | null
          status: string
          total_qualified_hours: number | null
          updated_at: string
          work_hours: number
        }
        Insert: {
          audited_at?: string | null
          created_at?: string
          efficiency?: number | null
          employee_id?: string | null
          extra_qualified_hours?: number
          id?: string
          is_audited?: boolean
          order_date?: string
          remark?: string | null
          status?: string
          total_qualified_hours?: number | null
          updated_at?: string
          work_hours: number
        }
        Update: {
          audited_at?: string | null
          created_at?: string
          efficiency?: number | null
          employee_id?: string | null
          extra_qualified_hours?: number
          id?: string
          is_audited?: boolean
          order_date?: string
          remark?: string | null
          status?: string
          total_qualified_hours?: number | null
          updated_at?: string
          work_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
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
      syney_safe_part_settings: {
        Row: {
          created_at: string | null
          id: string
          is_safe_part: boolean
          name: string | null
          need_print_label: boolean
          part_no: string
          remark: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_safe_part?: boolean
          name?: string | null
          need_print_label?: boolean
          part_no: string
          remark?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_safe_part?: boolean
          name?: string | null
          need_print_label?: boolean
          part_no?: string
          remark?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      "syney-po-items": {
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
            foreignKeyName: "syney-po-items_PoId_fkey"
            columns: ["PoId"]
            isOneToOne: false
            referencedRelation: "syney-pos"
            referencedColumns: ["id"]
          },
        ]
      }
      "syney-pos": {
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
      "syney-serial-no": {
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
      "syney-specs": {
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
      "syney-store-report-items": {
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
            foreignKeyName: "syney-store-report-items_No_fkey"
            columns: ["No"]
            isOneToOne: false
            referencedRelation: "syney-store-reports"
            referencedColumns: ["No"]
          },
        ]
      }
      "syney-store-reports": {
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
      current_employee_id: { Args: never; Returns: string }
      increment_serial_no: { Args: { increment_by: number }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      recalculate_production_order_totals: {
        Args: { target_order_id: string }
        Returns: undefined
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

