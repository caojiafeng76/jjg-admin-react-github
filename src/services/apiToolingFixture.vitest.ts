import { describe, expect, it } from 'vitest'
import { normalizeToolingFixtureFormValues } from './apiToolingFixture'

const completeValues = {
  fixture_no: '  JG-001  ',
  category: '  夹具 ',
  applicable_product_drawing_no: ' DWG-001 ',
  product_name: ' 扶梯踏板 ',
  applicable_equipment: ' 设备 A ',
  storage_location: ' 工装库 1 ',
  manufactured_date: '2026-08-01',
  manufacturer: ' 厂商 A ',
  last_maintenance_date: '2026-08-02',
  maintenance_cycle_days: 30,
  responsible_person: ' 张三 ',
  remarks: ' 备注 ',
}

describe('normalizeToolingFixtureFormValues', () => {
  it('trims all fields and keeps the maintenance cycle in days', () => {
    expect(normalizeToolingFixtureFormValues(completeValues)).toEqual({
      fixture_no: 'JG-001',
      category: '夹具',
      applicable_product_drawing_no: 'DWG-001',
      product_name: '扶梯踏板',
      applicable_equipment: '设备 A',
      storage_location: '工装库 1',
      manufactured_date: '2026-08-01',
      manufacturer: '厂商 A',
      last_maintenance_date: '2026-08-02',
      maintenance_cycle_days: 30,
      responsible_person: '张三',
      remarks: '备注',
    })
  })

  it('rejects blank fixture numbers, invalid cycles, and invalid dates', () => {
    expect(() =>
      normalizeToolingFixtureFormValues({ ...completeValues, fixture_no: ' ' }),
    ).toThrow('请输入工装模具编号')
    expect(() =>
      normalizeToolingFixtureFormValues({
        ...completeValues,
        maintenance_cycle_days: 0,
      }),
    ).toThrow('保养周期必须是大于 0 的整数天数')
    expect(() =>
      normalizeToolingFixtureFormValues({
        ...completeValues,
        manufactured_date: 'bad-date',
      }),
    ).toThrow('制作日期格式无效')
  })
})
