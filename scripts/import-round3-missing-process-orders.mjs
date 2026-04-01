import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import XLSX from 'xlsx-js-style'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_REACT_APP_SUPABASE_URL
const supabaseKey = process.env.VITE_REACT_APP_SUPABASE_KEY
const adminEmail = process.env.IMPORT_ADMIN_EMAIL
const adminPassword = process.env.IMPORT_ADMIN_PASSWORD

if (!supabaseUrl || !supabaseKey) {
  throw new Error('缺少 Supabase 环境变量')
}

if (!adminEmail || !adminPassword) {
  throw new Error('缺少管理员登录凭证环境变量')
}

const supabase = createClient(supabaseUrl, supabaseKey)
const FIXED_ORDER_KEYS = new Set([
  '熊龙华|2026-03-08',
  '熊龙华|2026-03-09',
  '熊龙华|2026-03-10',
])

const PROCESS_STANDARD_BATCH_SIZE = 50
const ORDER_BATCH_SIZE = 50
const ITEM_BATCH_SIZE = 200

function chunk(array, size) {
  const chunks = []

  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size))
  }

  return chunks
}

function isPureMissingProcess(order) {
  return order.blockers.every(
    (blocker) =>
      blocker.includes('工序标准不存在:') &&
      !/减分|不良数量|非整数|缺少型号|缺少工序|员工未建档|项目号/.test(blocker),
  )
}

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

async function signInAsAdmin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  })

  if (error) {
    throw new Error(`管理员登录失败: ${error.message}`)
  }

  if (!data.session) {
    throw new Error('管理员登录失败: 未获取到会话')
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

  if (adminError) {
    throw new Error(`管理员权限校验失败: ${adminError.message}`)
  }

  if (!isAdmin) {
    throw new Error('当前账号不是管理员，无法执行导入')
  }
}

async function loadEligibleOrders() {
  const blockedPath = fileURLToPath(
    new URL(
      '../docs/imports/production_order_import_2026-03_blocked.json',
      import.meta.url,
    ),
  )
  const workbookPath = fileURLToPath(
    new URL('../2026年3月精加工 (2) (1).xlsx', import.meta.url),
  )

  const [blockedContent, workbook] = await Promise.all([
    readFile(blockedPath, 'utf8'),
    Promise.resolve(XLSX.readFile(workbookPath, { cellDates: false })),
  ])

  const blockedOrders = JSON.parse(blockedContent)
  const candidateOrders = blockedOrders.filter((order) => {
    const orderKey = `${order.employee}|${order.order_date}`
    return !FIXED_ORDER_KEYS.has(orderKey) && isPureMissingProcess(order)
  })

  const comboMap = new Map()

  for (const order of candidateOrders) {
    const sheet = workbook.Sheets[order.employee]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

    for (const rowNumber of order.source_rows) {
      const row = rows[rowNumber - 1] || []
      const comboKey = `${row[4]}|||${row[6]}`
      if (!comboMap.has(comboKey)) {
        comboMap.set(comboKey, {
          model: row[4],
          operation: row[6],
          standardSecondsValues: new Set(),
        })
      }

      comboMap.get(comboKey).standardSecondsValues.add(String(row[7]))
    }
  }

  const consistentCombos = new Map(
    Array.from(comboMap.entries())
      .filter(([, value]) => value.standardSecondsValues.size === 1)
      .map(([comboKey, value]) => [
        comboKey,
        {
          model: value.model,
          operation: value.operation,
          standard_seconds: Number(Array.from(value.standardSecondsValues)[0]),
          remark: '2026-03 历史工单补录自动补齐',
        },
      ])
      .filter(([, combo]) => Number.isFinite(combo.standard_seconds)),
  )

  const eligibleOrders = candidateOrders
    .map((order) => {
      const sheet = workbook.Sheets[order.employee]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })
      const items = order.source_rows.map((rowNumber) => {
        const row = rows[rowNumber - 1] || []
        const comboKey = `${row[4]}|||${row[6]}`
        return {
          rowNumber,
          comboKey,
          order_date: parseExcelDate(row[0]),
          project_no: normalizeNullableText(row[3]) ?? '',
          product_model: String(row[4]),
          length_mm: row[5] === null || row[5] === '' ? null : Number(row[5]),
          operation: String(row[6]),
          standard_seconds: Number(row[7]),
          incoming_qualified_quantity: Number(row[8]),
          qualified_quantity: Number(row[8]),
          remark: normalizeNullableText(row[16]),
        }
      })

      return {
        ...order,
        items,
      }
    })
    .filter((order) =>
      order.items.every((item) => consistentCombos.has(item.comboKey)),
    )

  return { eligibleOrders, consistentCombos }
}

