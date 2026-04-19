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
    PostgrestVersion: '13.0.5'
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
            foreignKeyName: 'admin_management_passwords_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: true
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      attendance_details: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
          time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          name: string
          time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
          time?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          auth_user_id: string | null
          coefficient: number
          created_at: string | null
          hourly_wage: number
          id: string
          is_active: boolean
          job_name: string | null
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          coefficient?: number
          created_at?: string | null
          hourly_wage?: number
          id?: string
          is_active?: boolean
          job_name?: string | null
          name: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          coefficient?: number
          created_at?: string | null
          hourly_wage?: number
          id?: string
          is_active?: boolean
          job_name?: string | null
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'employees_job_name_fkey'
            columns: ['job_name']
            isOneToOne: false
            referencedRelation: 'job_base_settings'
            referencedColumns: ['job_name']
          },
        ]
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
      labor_protection_data: {
        Row: {
          category: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          updated_at?: string
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
            foreignKeyName: 'material_transfers_operator_employee_id_fkey'
            columns: ['operator_employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
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
            foreignKeyName: 'notifications_actor_employee_id_fkey'
            columns: ['actor_employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      precision_cutting_transfers: {
        Row: {
          audited_at: string | null
          created_at: string
          customer: string | null
          customer_model: string | null
          defect_reason: string | null
          id: string
          inspector_name: string | null
          is_audited: boolean
          length_mm: number | null
          long_material_length_mm: number
          long_material_quantity: number
          operator_names: string[]
          outsource_defect_quantity: number
          outsource_defect_reason: string | null
          outsource_unit: string | null
          process_owner: string | null
          processing_defect_count: number
          product_model: string | null
          project_no: string
          raw_material_defect_count: number
          recipient_name: string
          remark: string | null
          responsible_process: string | null
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
          defect_reason?: string | null
          id?: string
          inspector_name?: string | null
          is_audited?: boolean
          length_mm?: number | null
          long_material_length_mm: number
          long_material_quantity: number
          operator_names?: string[]
          outsource_defect_quantity?: number
          outsource_defect_reason?: string | null
          outsource_unit?: string | null
          process_owner?: string | null
          processing_defect_count?: number
          product_model?: string | null
          project_no: string
          raw_material_defect_count?: number
          recipient_name: string
          remark?: string | null
          responsible_process?: string | null
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
          defect_reason?: string | null
          id?: string
          inspector_name?: string | null
          is_audited?: boolean
          length_mm?: number | null
          long_material_length_mm?: number
          long_material_quantity?: number
          operator_names?: string[]
          outsource_defect_quantity?: number
          outsource_defect_reason?: string | null
          outsource_unit?: string | null
          process_owner?: string | null
          processing_defect_count?: number
          product_model?: string | null
          project_no?: string
          raw_material_defect_count?: number
          recipient_name?: string
          remark?: string | null
          responsible_process?: string | null
          target_workshop?: string
          transfer_quantity?: number
          updated_at?: string
          uploaded_by_name?: string | null
        }
        Relationships: []
      }
      precision_finishing_cuttings: {
        Row: {
          audited_at: string | null
          created_at: string
          customer: string | null
          customer_model: string | null
          defect_reason: string | null
          id: string
          inspector_name: string | null
          is_audited: boolean
          length_mm: number | null
          long_material_length_mm: number
          long_material_quantity: number
          operator_employee_id: string
          operator_employee_ids: string[]
          operator_names: string[]
          outsource_defect_quantity: number
          outsource_defect_reason: string | null
          outsource_unit: string | null
          process_owner: string | null
          processing_defect_count: number
          product_model: string | null
          project_no: string
          raw_material_defect_count: number
          recipient_name: string
          remark: string | null
          responsible_process: string | null
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
          defect_reason?: string | null
          id?: string
          inspector_name?: string | null
          is_audited?: boolean
          length_mm?: number | null
          long_material_length_mm: number
          long_material_quantity: number
          operator_employee_id: string
          operator_employee_ids?: string[]
          operator_names?: string[]
          outsource_defect_quantity?: number
          outsource_defect_reason?: string | null
          outsource_unit?: string | null
          process_owner?: string | null
          processing_defect_count?: number
          product_model?: string | null
          project_no: string
          raw_material_defect_count?: number
          recipient_name: string
          remark?: string | null
          responsible_process?: string | null
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
          defect_reason?: string | null
          id?: string
          inspector_name?: string | null
          is_audited?: boolean
          length_mm?: number | null
          long_material_length_mm?: number
          long_material_quantity?: number
          operator_employee_id?: string
          operator_employee_ids?: string[]
          operator_names?: string[]
          outsource_defect_quantity?: number
          outsource_defect_reason?: string | null
          outsource_unit?: string | null
          process_owner?: string | null
          processing_defect_count?: number
          product_model?: string | null
          project_no?: string
          raw_material_defect_count?: number
          recipient_name?: string
          remark?: string | null
          responsible_process?: string | null
          target_workshop?: string
          transfer_quantity?: number
          updated_at?: string
          uploaded_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'precision_finishing_cuttings_operator_employee_id_fkey'
            columns: ['operator_employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
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
          labor_cost_coefficient: number
          labor_rate: number
          length: number
          model: string
          operation: string
          overhead_cost: number | null
          part_no: string | null
          record_type: string
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
          labor_cost_coefficient?: number
          labor_rate?: number
          length?: number
          model: string
          operation: string
          overhead_cost?: number | null
          part_no?: string | null
          record_type?: string
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
          labor_cost_coefficient?: number
          labor_rate?: number
          length?: number
          model?: string
          operation?: string
          overhead_cost?: number | null
          part_no?: string | null
          record_type?: string
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
            foreignKeyName: 'process_standards_equipment_no_fkey'
            columns: ['equipment_no']
            isOneToOne: false
            referencedRelation: 'machine_equipment_maintenances'
            referencedColumns: ['unified_device_no']
          },
          {
            foreignKeyName: 'process_standards_equipment_no_fkey'
            columns: ['equipment_no']
            isOneToOne: false
            referencedRelation: 'v_machine_runtime_items'
            referencedColumns: ['unified_device_no']
          },
          {
            foreignKeyName: 'process_standards_job_name_fkey'
            columns: ['job_name']
            isOneToOne: false
            referencedRelation: 'job_base_settings'
            referencedColumns: ['job_name']
          },
        ]
      }
      production_daily_report_export_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          expires_at: string | null
          file_name: string | null
          file_path: string | null
          id: string
          request_payload: Json
          requested_by_admin_employee_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          request_payload?: Json
          requested_by_admin_employee_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          request_payload?: Json
          requested_by_admin_employee_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'production_daily_report_expor_requested_by_admin_employee__fkey'
            columns: ['requested_by_admin_employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      production_order_export_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          expires_at: string | null
          file_name: string | null
          file_path: string | null
          id: string
          request_payload: Json
          requested_by_admin_employee_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          request_payload?: Json
          requested_by_admin_employee_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          request_payload?: Json
          requested_by_admin_employee_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'production_order_export_jobs_requested_by_admin_employee_i_fkey'
            columns: ['requested_by_admin_employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
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
          machine_equipment_id: string | null
          operation: string
          order_id: string
          outsource_defect_quantity: number
          outsource_defect_reason: string | null
          outsource_unit: string | null
          product_model: string | null
          project_no: string
          qualified_hours: number | null
          qualified_quantity: number
          remark: string | null
          setup_defect_quantity: number
          setup_responsible: string | null
          standard_seconds: number
          theoretical_seconds: number
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
          machine_equipment_id?: string | null
          operation: string
          order_id: string
          outsource_defect_quantity?: number
          outsource_defect_reason?: string | null
          outsource_unit?: string | null
          product_model?: string | null
          project_no: string
          qualified_hours?: number | null
          qualified_quantity?: number
          remark?: string | null
          setup_defect_quantity?: number
          setup_responsible?: string | null
          standard_seconds: number
          theoretical_seconds?: number
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
          machine_equipment_id?: string | null
          operation?: string
          order_id?: string
          outsource_defect_quantity?: number
          outsource_defect_reason?: string | null
          outsource_unit?: string | null
          product_model?: string | null
          project_no?: string
          qualified_hours?: number | null
          qualified_quantity?: number
          remark?: string | null
          setup_defect_quantity?: number
          setup_responsible?: string | null
          standard_seconds?: number
          theoretical_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'production_order_items_machine_equipment_id_fkey'
            columns: ['machine_equipment_id']
            isOneToOne: false
            referencedRelation: 'machine_equipment_maintenances'
            referencedColumns: ['id']
          },
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
          customer: string | null
          customer_model: string | null
          id: string
          length_mm: number | null
          length_tolerance: string | null
          material_code: string | null
          material_name: string | null
          order_quantity: number | null
          package_name: string | null
          process_flow: string | null
          product_category: string | null
          product_delivery_date: string | null
          product_model: string | null
          project_no: string | null
          status: string
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
          length_tolerance?: string | null
          material_code?: string | null
          material_name?: string | null
          order_quantity?: number | null
          package_name?: string | null
          process_flow?: string | null
          product_category?: string | null
          product_delivery_date?: string | null
          product_model?: string | null
          project_no?: string | null
          status?: string
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
          length_tolerance?: string | null
          material_code?: string | null
          material_name?: string | null
          order_quantity?: number | null
          package_name?: string | null
          process_flow?: string | null
          product_category?: string | null
          product_delivery_date?: string | null
          product_model?: string | null
          project_no?: string | null
          status?: string
          updated_at?: string | null
          weight_per_meter_kg?: number | null
        }
        Relationships: []
      }
      syney_safe_part_settings: {
        Row: {
          created_at: string | null
          decomposition_role: string | null
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
          decomposition_role?: string | null
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
          decomposition_role?: string | null
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
          BorderMaterial: string
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
          BorderMaterial?: string
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
          BorderMaterial?: string
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
      tooling_data: {
        Row: {
          created_at: string
          id: string
          material: string
          remarks: string
          tool_code: string
          tool_name: string
          tool_spec: string
          unit_price: number
          updated_at: string
          usage: string
        }
        Insert: {
          created_at?: string
          id?: string
          material: string
          remarks: string
          tool_code: string
          tool_name: string
          tool_spec: string
          unit_price: number
          updated_at?: string
          usage: string
        }
        Update: {
          created_at?: string
          id?: string
          material?: string
          remarks?: string
          tool_code?: string
          tool_name?: string
          tool_spec?: string
          unit_price?: number
          updated_at?: string
          usage?: string
        }
        Relationships: []
      }
      youmai_finished_goods_inventory: {
        Row: {
          created_at: string
          current_stock: number
          final_stock: number | null
          id: string
          material_code: string
          material_name: string
          model: string
          pending_stock_in: number
          pending_stock_out: number
          product_data_id: string
          remarks: string
          specific_gravity: number
          specification: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          final_stock?: number | null
          id?: string
          material_code: string
          material_name: string
          model: string
          pending_stock_in?: number
          pending_stock_out?: number
          product_data_id: string
          remarks?: string
          specific_gravity: number
          specification: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          final_stock?: number | null
          id?: string
          material_code?: string
          material_name?: string
          model?: string
          pending_stock_in?: number
          pending_stock_out?: number
          product_data_id?: string
          remarks?: string
          specific_gravity?: number
          specification?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'youmai_finished_goods_inventory_product_data_id_fkey'
            columns: ['product_data_id']
            isOneToOne: false
            referencedRelation: 'youmai_product_data'
            referencedColumns: ['id']
          },
        ]
      }
      youmai_finished_goods_stock_in: {
        Row: {
          created_at: string
          id: string
          material_code: string
          material_name: string
          model: string
          product_data_id: string
          remarks: string
          specific_gravity: number
          specification: string
          status: string
          stock_in_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_code: string
          material_name: string
          model: string
          product_data_id: string
          remarks?: string
          specific_gravity: number
          specification: string
          status?: string
          stock_in_quantity: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_code?: string
          material_name?: string
          model?: string
          product_data_id?: string
          remarks?: string
          specific_gravity?: number
          specification?: string
          status?: string
          stock_in_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'youmai_finished_goods_stock_in_product_data_id_fkey'
            columns: ['product_data_id']
            isOneToOne: false
            referencedRelation: 'youmai_product_data'
            referencedColumns: ['id']
          },
        ]
      }
      youmai_finished_goods_stock_out: {
        Row: {
          created_at: string
          delivery_date: string
          id: string
          material_code: string
          material_name: string
          model: string
          product_data_id: string
          purchase_order_line_no: string
          purchase_order_no: string
          remarks: string
          specific_gravity: number
          specification: string
          status: string
          stock_out_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_date: string
          id?: string
          material_code: string
          material_name: string
          model: string
          product_data_id: string
          purchase_order_line_no: string
          purchase_order_no: string
          remarks?: string
          specific_gravity: number
          specification: string
          status?: string
          stock_out_quantity: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_date?: string
          id?: string
          material_code?: string
          material_name?: string
          model?: string
          product_data_id?: string
          purchase_order_line_no?: string
          purchase_order_no?: string
          remarks?: string
          specific_gravity?: number
          specification?: string
          status?: string
          stock_out_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'youmai_finished_goods_stock_out_product_data_id_fkey'
            columns: ['product_data_id']
            isOneToOne: false
            referencedRelation: 'youmai_product_data'
            referencedColumns: ['id']
          },
        ]
      }
      youmai_product_data: {
        Row: {
          created_at: string
          id: string
          material_code: string
          material_name: string
          model: string
          remarks: string
          specific_gravity: number
          specification: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_code: string
          material_name: string
          model: string
          remarks?: string
          specific_gravity: number
          specification: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_code?: string
          material_name?: string
          model?: string
          remarks?: string
          specific_gravity?: number
          specification?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      attendance_details_with_shift: {
        Row: {
          created_at: string | null
          date: string | null
          id: string | null
          name: string | null
          shift: string | null
          time: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_machine_runtime_items: {
        Row: {
          customer_model: string | null
          device_operation: string | null
          employee_id: string | null
          id: string | null
          incoming_qualified_quantity: number | null
          length_mm: number | null
          machine_equipment_id: string | null
          machine_name: string | null
          operation: string | null
          operator_name: string | null
          order_date: string | null
          order_id: string | null
          product_model: string | null
          project_no: string | null
          runtime_seconds: number | null
          theoretical_seconds: number | null
          unified_device_no: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'production_order_items_machine_equipment_id_fkey'
            columns: ['machine_equipment_id']
            isOneToOne: false
            referencedRelation: 'machine_equipment_maintenances'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'production_order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'production_orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'production_orders_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      apply_youmai_finished_goods_stock_out_audit: {
        Args: {
          target_product_data_id: string
          target_stock_out_quantity: number
        }
        Returns: undefined
      }
      current_employee_id: { Args: never; Returns: string }
      ensure_youmai_finished_goods_inventory_row: {
        Args: {
          snapshot_material_code: string
          snapshot_material_name: string
          snapshot_model: string
          snapshot_specific_gravity: number
          snapshot_specification: string
          target_product_data_id: string
        }
        Returns: undefined
      }
      get_attendance_late_early_stats: {
        Args: { p_end_date?: string; p_name?: string; p_start_date?: string }
        Returns: {
          early_leave_count: number
          early_leave_dates: string[]
          late_count: number
          late_dates: string[]
          name: string
        }[]
      }
      get_attendance_monthly_export: {
        Args: { p_month: number; p_name?: string; p_year: number }
        Returns: {
          employee_name: string
          job_name: string
          order_date: string
          shift: string
          work_hours: number
        }[]
      }
      get_attendance_shift_stats: {
        Args: { p_end_date?: string; p_name?: string; p_start_date?: string }
        Returns: {
          day_shift_days: number
          name: string
          night_shift_days: number
          total_days: number
        }[]
      }
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
      is_precision_cutting_admin: { Args: never; Returns: boolean }
      is_team_leader: { Args: never; Returns: boolean }
      recalculate_production_order_totals: {
        Args: { target_order_id: string }
        Returns: undefined
      }
      refresh_youmai_inventory_pending_stock_in: {
        Args: { target_product_data_id: string }
        Returns: undefined
      }
      refresh_youmai_inventory_pending_stock_out: {
        Args: { target_product_data_id: string }
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
