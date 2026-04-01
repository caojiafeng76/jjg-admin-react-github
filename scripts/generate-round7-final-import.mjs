import { writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx-js-style'

function parseExcelDate(value) {
  if (typeof value === 'string') {
    return value
  }

  const excelEpoch = new Date(Date.UTC(1899, 11, 30))
  const date = new Date(excelEpoch.getTime() + Number(value) * 86400000)
  return date.toISOString().slice(0, 10)
}

function normalizeNullableText(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return String(value)
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function collectImportedOrderKeys(summary) {
  const keys = []

  for (const order of summary.fixed_in_round_2?.imported_orders ?? []) {
    keys.push(`${order.employee}|${order.order_date}`)
  }

  for (const key of summary.imported_orders ?? []) {
    keys.push(key)
  }

  for (const order of summary.fixed_in_round_4?.imported_orders ?? []) {
    keys.push(`${order.employee}|${order.order_date}`)
  }

  for (const key of summary.fixed_in_round_5?.imported_order_keys ?? []) {
    keys.push(key)
  }

  for (const key of summary.fixed_in_round_6?.imported_order_keys ?? []) {
    keys.push(key)
  }

  return keys
}

function classifyReasons(order) {
  const reasons = new Set()

  for (const blocker of order.blockers) {
    if (blocker.includes('员工未建档')) {
      reasons.add('missing_employee')
    }

    if (blocker.includes('缺少型号') || blocker.includes('缺少工序')) {
      reasons.add('missing_model_operation')
    }

    if (blocker.includes('合格数量非整数')) {
      reasons.add('non_integer_quantity')
    }

    if (blocker.includes('工序标准不存在')) {
      reasons.add('missing_process_standard')
    }

    if (blocker.includes('存在不良数量') || blocker.includes('存在减分秒数')) {
      reasons.add('defect_formula_incompatible')
    }
  }

  return Array.from(reasons)
}

function serializeJsonRecordset(tag, value) {
  return `$${tag}$${JSON.stringify(value)}$${tag}$`
}

async function loadRemainingOrders() {
  const blockedPath = fileURLToPath(
    new URL('../docs/imports/production_order_import_2026-03_blocked.json', import.meta.url),
  )
  const workbookPath = fileURLToPath(
    new URL('../2026年3月精加工 (2) (1).xlsx', import.meta.url),
  )
  const summaryPaths = [
    '../docs/imports/production_order_import_2026-03_round2_summary.json',
    '../docs/imports/production_order_import_2026-03_round3_summary.json',
    '../docs/imports/production_order_import_2026-03_round4_summary.json',
    '../docs/imports/production_order_import_2026-03_round5_summary.json',
    '../docs/imports/production_order_import_2026-03_round6_summary.json',
  ].map((path) => fileURLToPath(new URL(path, import.meta.url)))

  const [blockedContent, workbook, ...summaryContents] = await Promise.all([
    readFile(blockedPath, 'utf8'),
    Promise.resolve(XLSX.readFile(workbookPath, { cellDates: false })),
    ...summaryPaths.map((path) => readFile(path, 'utf8')),
  ])

  const importedOrderKeys = new Set(
    summaryContents.flatMap((content) =>
      collectImportedOrderKeys(JSON.parse(content)),
    ),
  )

  const blockedOrders = JSON.parse(blockedContent)
  const remainingOrders = blockedOrders
    .map((order) => ({
      ...order,
      order_key: `${order.employee}|${order.order_date}`,
      reasons: classifyReasons(order),
    }))
    .filter((order) => !importedOrderKeys.has(order.order_key))
    .sort((left, right) => left.order_key.localeCompare(right.order_key, 'zh-CN'))

  return { workbook, remainingOrders }
}

function buildRound7Payload(workbook, remainingOrders) {
  const employeesToCreate = Array.from(
    new Set(
      remainingOrders
        .filter((order) => order.reasons.includes('missing_employee'))
        .map((order) => order.employee),
    ),
  ).sort((left, right) => left.localeCompare(right, 'zh-CN'))

  const processSeedMap = new Map()
  const orderSeed = []
  const itemSeed = []
  const previewOrders = []

  for (const order of remainingOrders) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[order.employee], {
      header: 1,
      defval: null,
    })
    const sourceRows = order.source_rows.map((rowNumber) => {
      const row = rows[rowNumber - 1] || []
      return {
        rowNumber,
        raw: row,
        orderDate: parseExcelDate(row[0] ?? order.order_date),
        projectNo: normalizeNullableText(row[3]) ?? '',
        productModel: normalizeNullableText(row[4]),
        lengthMm:
          row[5] === null || row[5] === '' ? null : Number(row[5]),
        operation: normalizeNullableText(row[6]),
        standardSeconds:
          row[7] === null || row[7] === '' ? null : Number(row[7]),
        qualifiedQuantity: toNumber(row[8]),
        defectQuantity1: toNumber(row[10]),
        extraSeconds: toNumber(row[11]),
        penaltySeconds: toNumber(row[12]),
        totalSeconds: toNumber(row[13]),
        totalHours: toNumber(row[14]),
        remark: normalizeNullableText(row[16]),
      }
    })

    const zeroWorkOnly = order.reasons.includes('missing_model_operation')
    const extraQualifiedHours = zeroWorkOnly
      ? sourceRows.reduce((sum, row) => sum + row.totalSeconds, 0) / 3600
      : sourceRows.reduce((sum, row) => sum + row.extraSeconds, 0) / 3600
    const workHours =
      Number.isFinite(Number(order.work_hours)) && Number(order.work_hours) > 0
        ? Number(order.work_hours)
        : Math.max(
            extraQualifiedHours,
            sourceRows.reduce((sum, row) => sum + row.totalHours, 0),
            0.01,
          )
    const orderRemark = zeroWorkOnly
      ? Array.from(
          new Set(
            sourceRows
              .map((row) => row.remark)
              .filter((value) => value !== null),
          ),
        ).join('；') || null
      : null

    orderSeed.push({
      employee_name: order.employee,
      order_date: order.order_date,
      work_hours: workHours,
      extra_qualified_hours: Number(extraQualifiedHours.toFixed(6)),
      remark: orderRemark,
    })

    const itemCountBefore = itemSeed.length

    if (!zeroWorkOnly) {
      for (const row of sourceRows) {
        if (!row.productModel || !row.operation) {
          continue
        }

        const roundedQualifiedQuantity = Number.isInteger(row.qualifiedQuantity)
          ? row.qualifiedQuantity
          : Math.ceil(row.qualifiedQuantity)
        const standardSeconds =
          row.standardSeconds === null ? 0 : Number(row.standardSeconds)

        if (order.reasons.includes('missing_process_standard')) {
          const comboKey = `${row.productModel}|||${row.operation}`
          if (!processSeedMap.has(comboKey)) {
            processSeedMap.set(comboKey, {
              model: row.productModel,
              operation: row.operation,
              standard_seconds: standardSeconds,
              remark: '2026-03 历史工单补录 round7 自动补齐',
            })
          }
        }

        itemSeed.push({
          employee_name: order.employee,
          order_date: order.order_date,
          project_no: row.projectNo,
          product_model: row.productModel,
          length_mm: row.lengthMm,
          operation: row.operation,
          standard_seconds: standardSeconds,
          incoming_qualified_quantity:
            roundedQualifiedQuantity + row.defectQuantity1,
          qualified_quantity: roundedQualifiedQuantity,
          defect_quantity_1: row.defectQuantity1,
          defect_reason_1: row.defectQuantity1 > 0 ? '加工' : null,
          defect_quantity_2: 0,
          defect_reason_2: '原料',
          data_category: 'A',
          remark: row.remark,
        })
      }
    }

    previewOrders.push({
      order_key: order.order_key,
      reasons: order.reasons,
      source_rows: order.source_rows,
      work_hours: workHours,
      extra_qualified_hours: Number(extraQualifiedHours.toFixed(6)),
      import_mode: zeroWorkOnly ? 'extra_hours_only' : 'order_with_items',
      item_count: itemSeed.length - itemCountBefore,
    })
  }

  return {
    employeesToCreate,
    processSeed: Array.from(processSeedMap.values()).sort((left, right) =>
      `${left.model}|${left.operation}`.localeCompare(
        `${right.model}|${right.operation}`,
        'zh-CN',
      ),
    ),
    orderSeed,
    itemSeed,
    previewOrders,
  }
}