async function fetchExistingProcessStandards(combos) {
  const existing = new Set()

  for (const batch of chunk(combos, 100)) {
    const filters = batch
      .map(
        (combo) =>
          `and(model.eq.${combo.model},operation.eq.${combo.operation})`,
      )
      .join(',')

    const { data, error } = await supabase
      .from('process_standards')
      .select('model, operation')
      .or(filters)

    if (error) {
      throw new Error(`查询现有工序标准失败: ${error.message}`)
    }

    for (const row of data ?? []) {
      existing.add(`${row.model}|||${row.operation}`)
    }
  }

  return existing
}

async function insertMissingProcessStandards(combos) {
  const existing = await fetchExistingProcessStandards(combos)
  const pending = combos.filter(
    (combo) => !existing.has(`${combo.model}|||${combo.operation}`),
  )

  for (const batch of chunk(pending, PROCESS_STANDARD_BATCH_SIZE)) {
    const { error } = await supabase.from('process_standards').insert(batch)

    if (error) {
      throw new Error(`插入缺失工序标准失败: ${error.message}`)
    }
  }

  return pending.length
}

async function fetchSalesOrders(projectNos) {
  const salesOrderMap = new Map()
  const filteredProjectNos = Array.from(
    new Set(projectNos.filter((projectNo) => projectNo)),
  )

  for (const batch of chunk(filteredProjectNos, 100)) {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('project_no, product_model, length_mm, customer_model')
      .in('project_no', batch)

    if (error) {
      throw new Error(`查询销售订单失败: ${error.message}`)
    }

    for (const row of data ?? []) {
      if (row.project_no) {
        salesOrderMap.set(row.project_no, row)
      }
    }
  }

  return salesOrderMap
}

async function fetchExistingOrdersByEmployeeDate(orderPairs) {
  const existing = new Map()

  for (const batch of chunk(orderPairs, 100)) {
    const filters = batch
      .map(
        ({ employee_id, order_date }) =>
          `and(employee_id.eq.${employee_id},order_date.eq.${order_date})`,
      )
      .join(',')

    const { data, error } = await supabase
      .from('production_orders')
      .select('id, employee_id, order_date')
      .or(filters)

    if (error) {
      throw new Error(`查询现有工单失败: ${error.message}`)
    }

    for (const row of data ?? []) {
      existing.set(`${row.employee_id}|${row.order_date}`, row.id)
    }
  }

  return existing
}

