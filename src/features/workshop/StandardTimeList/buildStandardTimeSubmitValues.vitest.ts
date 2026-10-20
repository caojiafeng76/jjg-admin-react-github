import type {
  StandardTime,
  StandardTimeFormValues,
} from '@/services/apiStandardTimes'
import { describe, expect, it } from 'vitest'

import { buildStandardTimeSubmitValues } from './buildStandardTimeSubmitValues'

const formValues = {
  customer: '表单客户',
  job_name: '表单岗位',
  operation: 'CNC',
  model: 'M-1',
  standard_seconds: 30,
  theoretical_seconds: 25,
  labor_rate: 9,
  uploaded_by_name: '表单上传人',
  length: 1200,
  record_type: 'A',
} as unknown as StandardTimeFormValues

const editingRecord = {
  id: 'st-1',
  customer: '原客户',
  job_name: '原岗位',
  operation: 'CNC',
  model: 'M-OLD',
  standard_seconds: 40,
  labor_rate: 12,
  uploaded_by_name: '原上传人',
  record_type: 'B',
  process_image_path: 'images/a.png',
} as unknown as StandardTime

describe('buildStandardTimeSubmitValues', () => {
  it('管理员新建时沿用表单值，上传人优先取当前登录人', () => {
    const result = buildStandardTimeSubmitValues({
      values: formValues,
      editingRecord: null,
      isEdit: false,
      isTeamLeaderMode: false,
      currentUploader: '当前用户',
    })

    expect(result).toEqual({ ...formValues, uploaded_by_name: '当前用户' })
  })

  it('管理员编辑时保留原上传人', () => {
    const result = buildStandardTimeSubmitValues({
      values: formValues,
      editingRecord,
      isEdit: true,
      isTeamLeaderMode: false,
      currentUploader: '当前用户',
    })

    expect(result.uploaded_by_name).toBe('原上传人')
    expect(result.labor_rate).toBe(9)
  })

  it('班组长编辑时成本字段沿用原记录，只改理论工时与工序', () => {
    const result = buildStandardTimeSubmitValues({
      values: formValues,
      editingRecord,
      isEdit: true,
      isTeamLeaderMode: true,
      currentUploader: '当前用户',
    })

    expect(result).toMatchObject({
      customer: '原客户',
      job_name: '原岗位',
      model: 'M-OLD',
      standard_seconds: 40,
      theoretical_seconds: 25,
      labor_rate: 12,
      labor_cost_coefficient: 1,
      uploaded_by_name: '原上传人',
      record_type: 'B',
      process_image_path: 'images/a.png',
      length: 1200,
    })
  })

  it('班组长新建时标准工时为 0，记录类型默认取表单值', () => {
    const result = buildStandardTimeSubmitValues({
      values: formValues,
      editingRecord: null,
      isEdit: false,
      isTeamLeaderMode: true,
      currentUploader: null,
    })

    expect(result).toMatchObject({
      customer: '表单客户',
      model: 'M-1',
      standard_seconds: 0,
      labor_rate: 9,
      uploaded_by_name: '表单上传人',
      record_type: 'A',
      process_image_path: null,
    })
  })
})
