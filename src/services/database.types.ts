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
      admin_management_passwords: {
        Row: {
          created_at: string
          employee_id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_management_passwords_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
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
      job_base_settings: {
        Row: {
          created_at: string
          daily_work_hours: number
          hourly_fee: number | null
          id: string
          job_name: string
          monthly_standard_hours: number | null
          standard_income: number
          updated_at: string
          working_days: number
        }
        Insert: {
          created_at?: string
          daily_work_hours?: number
          hourly_fee?: number | null
          id?: string
          job_name: string
          monthly_standard_hours?: number | null
          standard_income?: number
          updated_at?: string
          working_days?: number
        }
        Update: {
          created_at?: string
          daily_work_hours?: number
          hourly_fee?: number | null
          id?: string
          job_name?: string
          monthly_standard_hours?: number | null
          standard_income?: number
          updated_at?: string
          working_days?: number
        }
        Relationships: []
      }
      machine_equipment_maintenances: {
        Row: {
          annual_runtime_hours: number
          created_at: string
          customer: string | null
          depreciation_rate: number | null
          depreciation_years: number
          electricity_unit_price: number
          equipment_hourly_rate: number | null
          hourly_electricity_fee: number | null
          id: string
          machine_name: string
          machine_value: number
          operation: string
          original_no: string | null
          power_kw: number
          remark: string | null
          sync_work_quantity: number
          unified_device_no: string
          updated_at: string
        }
        Insert: {
          annual_runtime_hours?: number
          created_at?: string
          customer?: string | null
          depreciation_rate?: number | null
          depreciation_years?: number
          electricity_unit_price?: number
          equipment_hourly_rate?: number | null
          hourly_electricity_fee?: number | null
          id?: string
          machine_name: string
          machine_value?: number
          operation: string
          original_no?: string | null
          power_kw?: number
          remark?: string | null
          sync_work_quantity?: number
          unified_device_no: string
          updated_at?: string
        }
        Update: {
          annual_runtime_hours?: number
          created_at?: string
          customer?: string | null
          depreciation_rate?: number | null
          depreciation_years?: number
          electricity_unit_price?: number
          equipment_hourly_rate?: number | null
          hourly_electricity_fee?: number | null
          id?: string
          machine_name?: string
          machine_value?: number
          operation?: string
          original_no?: string | null
          power_kw?: number
          remark?: string | null
          sync_work_quantity?: number
          unified_device_no?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_transfers: {
        Row: {
          audited_at: string | null
          created_at: string
          customer: string | null
          customer_model: string | null
          id: string
          inspector_name: string | null
          is_audited: boolean
          length_mm: number | null
          operator_employee_id: string
          operator_employee_ids: string[]
          operator_names: string[]
          product_model: string | null
          project_no: string
          recipient_name: string
          remark: string | null
          shift_leader_name: string | null
          target_workshop: string
          transfer_quantity: number
          updated_at: string
          uploaded_by_name: string | null
        }
        Insert: {
          audited_at?: string | null
          created_at?: string
          customer?: string | null
          customer_model?: string | null
          id?: string
          inspector_name?: string | null
          is_audited?: boolean
          length_mm?: number | null
          operator_employee_id: string
          operator_employee_ids?: string[]
          operator_names?: string[]
          product_model?: string | null
          project_no: string
          recipient_name: string
          remark?: string | null
          shift_leader_name?: string | null
          target_workshop: string
          transfer_quantity: number
          updated_at?: string
          uploaded_by_name?: string | null
        }
        Update: {
          audited_at?: string | null
          created_at?: string
          customer?: string | null
          customer_model?: string | null
          id?: string
          inspector_name?: string | null
          is_audited?: boolean
          length_mm?: number | null
          operator_employee_id?: string
          operator_employee_ids?: string[]
          operator_names?: string[]
          product_model?: string | null
          project_no?: string
          recipient_name?: string
          remark?: string | null
          shift_leader_name?: string | null
          target_workshop?: string
          transfer_quantity?: number
          updated_at?: string
          uploaded_by_name?: string | null
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
      notifications: {
        Row: {
          action_type: string
          actor_employee_id: string
          actor_name: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_read: boolean
          read_at: string | null
        }
        Insert: {
          action_type: string
          actor_employee_id: string
          actor_name: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_read?: boolean
          read_at?: string | null
        }
        Update: {
          action_type?: string
          actor_employee_id?: string
          actor_name?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_employee_id_fkey"
            columns: ["actor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      process_standards: {
        Row: {
          created_at: string
          customer: string | null
          cutting_fluid_rate: number
          daily_management_cost: number
          daily_total_hours: number
          equipment_cost: number | null
          equipment_no: string | null
          equipment_rate: number
          fixture_rate: number
          id: string
          inspection_cost: number | null
          inspection_seconds: number
          job_name: string | null
          labor_cost: number | null
          labor_rate: number
          length: number
          model: string
          operation: string
          overhead_cost: number | null
          part_no: string | null
          remark: string | null
          standard_seconds: number
          theoretical_seconds: number
          tool_rate: number
          tooling_consumable_cost: number | null
          total_cost: number | null
          updated_at: string
          uploaded_by_name: string | null
        }
        Insert: {
          created_at?: string
          customer?: string | null
          cutting_fluid_rate?: number
          daily_management_cost?: number
          daily_total_hours?: number
          equipment_cost?: number | null
          equipment_no?: string | null
          equipment_rate?: number
          fixture_rate?: number
          id?: string
          inspection_cost?: number | null
          inspection_seconds?: number
          job_name?: string | null
          labor_cost?: number | null
          labor_rate?: number
          length?: number
          model: string
          operation: string
          overhead_cost?: number | null
          part_no?: string | null
          remark?: string | null
          standard_seconds: number
          theoretical_seconds?: number
          tool_rate?: number
          tooling_consumable_cost?: number | null
          total_cost?: number | null
          updated_at?: string
          uploaded_by_name?: string | null
        }
        Update: {
          created_at?: string
          customer?: string | null
          cutting_fluid_rate?: number
          daily_management_cost?: number
          daily_total_hours?: number
          equipment_cost?: number | null
          equipment_no?: string | null
          equipment_rate?: number
          fixture_rate?: number
          id?: string
          inspection_cost?: number | null
          inspection_seconds?: number
          job_name?: string | null
          labor_cost?: number | null
          labor_rate?: number
          length?: number
          model?: string
          operation?: string
          overhead_cost?: number | null
          part_no?: string | null
          remark?: string | null
          standard_seconds?: number
          theoretical_seconds?: number
          tool_rate?: number
          tooling_consumable_cost?: number | null
          total_cost?: number | null
          updated_at?: string
          uploaded_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_standards_equipment_no_fkey"
            columns: ["equipment_no"]
            isOneToOne: false
            referencedRelation: "machine_equipment_maintenances"
            referencedColumns: ["unified_device_no"]
          },
          {
            foreignKeyName: "process_standards_job_name_fkey"
            columns: ["job_name"]
            isOneToOne: false
            referencedRelation: "job_base_settings"
            referencedColumns: ["job_name"]
          },
        ]
      }
      production_order_items: {
        Row: {
          created_at: string
          customer_model: string | null
          data_category: string
          defect_hours: number | null
          defect_quantity_1: number
          defect_quantity_2: number
          defect_reason_1: string | null
          defect_reason_2: string | null
          id: string
          incoming_qualified_quantity: number
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
          created_at?: string
          customer_model?: string | null
          data_category?: string
          defect_hours?: number | null
          defect_quantity_1?: number
          defect_quantity_2?: number
          defect_reason_1?: string | null
          defect_reason_2?: string | null
          id?: string
          incoming_qualified_quantity: number
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
          created_at?: string
          customer_model?: string | null
          data_category?: string
          defect_hours?: number | null
          defect_quantity_1?: number
          defect_quantity_2?: number
          defect_reason_1?: string | null
          defect_reason_2?: string | null
          id?: string
          incoming_qualified_quantity?: number
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
          shift: string
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
          shift?: string
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
          shift?: string
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
          customer: string | null
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
          customer?: string | null
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
          customer?: string | null
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
          english_name: string | null
          id: string
          is_safe_part: boolean
          name: string | null
          need_print_label: boolean
          part_code_prefix: string | null
          part_model: string | null
          part_no: string
          remark: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          english_name?: string | null
          id?: string
          is_safe_part?: boolean
          name?: string | null
          need_print_label?: boolean
          part_code_prefix?: string | null
          part_model?: string | null
          part_no: string
          remark?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          english_name?: string | null
          id?: string
          is_safe_part?: boolean
          name?: string | null
          need_print_label?: boolean
          part_code_prefix?: string | null
          part_model?: string | null
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
      get_job_base_setting_options: {
        Args: never
        Returns: {
          hourly_fee: number
          job_name: string
        }[]
      }
      get_job_hourly_fee: { Args: { target_job_name: string }; Returns: number }
      increment_serial_no: { Args: { increment_by: number }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_team_leader: { Args: never; Returns: boolean }
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
