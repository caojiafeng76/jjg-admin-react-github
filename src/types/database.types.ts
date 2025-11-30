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
          product_delivery_date: string
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
          product_delivery_date: string
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
          product_delivery_date?: string
          product_model?: string | null
          project_no?: string | null
          updated_at?: string | null
          weight_per_meter_kg?: number | null
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
      workshop_processes: {
        Row: {
          created_at: string | null
          id: string
          process_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          process_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          process_name?: string
          updated_at?: string | null
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
      production_records: {
        Row: {
          created_at: string | null
          defect_reasons: Json
          defective_quantity: number
          id: string
          operator_ids: string[]
          order_id: string
          process_id: string
          production_date: string
          qualified_quantity: number
          remark: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          defect_reasons?: Json
          defective_quantity?: number
          id?: string
          operator_ids?: string[]
          order_id: string
          process_id: string
          production_date?: string
          qualified_quantity?: number
          remark?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          defect_reasons?: Json
          defective_quantity?: number
          id?: string
          operator_ids?: string[]
          order_id?: string
          process_id?: string
          production_date?: string
          qualified_quantity?: number
          remark?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_records_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "workshop_processes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_serial_no: { Args: { increment_by: number }; Returns: number }
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