async function insertOrdersAndItems(eligibleOrders) {
  const salesOrderMap = await fetchSalesOrders(
    eligibleOrders.flatMap((order) =>
      order.items.map((item) => item.project_no),
    ),
  )

  const orderPairs = eligibleOrders.map((order) => ({
    employee_id: order.employee_id,
    order_date: order.order_date,
  }))
  const existingOrderMap = await fetchExistingOrdersByEmployeeDate(orderPairs)

  const ordersToInsert = []
  const orderIdMap = new Map(existingOrderMap)

  for (const order of eligibleOrders) {
    const key = `${order.employee_id}|${order.order_date}`
    if (orderIdMap.has(key)) {
      continue
    }

    const id = randomUUID()
    orderIdMap.set(key, id)
    ordersToInsert.push({
      id,
      order_date: order.order_date,
      employee_id: order.employee_id,
      work_hours: order.work_hours,
      shift: '白班',
      extra_qualified_hours: 0,
      remark: null,
    })
  }

  for (const batch of chunk(ordersToInsert, ORDER_BATCH_SIZE)) {
    const { error } = await supabase.from('production_orders').insert(batch)

    if (error) {
      throw new Error(`插入 round3 工单失败: ${error.message}`)
    }
  }

  const itemsToInsert = []

  for (const order of eligibleOrders) {
    const orderId = orderIdMap.get(`${order.employee_id}|${order.order_date}`)

    for (const item of order.items) {
      const salesOrder = salesOrderMap.get(item.project_no)
      itemsToInsert.push({
        order_id: orderId,
        project_no: item.project_no,
        product_model: item.product_model,
        length_mm:
          salesOrder?.product_model === item.product_model
            ? (salesOrder.length_mm ?? item.length_mm)
            : item.length_mm,
        customer_model:
          salesOrder?.product_model === item.product_model
            ? (salesOrder.customer_model ?? null)
            : null,
        operation: item.operation,
        standard_seconds: item.standard_seconds,
        incoming_qualified_quantity: item.incoming_qualified_quantity,
        qualified_quantity: item.qualified_quantity,
        defect_quantity_1: 0,
        defect_reason_1: null,
        defect_quantity_2: 0,
        defect_reason_2: '原料',
        data_category: 'A',
        remark: item.remark,
      })
    }
  }

  const existingItemKeys = new Set()

  for (const batch of chunk(
    Array.from(new Set(itemsToInsert.map((item) => item.order_id))),
    200,
  )) {
    const { data, error } = await supabase
      .from('production_order_items')
      .select(
        'order_id, project_no, product_model, length_mm, customer_model, operation, qualified_quantity',
      )
      .in('order_id', batch)

    if (error) {
      throw new Error(`查询现有 round3 明细失败: ${error.message}`)
    }

    for (const row of data ?? []) {
      existingItemKeys.add(
        [
          row.order_id,
          row.project_no ?? '',
          row.product_model,
          row.length_mm ?? '',
          row.customer_model ?? '',
          row.operation,
          row.qualified_quantity,
        ].join('|||'),
      )
    }
  }

  const pendingItems = itemsToInsert.filter((item) => {
    const key = [
      item.order_id,
      item.project_no ?? '',
      item.product_model,
      item.length_mm ?? '',
      item.customer_model ?? '',
      item.operation,
      item.qualified_quantity,
    ].join('|||')

    return !existingItemKeys.has(key)
  })

  for (const batch of chunk(pendingItems, ITEM_BATCH_SIZE)) {
    const { error } = await supabase
      .from('production_order_items')
      .insert(batch)

    if (error) {
      throw new Error(`插入 round3 工序明细失败: ${error.message}`)
    }
  }

  return {
    importedOrders: ordersToInsert.length,
    importedItems: pendingItems.length,
    expectedOrders: eligibleOrders.length,
    expectedItems: itemsToInsert.length,
  }
}

async function verifyRound3Orders(eligibleOrders) {
  const existingOrderMap = await fetchExistingOrdersByEmployeeDate(
    eligibleOrders.map((order) => ({
      employee_id: order.employee_id,
      order_date: order.order_date,
    })),
  )

  const orderIds = Array.from(existingOrderMap.values())
  let verifiedOrderCount = orderIds.length
  let verifiedItemCount = 0

  for (const batch of chunk(orderIds, 200)) {
    const { count, error } = await supabase
      .from('production_order_items')
      .select('order_id', { count: 'exact', head: true })
      .in('order_id', batch)

    if (error) {
      throw new Error(`回查 round3 工序明细失败: ${error.message}`)
    }

    verifiedItemCount += count ?? 0
  }

  return {
    verifiedOrderCount,
    verifiedItemCount,
  }
}

async function main() {
  await signInAsAdmin()
  const { eligibleOrders, consistentCombos } = await loadEligibleOrders()
  const combos = Array.from(consistentCombos.values())
  const insertedProcessStandards = await insertMissingProcessStandards(combos)
  const importResult = await insertOrdersAndItems(eligibleOrders)
  const verifyResult = await verifyRound3Orders(eligibleOrders)

  console.log(
    JSON.stringify(
      {
        insertedProcessStandards,
        eligibleOrders: eligibleOrders.length,
        eligibleItems: eligibleOrders.reduce(
          (sum, order) => sum + order.item_count,
          0,
        ),
        ...importResult,
        ...verifyResult,
      },
      null,
      2,
    ),
  )

  await supabase.auth.signOut()
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error)

  try {
    await supabase.auth.signOut()
  } catch {
    // ignore cleanup errors
  }

  process.exit(1)
})
