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
          is_external: boolean
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
          is_external?: boolean
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
          is_external?: boolean
          job_name?: string | null
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_job_name_fkey"
            columns: ["job_name"]
            isOneToOne: false
            referencedRelation: "job_base_settings"
            referencedColumns: ["job_name"]
          },
          {
            foreignKeyName: "employees_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["key"]
          },
        ]
      }
      extrusion_production_items: {
        Row: {
          actual_output_length_mm: number
          actual_output_weight_kg: number
          actual_quantity: number
          actual_unit_weight_kg: number
          billet_diameter_mm: number
          billet_input_weight_kg: number
          billet_length_mm: number
          billet_quantity: number
          created_at: string
          customer: string | null
          customer_model: string | null
          die_no: string | null
          extrusion_production_id: string
          id: string
          material_name: string | null
          material_yield: number
          order_length_mm: number
          product_model: string | null
          project_no: string
          remark: string | null
          scrap_weight_kg: number
          sort_order: number
          tailing_weight_kg: number
          theoretical_output_count: number
          theoretical_output_weight_kg: number
          theoretical_unit_weight_kg_per_meter: number
          updated_at: string
        }
        Insert: {
          actual_output_length_mm: number
          actual_output_weight_kg?: number
          actual_quantity: number
          actual_unit_weight_kg: number
          billet_diameter_mm: number
          billet_input_weight_kg: number
          billet_length_mm: number
          billet_quantity: number
          created_at?: string
          customer?: string | null
          customer_model?: string | null
          die_no?: string | null
          extrusion_production_id: string
          id?: string
          material_name?: string | null
          material_yield?: number
          order_length_mm: number
          product_model?: string | null
          project_no: string
          remark?: string | null
          scrap_weight_kg?: number
          sort_order?: number
          tailing_weight_kg?: number
          theoretical_output_count?: number
          theoretical_output_weight_kg?: number
          theoretical_unit_weight_kg_per_meter: number
          updated_at?: string
        }
        Update: {
          actual_output_length_mm?: number
          actual_output_weight_kg?: number
          actual_quantity?: number
          actual_unit_weight_kg?: number
          billet_diameter_mm?: number
          billet_input_weight_kg?: number
          billet_length_mm?: number
          billet_quantity?: number
          created_at?: string
          customer?: string | null
          customer_model?: string | null
          die_no?: string | null
          extrusion_production_id?: string
          id?: string
          material_name?: string | null
          material_yield?: number
          order_length_mm?: number
          product_model?: string | null
          project_no?: string
          remark?: string | null
          scrap_weight_kg?: number
          sort_order?: number
          tailing_weight_kg?: number
          theoretical_output_count?: number
          theoretical_output_weight_kg?: number
          theoretical_unit_weight_kg_per_meter?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extrusion_production_items_extrusion_production_id_fkey"
            columns: ["extrusion_production_id"]
            isOneToOne: false
            referencedRelation: "extrusion_productions"
            referencedColumns: ["id"]
          },
        ]
      }
      extrusion_productions: {
        Row: {
          audited_at: string | null
          created_at: string
          id: string
          is_audited: boolean
          legacy_inspector_name: string | null
          legacy_operator_name: string | null
          machine_id: string
          production_date: string
          remark: string | null
          shift: string
          shift_leader_name: string
          updated_at: string
          uploaded_by_name: string | null
        }
        Insert: {
          audited_at?: string | null
          created_at?: string
          id?: string
          is_audited?: boolean
          legacy_inspector_name?: string | null
          legacy_operator_name?: string | null
          machine_id: string
          production_date: string
          remark?: string | null
          shift: string
          shift_leader_name: string
          updated_at?: string
          uploaded_by_name?: string | null
        }
        Update: {
          audited_at?: string | null
          created_at?: string
          id?: string
          is_audited?: boolean
          legacy_inspector_name?: string | null
          legacy_operator_name?: string | null
          machine_id?: string
          production_date?: string
          remark?: string | null
          shift?: string
          shift_leader_name?: string
          updated_at?: string
          uploaded_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extrusion_productions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machine_equipment_maintenances"
            referencedColumns: ["unified_device_no"]
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
      labor_protection_requisitions: {
        Row: {
          collection_method: string
          created_at: string
          id: string
          job_title: string
          labor_protection_data_id: string
          machine_equipment_id: string | null
          quantity: number
          recipient: string
          updated_at: string
        }
        Insert: {
          collection_method?: string
          created_at?: string
          id?: string
          job_title: string
          labor_protection_data_id: string
          machine_equipment_id?: string | null
          quantity: number
          recipient: string
          updated_at?: string
        }
        Update: {
          collection_method?: string
          created_at?: string
          id?: string
          job_title?: string
          labor_protection_data_id?: string
          machine_equipment_id?: string | null
          quantity?: number
          recipient?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "labor_protection_requisitions_labor_protection_data_id_fkey"
            columns: ["labor_protection_data_id"]
            isOneToOne: false
            referencedRelation: "labor_protection_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labor_protection_requisitions_machine_equipment_id_fkey"
            columns: ["machine_equipment_id"]
            isOneToOne: false
            referencedRelation: "machine_equipment_maintenances"
            referencedColumns: ["id"]
          },
        ]
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
      order_scheduling_items: {
        Row: {
          created_at: string | null
          customer: string | null
          customer_model: string | null
          delivery_date: string | null
          id: string
          length_mm: number | null
          material_code: string | null
          material_name: string | null
          order_quantity: number | null
          product_model: string | null
          project_no: string
          remark: string | null
          scheduled_quantity: number | null
          sheet_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer?: string | null
          customer_model?: string | null
          delivery_date?: string | null
          id?: string
          length_mm?: number | null
          material_code?: string | null
          material_name?: string | null
          order_quantity?: number | null
          product_model?: string | null
          project_no: string
          remark?: string | null
          scheduled_quantity?: number | null
          sheet_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer?: string | null
          customer_model?: string | null
          delivery_date?: string | null
          id?: string
          length_mm?: number | null
          material_code?: string | null
          material_name?: string | null
          order_quantity?: number | null
          product_model?: string | null
          project_no?: string
          remark?: string | null
          scheduled_quantity?: number | null
          sheet_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_scheduling_items_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "order_scheduling_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      order_scheduling_sheets: {
        Row: {
          created_at: string | null
          id: string
          remark: string | null
          scheduling_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          remark?: string | null
          scheduling_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          remark?: string | null
          scheduling_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      packaging_employees: {
        Row: {
          created_at: string
          hourly_wage: number
          id: string
          name: string
          position_salary: number | null
          remark: string | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          hourly_wage?: number
          id?: string
          name: string
          position_salary?: number | null
          remark?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          hourly_wage?: number
          id?: string
          name?: string
          position_salary?: number | null
          remark?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      packaging_standard_times: {
        Row: {
          created_at: string
          id: string
          length: number
          model: string
          part_no: string | null
          remark: string | null
          standard_seconds: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          length?: number
          model: string
          part_no?: string | null
          remark?: string | null
          standard_seconds?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          length?: number
          model?: string
          part_no?: string | null
          remark?: string | null
          standard_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      packaging_work_orders: {
        Row: {
          color_name: string | null
          created_at: string
          defect_reason: string | null
          defective_quantity: number
          defective_weight_kg: number | null
          employee_id: string | null
          extra_qualified_hours: number
          id: string
          input_batch_id: string
          length_mm: number | null
          part_no: string | null
          process_name: string | null
          product_model: string
          project_no: string | null
          quantity: number
          remark: string | null
          standard_seconds: number
          unit: string
          updated_at: string
          weight_per_meter_kg: number
          work_date: string
          work_hours: number | null
        }
        Insert: {
          color_name?: string | null
          created_at?: string
          defect_reason?: string | null
          defective_quantity?: number
          defective_weight_kg?: number | null
          employee_id?: string | null
          extra_qualified_hours?: number
          id?: string
          input_batch_id: string
          length_mm?: number | null
          part_no?: string | null
          process_name?: string | null
          product_model: string
          project_no?: string | null
          quantity: number
          remark?: string | null
          standard_seconds?: number
          unit?: string
          updated_at?: string
          weight_per_meter_kg?: number
          work_date: string
          work_hours?: number | null
        }
        Update: {
          color_name?: string | null
          created_at?: string
          defect_reason?: string | null
          defective_quantity?: number
          defective_weight_kg?: number | null
          employee_id?: string | null
          extra_qualified_hours?: number
          id?: string
          input_batch_id?: string
          length_mm?: number | null
          part_no?: string | null
          process_name?: string | null
          product_model?: string
          project_no?: string | null
          quantity?: number
          remark?: string | null
          standard_seconds?: number
          unit?: string
          updated_at?: string
          weight_per_meter_kg?: number
          work_date?: string
          work_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "packaging_work_orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "packaging_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          label: string
          module: string
          scope: string
          surface: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          label: string
          module: string
          scope: string
          surface?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          module?: string
          scope?: string
          surface?: string
        }
        Relationships: []
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
            foreignKeyName: "precision_finishing_cuttings_operator_employee_id_fkey"
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
          is_last_process: boolean
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
          is_last_process?: boolean
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
          is_last_process?: boolean
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
            foreignKeyName: "production_daily_report_expor_requested_by_admin_employee__fkey"
            columns: ["requested_by_admin_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
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
            foreignKeyName: "production_order_export_jobs_requested_by_admin_employee_i_fkey"
            columns: ["requested_by_admin_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
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
            foreignKeyName: "production_order_items_machine_equipment_id_fkey"
            columns: ["machine_equipment_id"]
            isOneToOne: false
            referencedRelation: "machine_equipment_maintenances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
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
      quality_issue_records: {
        Row: {
          audit_status: string
          cause: string
          created_at: string
          customer: string | null
          customer_model: string | null
          defect_rate: number | null
          defective_handling_result: string
          defective_quantity: number
          id: string
          inspector_name: string
          issue_type: string
          length_mm: number | null
          operator_employee_id: string | null
          operator_name: string
          order_quantity: number | null
          processed_quantity: number
          product_model: string | null
          production_date: string
          project_no: string
          qualified_quantity: number
          quality_issue: string
          remark: string | null
          reporter_employee_id: string
          responsibility_handling_result: string
          shift_leader_name: string
          updated_at: string
        }
        Insert: {
          audit_status?: string
          cause?: string
          created_at?: string
          customer?: string | null
          customer_model?: string | null
          defect_rate?: number | null
          defective_handling_result?: string
          defective_quantity?: number
          id?: string
          inspector_name?: string
          issue_type?: string
          length_mm?: number | null
          operator_employee_id?: string | null
          operator_name?: string
          order_quantity?: number | null
          processed_quantity?: number
          product_model?: string | null
          production_date: string
          project_no: string
          qualified_quantity?: number
          quality_issue?: string
          remark?: string | null
          reporter_employee_id: string
          responsibility_handling_result?: string
          shift_leader_name?: string
          updated_at?: string
        }
        Update: {
          audit_status?: string
          cause?: string
          created_at?: string
          customer?: string | null
          customer_model?: string | null
          defect_rate?: number | null
          defective_handling_result?: string
          defective_quantity?: number
          id?: string
          inspector_name?: string
          issue_type?: string
          length_mm?: number | null
          operator_employee_id?: string | null
          operator_name?: string
          order_quantity?: number | null
          processed_quantity?: number
          product_model?: string | null
          production_date?: string
          project_no?: string
          qualified_quantity?: number
          quality_issue?: string
          remark?: string | null
          reporter_employee_id?: string
          responsibility_handling_result?: string
          shift_leader_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_issue_records_operator_employee_id_fkey"
            columns: ["operator_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_issue_records_reporter_employee_id_fkey"
            columns: ["reporter_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_rework_repair_document_sequences: {
        Row: {
          document_date: string
          last_sequence: number
          updated_at: string
        }
        Insert: {
          document_date: string
          last_sequence?: number
          updated_at?: string
        }
        Update: {
          document_date?: string
          last_sequence?: number
          updated_at?: string
        }
        Relationships: []
      }
      quality_rework_repairs: {
        Row: {
          actual_rework_date: string | null
          application_date: string | null
          application_reason: string
          created_at: string
          defect_description: string
          document_no: string | null
          id: string
          improvement_actions: string
          improvement_date: string | null
          improvement_owner: string
          planned_rework_date: string | null
          product_name: string
          production_review_date: string | null
          production_review_opinion: string | null
          production_reviewer: string
          project_no: string | null
          quality_verifier: string
          quantity: number
          responsible_unit: string
          rework_category: string
          specification_model: string
          technical_review_date: string | null
          technical_review_opinion: string
          technical_reviewer: string
          updated_at: string
          verification_date: string | null
          verification_result: string
          workflow_status: string | null
          workshop_applicant: string
        }
        Insert: {
          actual_rework_date?: string | null
          application_date?: string | null
          application_reason?: string
          created_at?: string
          defect_description?: string
          document_no?: string | null
          id?: string
          improvement_actions?: string
          improvement_date?: string | null
          improvement_owner?: string
          planned_rework_date?: string | null
          product_name: string
          production_review_date?: string | null
          production_review_opinion?: string | null
          production_reviewer?: string
          project_no?: string | null
          quality_verifier?: string
          quantity: number
          responsible_unit: string
          rework_category: string
          specification_model: string
          technical_review_date?: string | null
          technical_review_opinion?: string
          technical_reviewer?: string
          updated_at?: string
          verification_date?: string | null
          verification_result?: string
          workflow_status?: string | null
          workshop_applicant?: string
        }
        Update: {
          actual_rework_date?: string | null
          application_date?: string | null
          application_reason?: string
          created_at?: string
          defect_description?: string
          document_no?: string | null
          id?: string
          improvement_actions?: string
          improvement_date?: string | null
          improvement_owner?: string
          planned_rework_date?: string | null
          product_name?: string
          production_review_date?: string | null
          production_review_opinion?: string | null
          production_reviewer?: string
          project_no?: string | null
          quality_verifier?: string
          quantity?: number
          responsible_unit?: string
          rework_category?: string
          specification_model?: string
          technical_review_date?: string | null
          technical_review_opinion?: string
          technical_reviewer?: string
          updated_at?: string
          verification_date?: string | null
          verification_result?: string
          workflow_status?: string | null
          workshop_applicant?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          is_builtin: boolean
          key: string
          label: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_builtin?: boolean
          key: string
          label: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_builtin?: boolean
          key?: string
          label?: string
        }
        Relationships: []
      }
      sales_orders: {
        Row: {
          bottleneck_processes: string | null
          capacity_per_day: number | null
          closed_at: string | null
          color_name: string | null
          created_at: string | null
          customer: string | null
          customer_model: string | null
          delivery_priority: string | null
          delivery_review_result: string | null
          id: string
          length_mm: number | null
          length_tolerance: string | null
          material_code: string | null
          material_name: string | null
          material_status: string | null
          order_category: string | null
          order_date: string | null
          order_quantity: number | null
          package_name: string | null
          planned_finish_date: string | null
          planned_start_date: string | null
          process_flow: string | null
          process_requirement: string | null
          process_schedules: Json
          product_category: string | null
          product_delivery_date: string | null
          product_model: string | null
          progress_percent: number | null
          progress_status: string | null
          project_no: string | null
          responsible_person: string | null
          responsible_person_ids: string[] | null
          responsible_person_names: string[] | null
          row_remark: string | null
          scheduling_remark: string | null
          sketch_file_path: string | null
          status: string
          tooling_status: string | null
          updated_at: string | null
          weight_per_meter_kg: number | null
        }
        Insert: {
          bottleneck_processes?: string | null
          capacity_per_day?: number | null
          closed_at?: string | null
          color_name?: string | null
          created_at?: string | null
          customer?: string | null
          customer_model?: string | null
          delivery_priority?: string | null
          delivery_review_result?: string | null
          id?: string
          length_mm?: number | null
          length_tolerance?: string | null
          material_code?: string | null
          material_name?: string | null
          material_status?: string | null
          order_category?: string | null
          order_date?: string | null
          order_quantity?: number | null
          package_name?: string | null
          planned_finish_date?: string | null
          planned_start_date?: string | null
          process_flow?: string | null
          process_requirement?: string | null
          process_schedules?: Json
          product_category?: string | null
          product_delivery_date?: string | null
          product_model?: string | null
          progress_percent?: number | null
          progress_status?: string | null
          project_no?: string | null
          responsible_person?: string | null
          responsible_person_ids?: string[] | null
          responsible_person_names?: string[] | null
          row_remark?: string | null
          scheduling_remark?: string | null
          sketch_file_path?: string | null
          status?: string
          tooling_status?: string | null
          updated_at?: string | null
          weight_per_meter_kg?: number | null
        }
        Update: {
          bottleneck_processes?: string | null
          capacity_per_day?: number | null
          closed_at?: string | null
          color_name?: string | null
          created_at?: string | null
          customer?: string | null
          customer_model?: string | null
          delivery_priority?: string | null
          delivery_review_result?: string | null
          id?: string
          length_mm?: number | null
          length_tolerance?: string | null
          material_code?: string | null
          material_name?: string | null
          material_status?: string | null
          order_category?: string | null
          order_date?: string | null
          order_quantity?: number | null
          package_name?: string | null
          planned_finish_date?: string | null
          planned_start_date?: string | null
          process_flow?: string | null
          process_requirement?: string | null
          process_schedules?: Json
          product_category?: string | null
          product_delivery_date?: string | null
          product_model?: string | null
          progress_percent?: number | null
          progress_status?: string | null
          project_no?: string | null
          responsible_person?: string | null
          responsible_person_ids?: string[] | null
          responsible_person_names?: string[] | null
          row_remark?: string | null
          scheduling_remark?: string | null
          sketch_file_path?: string | null
          status?: string
          tooling_status?: string | null
          updated_at?: string | null
          weight_per_meter_kg?: number | null
        }
        Relationships: []
      }
      syney_safe_part_settings: {
        Row: {
          created_at: string | null
          decomposition_role: string | null
          drawing_file_mime_type: string | null
          drawing_file_name: string | null
          drawing_file_path: string | null
          drawing_file_size: number | null
          drawing_uploaded_at: string | null
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
          drawing_file_mime_type?: string | null
          drawing_file_name?: string | null
          drawing_file_path?: string | null
          drawing_file_size?: number | null
          drawing_uploaded_at?: string | null
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
          drawing_file_mime_type?: string | null
          drawing_file_name?: string | null
          drawing_file_path?: string | null
          drawing_file_size?: number | null
          drawing_uploaded_at?: string | null
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
            referencedRelation: "syney_pos_sorted"
            referencedColumns: ["id"]
          },
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
      tooling_inventory: {
        Row: {
          created_at: string
          current_stock: number
          final_stock: number | null
          id: string
          material: string
          pending_stock_in: number
          pending_stock_out: number
          remarks: string
          tool_code: string
          tool_name: string
          tool_spec: string
          tooling_data_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_stock?: number
          final_stock?: number | null
          id?: string
          material: string
          pending_stock_in?: number
          pending_stock_out?: number
          remarks?: string
          tool_code: string
          tool_name: string
          tool_spec: string
          tooling_data_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_stock?: number
          final_stock?: number | null
          id?: string
          material?: string
          pending_stock_in?: number
          pending_stock_out?: number
          remarks?: string
          tool_code?: string
          tool_name?: string
          tool_spec?: string
          tooling_data_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tooling_inventory_tooling_data_id_fkey"
            columns: ["tooling_data_id"]
            isOneToOne: false
            referencedRelation: "tooling_data"
            referencedColumns: ["id"]
          },
        ]
      }
      tooling_stock_in: {
        Row: {
          created_at: string
          id: string
          material: string
          remarks: string
          status: string
          stock_in_quantity: number
          tool_code: string
          tool_name: string
          tool_spec: string
          tooling_data_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material: string
          remarks?: string
          status?: string
          stock_in_quantity: number
          tool_code: string
          tool_name: string
          tool_spec: string
          tooling_data_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material?: string
          remarks?: string
          status?: string
          stock_in_quantity?: number
          tool_code?: string
          tool_name?: string
          tool_spec?: string
          tooling_data_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tooling_stock_in_tooling_data_id_fkey"
            columns: ["tooling_data_id"]
            isOneToOne: false
            referencedRelation: "tooling_data"
            referencedColumns: ["id"]
          },
        ]
      }
      tooling_stock_out: {
        Row: {
          collection_method: string
          created_at: string
          id: string
          machine_equipment_id: string | null
          material: string
          purpose: string
          recipient: string
          remarks: string
          status: string
          stock_out_date: string
          stock_out_quantity: number
          tool_code: string
          tool_name: string
          tool_spec: string
          tooling_data_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          collection_method?: string
          created_at?: string
          id?: string
          machine_equipment_id?: string | null
          material: string
          purpose: string
          recipient: string
          remarks?: string
          status?: string
          stock_out_date: string
          stock_out_quantity: number
          tool_code: string
          tool_name: string
          tool_spec: string
          tooling_data_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          collection_method?: string
          created_at?: string
          id?: string
          machine_equipment_id?: string | null
          material?: string
          purpose?: string
          recipient?: string
          remarks?: string
          status?: string
          stock_out_date?: string
          stock_out_quantity?: number
          tool_code?: string
          tool_name?: string
          tool_spec?: string
          tooling_data_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tooling_stock_out_machine_equipment_id_fkey"
            columns: ["machine_equipment_id"]
            isOneToOne: false
            referencedRelation: "machine_equipment_maintenances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tooling_stock_out_tooling_data_id_fkey"
            columns: ["tooling_data_id"]
            isOneToOne: false
            referencedRelation: "tooling_data"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permission_overrides: {
        Row: {
          created_at: string
          employee_id: string
          enabled: boolean
          id: string
          permission_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          enabled?: boolean
          id?: string
          permission_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          enabled?: boolean
          id?: string
          permission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      villa_lift_cutting_records: {
        Row: {
          created_at: string
          cut_quantity: number
          id: string
          model: string
          name: string
          operator: string
          order_id: string
          process_scrap_quantity: number
          raw_scrap_quantity: number
          remarks: string
          spec: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cut_quantity?: number
          id?: string
          model?: string
          name?: string
          operator?: string
          order_id: string
          process_scrap_quantity?: number
          raw_scrap_quantity?: number
          remarks?: string
          spec?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cut_quantity?: number
          id?: string
          model?: string
          name?: string
          operator?: string
          order_id?: string
          process_scrap_quantity?: number
          raw_scrap_quantity?: number
          remarks?: string
          spec?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_lift_cutting_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "villa_lift_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      villa_lift_finishing_records: {
        Row: {
          created_at: string
          id: string
          model: string
          name: string
          operation: string
          operator: string
          order_id: string
          process_quantity: number
          process_scrap_quantity: number
          raw_scrap_quantity: number
          remarks: string
          spec: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string
          name?: string
          operation?: string
          operator?: string
          order_id: string
          process_quantity?: number
          process_scrap_quantity?: number
          raw_scrap_quantity?: number
          remarks?: string
          spec?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          name?: string
          operation?: string
          operator?: string
          order_id?: string
          process_quantity?: number
          process_scrap_quantity?: number
          raw_scrap_quantity?: number
          remarks?: string
          spec?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_lift_finishing_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "villa_lift_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      villa_lift_order_items: {
        Row: {
          created_at: string
          id: string
          model: string
          name: string
          order_id: string
          quantity: number
          remarks: string
          sort_order: number
          spec: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string
          name?: string
          order_id: string
          quantity?: number
          remarks?: string
          sort_order?: number
          spec?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          name?: string
          order_id?: string
          quantity?: number
          remarks?: string
          sort_order?: number
          spec?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_lift_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "villa_lift_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      villa_lift_orders: {
        Row: {
          assembly_date: string | null
          cabin_processing_date: string | null
          color: string
          created_at: string
          customer: string
          cutting_actual_date: string | null
          cutting_required_date: string | null
          delivery_date: string | null
          film_date: string | null
          film_plan_date: string | null
          frame_processing_date: string | null
          id: string
          inspection_date: string | null
          material_selection_date: string | null
          middle_door_processing_date: string | null
          packaging_date: string | null
          painting_date: string | null
          painting_plan_date: string | null
          planned_delivery_date: string | null
          processing_actual_date: string | null
          processing_required_date: string | null
          product_name: string
          project_name: string
          quantity: number
          remarks: string
          schedule_date: string | null
          status: string
          tinting_plan_date: string | null
          updated_at: string
        }
        Insert: {
          assembly_date?: string | null
          cabin_processing_date?: string | null
          color?: string
          created_at?: string
          customer?: string
          cutting_actual_date?: string | null
          cutting_required_date?: string | null
          delivery_date?: string | null
          film_date?: string | null
          film_plan_date?: string | null
          frame_processing_date?: string | null
          id?: string
          inspection_date?: string | null
          material_selection_date?: string | null
          middle_door_processing_date?: string | null
          packaging_date?: string | null
          painting_date?: string | null
          painting_plan_date?: string | null
          planned_delivery_date?: string | null
          processing_actual_date?: string | null
          processing_required_date?: string | null
          product_name?: string
          project_name?: string
          quantity?: number
          remarks?: string
          schedule_date?: string | null
          status?: string
          tinting_plan_date?: string | null
          updated_at?: string
        }
        Update: {
          assembly_date?: string | null
          cabin_processing_date?: string | null
          color?: string
          created_at?: string
          customer?: string
          cutting_actual_date?: string | null
          cutting_required_date?: string | null
          delivery_date?: string | null
          film_date?: string | null
          film_plan_date?: string | null
          frame_processing_date?: string | null
          id?: string
          inspection_date?: string | null
          material_selection_date?: string | null
          middle_door_processing_date?: string | null
          packaging_date?: string | null
          painting_date?: string | null
          painting_plan_date?: string | null
          planned_delivery_date?: string | null
          processing_actual_date?: string | null
          processing_required_date?: string | null
          product_name?: string
          project_name?: string
          quantity?: number
          remarks?: string
          schedule_date?: string | null
          status?: string
          tinting_plan_date?: string | null
          updated_at?: string
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
            foreignKeyName: "youmai_finished_goods_inventory_product_data_id_fkey"
            columns: ["product_data_id"]
            isOneToOne: false
            referencedRelation: "youmai_product_data"
            referencedColumns: ["id"]
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
            foreignKeyName: "youmai_finished_goods_stock_in_product_data_id_fkey"
            columns: ["product_data_id"]
            isOneToOne: false
            referencedRelation: "youmai_product_data"
            referencedColumns: ["id"]
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
            foreignKeyName: "youmai_finished_goods_stock_out_product_data_id_fkey"
            columns: ["product_data_id"]
            isOneToOne: false
            referencedRelation: "youmai_product_data"
            referencedColumns: ["id"]
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
      youmai_raw_material_inventory: {
        Row: {
          created_at: string
          id: string
          model: string
          quantity: number
          specification: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          model: string
          quantity?: number
          specification: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          quantity?: number
          specification?: string
          updated_at?: string
        }
        Relationships: []
      }
      youmai_raw_material_stock_in: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          model: string
          quantity: number
          remarks: string
          specification: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          model: string
          quantity: number
          remarks?: string
          specification: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          model?: string
          quantity?: number
          remarks?: string
          specification?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "youmai_raw_material_stock_in_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "youmai_raw_material_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      youmai_raw_material_stock_out: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          model: string
          quantity: number
          remarks: string
          specification: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          model: string
          quantity: number
          remarks?: string
          specification: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          model?: string
          quantity?: number
          remarks?: string
          specification?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "youmai_raw_material_stock_out_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "youmai_raw_material_inventory"
            referencedColumns: ["id"]
          },
        ]
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
      order_status_dashboard_order_summaries: {
        Row: {
          color_name: string | null
          completion_rate: number | null
          created_at: string | null
          customer: string | null
          customer_model: string | null
          id: string | null
          latest_transfer_at: string | null
          latest_transfer_operator_names: string | null
          latest_transfer_workshop: string | null
          length_mm: number | null
          length_tolerance: string | null
          material_code: string | null
          material_name: string | null
          order_quantity: number | null
          package_name: string | null
          precision_cutting_quantity: number | null
          process_flow: string | null
          product_category: string | null
          product_delivery_date: string | null
          product_model: string | null
          production_item_count: number | null
          production_status: string | null
          project_no: string | null
          row_remark: string | null
          status: string | null
          total_defect_quantity: number | null
          total_incoming_quantity: number | null
          total_qualified_quantity: number | null
          transfer_quantity: number | null
          transfer_record_count: number | null
          updated_at: string | null
          warehouse_transfer_quantity: number | null
          weight_per_meter_kg: number | null
          yield_rate: number | null
        }
        Relationships: []
      }
      syney_pos_sorted: {
        Row: {
          BorderMaterial: string | null
          Brand: string | null
          created_at: string | null
          end_date_sort_key: number | null
          EndDate: string | null
          id: number | null
          No: string | null
          no_natural_sort_key: string | null
          Qty: number | null
          Remark: string | null
          SerialNo: number | null
          SONo: string | null
          sono_natural_sort_key: string | null
          Spec: string | null
          Status: string | null
          status_sort_weight: number | null
          Technique: string | null
        }
        Insert: {
          BorderMaterial?: string | null
          Brand?: string | null
          created_at?: string | null
          end_date_sort_key?: never
          EndDate?: string | null
          id?: number | null
          No?: string | null
          no_natural_sort_key?: never
          Qty?: number | null
          Remark?: string | null
          SerialNo?: number | null
          SONo?: string | null
          sono_natural_sort_key?: never
          Spec?: string | null
          Status?: string | null
          status_sort_weight?: never
          Technique?: string | null
        }
        Update: {
          BorderMaterial?: string | null
          Brand?: string | null
          created_at?: string | null
          end_date_sort_key?: never
          EndDate?: string | null
          id?: number | null
          No?: string | null
          no_natural_sort_key?: never
          Qty?: number | null
          Remark?: string | null
          SerialNo?: number | null
          SONo?: string | null
          sono_natural_sort_key?: never
          Spec?: string | null
          Status?: string | null
          status_sort_weight?: never
          Technique?: string | null
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
        Relationships: []
      }
    }
    Functions: {
      apply_tooling_stock_out_audit: {
        Args: {
          target_stock_out_quantity: number
          target_tooling_data_id: string
        }
        Returns: undefined
      }
      apply_youmai_finished_goods_stock_out_audit: {
        Args: {
          target_product_data_id: string
          target_stock_out_quantity: number
        }
        Returns: undefined
      }
      consume_proxy_rate_limit: {
        Args: { p_ip: string; p_scope: string }
        Returns: boolean
      }
      current_employee_id: { Args: never; Returns: string }
      current_user_has_permission: { Args: { p_key: string }; Returns: boolean }
      current_user_is_viewer: { Args: never; Returns: boolean }
      ensure_tooling_inventory_row: {
        Args: {
          snapshot_material: string
          snapshot_tool_code: string
          snapshot_tool_name: string
          snapshot_tool_spec: string
          snapshot_unit_price: number
          target_tooling_data_id: string
        }
        Returns: undefined
      }
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
      get_my_permissions: {
        Args: never
        Returns: {
          enabled: boolean
          key: string
        }[]
      }
      get_order_status_dashboard: {
        Args: {
          p_material_code?: string
          p_model_keywords?: string[]
          p_order_date?: string
          p_page?: number
          p_page_size?: number
          p_production_status?: string
          p_project_no?: string
          p_status?: string
        }
        Returns: Json
      }
      get_order_status_dashboard_v2: {
        Args: {
          p_customer?: string
          p_material_code?: string
          p_model_keywords?: string[]
          p_order_date?: string
          p_page?: number
          p_page_size?: number
          p_production_status?: string
          p_project_no?: string
          p_status?: string
        }
        Returns: Json
      }
      get_packaging_work_order_batches: {
        Args: {
          p_employee_id?: string
          p_end_date?: string
          p_keyword?: string
          p_page?: number
          p_page_size?: number
          p_start_date?: string
        }
        Returns: {
          color_name: string
          created_at: string
          defect_reason: string
          defective_quantity: number
          defective_weight_kg: number
          employee_ids: string[]
          employee_names: string[]
          extra_qualified_hours: number
          id: string
          input_batch_id: string
          is_historical_inconsistent: boolean
          length_mm: number
          part_no: string
          process_name: string
          product_model: string
          project_no: string
          quantity: number
          remark: string
          standard_seconds: number
          total_count: number
          total_work_hours: number
          unit: string
          updated_at: string
          weight_per_meter_kg: number
          work_date: string
          work_hours: number
        }[]
      }
      get_workshop_order_options: {
        Args: never
        Returns: {
          lengths: number[]
          product_models: string[]
          project_nos: string[]
        }[]
      }
      increment_serial_no: { Args: { increment_by: number }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      is_precision_cutting_admin: { Args: never; Returns: boolean }
      is_team_leader: { Args: never; Returns: boolean }
      next_quality_rework_repair_document_no: {
        Args: { p_document_date?: string }
        Returns: string
      }
      recalculate_production_order_totals: {
        Args: { target_order_id: string }
        Returns: undefined
      }
      refresh_tooling_inventory_pending_stock_in: {
        Args: { target_tooling_data_id: string }
        Returns: undefined
      }
      refresh_tooling_inventory_pending_stock_out: {
        Args: { target_tooling_data_id: string }
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
      save_packaging_work_order_batch: {
        Args: { p_input_batch_id: string; p_values: Json }
        Returns: string
      }
      update_syney_po_items: {
        Args: { p_ids: number[]; p_values: Json }
        Returns: number
      }
      upsert_extrusion_production: {
        Args: { p_header: Json; p_items: Json }
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
