import type {
  StandardTime,
  StandardTimeFormValues,
} from '@/services/apiStandardTimes'

export interface BuildStandardTimeSubmitValuesOptions {
  values: StandardTimeFormValues
  editingRecord: StandardTime | null
  isEdit: boolean
  isTeamLeaderMode: boolean
  currentUploader: string | null
}

/** 组装成本核算提交数据：班组长只能改理论工时等少量字段，其余成本字段沿用原记录 */
export function buildStandardTimeSubmitValues({
  values,
  editingRecord,
  isEdit,
  isTeamLeaderMode,
  currentUploader,
}: BuildStandardTimeSubmitValuesOptions): StandardTimeFormValues {
  const uploadedByName = isEdit
    ? editingRecord?.uploaded_by_name || null
    : currentUploader || values.uploaded_by_name || null

  if (!isTeamLeaderMode) {
    return {
      ...values,
      uploaded_by_name: uploadedByName,
    }
  }

  return {
    customer: editingRecord?.customer ?? values.customer,
    job_name: editingRecord?.job_name ?? values.job_name,
    equipment_no: editingRecord?.equipment_no ?? values.equipment_no,
    operation: values.operation,
    model: isEdit
      ? editingRecord?.model || values.model
      : values.model,
    standard_seconds: isEdit
      ? editingRecord?.standard_seconds || 0
      : 0,
    theoretical_seconds: values.theoretical_seconds,
    labor_rate: editingRecord?.labor_rate ?? values.labor_rate ?? 0,
    labor_cost_coefficient:
      editingRecord?.labor_cost_coefficient
      ?? values.labor_cost_coefficient
      ?? 1,
    equipment_rate:
      editingRecord?.equipment_rate ?? values.equipment_rate ?? 0,
    tool_rate: editingRecord?.tool_rate ?? values.tool_rate ?? 0,
    cutting_fluid_rate:
      editingRecord?.cutting_fluid_rate
      ?? values.cutting_fluid_rate
      ?? 0,
    fixture_rate:
      editingRecord?.fixture_rate ?? values.fixture_rate ?? 0,
    inspection_seconds:
      editingRecord?.inspection_seconds
      ?? values.inspection_seconds
      ?? 0,
    daily_management_cost:
      editingRecord?.daily_management_cost
      ?? values.daily_management_cost
      ?? 0,
    daily_total_hours:
      editingRecord?.daily_total_hours
      ?? values.daily_total_hours
      ?? 0,
    uploaded_by_name: uploadedByName,
    remark: editingRecord?.remark ?? values.remark ?? null,
    length: values.length ?? editingRecord?.length ?? 0,
    part_no: values.part_no ?? editingRecord?.part_no ?? null,
    tooling_fixture:
      values.tooling_fixture
      ?? editingRecord?.tooling_fixture
      ?? null,
    clamping_count:
      values.clamping_count ?? editingRecord?.clamping_count ?? null,
    clamping_quantity:
      values.clamping_quantity
      ?? editingRecord?.clamping_quantity
      ?? null,
    operator_count:
      values.operator_count ?? editingRecord?.operator_count ?? null,
    process_image_path: editingRecord?.process_image_path ?? null,
    process_image_name: editingRecord?.process_image_name ?? null,
    process_image_mime_type:
      editingRecord?.process_image_mime_type ?? null,
    process_image_size: editingRecord?.process_image_size ?? null,
    process_image_uploaded_at:
      editingRecord?.process_image_uploaded_at ?? null,
    process_note:
      values.process_note ?? editingRecord?.process_note ?? null,
    record_type:
      editingRecord?.record_type ?? values.record_type ?? 'B',
  }
}