function buildRound7Sql({ employeesToCreate, processSeed, orderSeed, itemSeed }) {
  return `with employee_seed as (
  select *
  from json_to_recordset(${serializeJsonRecordset(
    'employee_json',
    employeesToCreate.map((name) => ({ name })),
  )}) as x(name text)
), inserted_employees as (
  insert into public.employees (name)
  select e.name
  from employee_seed e
  where not exists (
    select 1 from public.employees existing where existing.name = e.name
  )
  returning id, name
), process_seed as (
  select *
  from json_to_recordset(${serializeJsonRecordset(
    'process_json',
    processSeed,
  )}) as x(model text, operation text, standard_seconds numeric, remark text)
), inserted_process as (
  insert into public.process_standards (model, operation, standard_seconds, remark)
  select p.model, p.operation, p.standard_seconds, p.remark
  from process_seed p
  where not exists (
    select 1
    from public.process_standards existing
    where existing.model = p.model and existing.operation = p.operation
  )
  returning model, operation
), order_seed as (
  select *
  from json_to_recordset(${serializeJsonRecordset(
    'order_json',
    orderSeed,
  )}) as x(
    employee_name text,
    order_date date,
    work_hours numeric,
    extra_qualified_hours numeric,
    remark text
  )
), item_seed as (
  select *
  from json_to_recordset(${serializeJsonRecordset(
    'item_json',
    itemSeed,
  )}) as x(
    employee_name text,
    order_date date,
    project_no text,
    product_model text,
    length_mm numeric,
    operation text,
    standard_seconds numeric,
    incoming_qualified_quantity integer,
    qualified_quantity integer,
    defect_quantity_1 integer,
    defect_reason_1 text,
    defect_quantity_2 integer,
    defect_reason_2 text,
    data_category text,
    remark text
  )
), order_employee_names as (
  select employee_name as name from order_seed
  union
  select employee_name as name from item_seed
), employee_map as (
  select id, name from inserted_employees
  union
  select existing.id, existing.name
  from public.employees existing
  join order_employee_names names on names.name = existing.name
), inserted_orders as (
  insert into public.production_orders (
    id, order_date, employee_id, work_hours, shift, extra_qualified_hours, remark
  )
  select
    gen_random_uuid(),
    o.order_date,
    e.id,
    o.work_hours,
    '白班',
    o.extra_qualified_hours,
    o.remark
  from order_seed o
  join employee_map e on e.name = o.employee_name
  where not exists (
    select 1 from public.production_orders po
    where po.employee_id = e.id and po.order_date = o.order_date
  )
  returning id, employee_id, order_date
), target_orders as (
  select id, employee_id, order_date from inserted_orders
  union
  select po.id, po.employee_id, po.order_date
  from public.production_orders po
  join order_seed o on po.order_date = o.order_date
  join employee_map e on e.id = po.employee_id and e.name = o.employee_name
), prepared_items as (
  select
    o.id as order_id,
    i.project_no,
    i.product_model,
    case when so.product_model = i.product_model then coalesce(so.length_mm, i.length_mm) else i.length_mm end as length_mm,
    case when so.product_model = i.product_model then so.customer_model else null end as customer_model,
    i.operation,
    i.standard_seconds,
    i.incoming_qualified_quantity,
    i.qualified_quantity,
    i.defect_quantity_1,
    i.defect_reason_1,
    i.defect_quantity_2,
    i.defect_reason_2,
    i.data_category,
    i.remark
  from item_seed i
  join employee_map e on e.name = i.employee_name
  join target_orders o on o.employee_id = e.id and o.order_date = i.order_date
  left join public.sales_orders so on so.project_no = i.project_no
), inserted_items as (
  insert into public.production_order_items (
    order_id, project_no, product_model, length_mm, customer_model, operation,
    standard_seconds, incoming_qualified_quantity, qualified_quantity,
    defect_quantity_1, defect_reason_1, defect_quantity_2, defect_reason_2,
    data_category, remark
  )
  select
    p.order_id,
    p.project_no,
    p.product_model,
    p.length_mm,
    p.customer_model,
    p.operation,
    p.standard_seconds,
    p.incoming_qualified_quantity,
    p.qualified_quantity,
    p.defect_quantity_1,
    p.defect_reason_1,
    p.defect_quantity_2,
    p.defect_reason_2,
    p.data_category,
    p.remark
  from prepared_items p
  where not exists (
    select 1 from public.production_order_items poi
    where poi.order_id = p.order_id
      and coalesce(poi.project_no, '') = coalesce(p.project_no, '')
      and poi.product_model = p.product_model
      and coalesce(poi.length_mm, -1) = coalesce(p.length_mm, -1)
      and coalesce(poi.customer_model, '') = coalesce(p.customer_model, '')
      and poi.operation = p.operation
      and poi.qualified_quantity = p.qualified_quantity
      and coalesce(poi.defect_quantity_1, 0) = coalesce(p.defect_quantity_1, 0)
  )
  returning id
)
select
  ${employeesToCreate.length}::integer as expected_employees,
  ${processSeed.length}::integer as expected_process_standards,
  ${orderSeed.length}::integer as expected_orders,
  ${itemSeed.length}::integer as expected_items,
  (select count(*) from inserted_employees) as inserted_employees,
  (select count(*) from inserted_process) as inserted_process_standards,
  (select count(*) from inserted_orders) as inserted_orders,
  (select count(*) from inserted_items) as inserted_items;`
}

async function main() {
  const { workbook, remainingOrders } = await loadRemainingOrders()

  if (remainingOrders.length !== 35) {
    throw new Error(`剩余工单数量异常，期望 35，实际 ${remainingOrders.length}`)
  }

  const payload = buildRound7Payload(workbook, remainingOrders)
  const preview = {
    round: 7,
    scope: 'final_remaining_orders_by_user_rules',
    rules: [
      '先补员工档案',
      '缺型号/工序整单按零工导入',
      '合格数量非整数向上取整',
      '缺工序标准与带减分问题按历史数据原样导入',
    ],
    employees_to_create: payload.employeesToCreate,
    process_standards_to_create: payload.processSeed,
    totals: {
      orders: payload.orderSeed.length,
      items: payload.itemSeed.length,
      extra_hours_only_orders: payload.previewOrders.filter(
        (order) => order.import_mode === 'extra_hours_only',
      ).length,
      order_with_items: payload.previewOrders.filter(
        (order) => order.import_mode === 'order_with_items',
      ).length,
    },
    orders: payload.previewOrders,
  }

  const sql = buildRound7Sql(payload)
  const previewPath = fileURLToPath(
    new URL('../docs/imports/production_order_import_2026-03_round7_final.preview.json', import.meta.url),
  )
  const sqlPath = fileURLToPath(
    new URL('../docs/imports/production_order_import_2026-03_round7_final.sql', import.meta.url),
  )

  await Promise.all([
    writeFile(previewPath, `${JSON.stringify(preview, null, 2)}\n`, 'utf8'),
    writeFile(sqlPath, `${sql}\n`, 'utf8'),
  ])

  console.log(
    JSON.stringify(
      {
        remainingOrders: remainingOrders.length,
        employeesToCreate: payload.employeesToCreate.length,
        processStandardsToCreate: payload.processSeed.length,
        ordersToImport: payload.orderSeed.length,
        itemsToImport: payload.itemSeed.length,
      },
      null,
      2,
    ),
  )
}

await main()