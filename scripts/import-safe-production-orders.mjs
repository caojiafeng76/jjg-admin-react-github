import { readFile } from 'node:fs/promises'
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

const ORDER_BATCH_SIZE = 50
const ITEM_BATCH_SIZE = 200

function chunk(array, size) {
  const chunks = []

  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size))
  }

  return chunks
}

async function loadImportData() {
  const fileContent = await readFile(
    new URL(
      '../docs/imports/production_order_import_2026-03_safe.sql',
      import.meta.url,
    ),
    'utf8',
  )

  const orderMatch = fileContent.match(
    /insert into public\.production_orders[\s\S]*?values\s*([\s\S]*?);\s*insert into public\.production_order_items/i,
  )
  const itemMatch = fileContent.match(
    /insert into public\.production_order_items[\s\S]*?values\s*([\s\S]*?);\s*commit;/i,
  )

  if (!orderMatch || !itemMatch) {
    throw new Error('安全 SQL 文件结构不符合预期，无法解析')
  }

  const orderColumns = [
    'id',
    'order_date',
    'employee_id',
    'work_hours',
    'shift',
    'extra_qualified_hours',
    'remark',
  ]
  const itemColumns = [
    'order_id',
    'project_no',
    'product_model',
    'length_mm',
    'customer_model',
    'operation',
    'standard_seconds',
    'incoming_qualified_quantity',
    'qualified_quantity',
    'defect_quantity_1',
    'defect_reason_1',
    'defect_quantity_2',
    'defect_reason_2',
    'data_category',
    'remark',
  ]

  const orders = parseInsertValues(orderMatch[1]).map((values) =>
    Object.fromEntries(
      orderColumns.map((column, index) => [column, values[index]]),
    ),
  )
  const items = parseInsertValues(itemMatch[1]).map((values) =>
    Object.fromEntries(
      itemColumns.map((column, index) => [column, values[index]]),
    ),
  )

  const orderMap = new Map(
    orders.map((order) => [order.id, { ...order, items: [] }]),
  )

  for (const item of items) {
    const targetOrder = orderMap.get(item.order_id)

    if (!targetOrder) {
      throw new Error(`找到孤立工序明细，order_id=${item.order_id}`)
    }

    targetOrder.items.push(item)
  }

  return Array.from(orderMap.values())
}

function parseInsertValues(input) {
  const tuples = []
  let index = 0

  while (index < input.length) {
    if (input[index] !== '(') {
      index += 1
      continue
    }

    index += 1
    const fields = []
    let current = ''
    let inString = false

    while (index < input.length) {
      const currentChar = input[index]
      const nextChar = input[index + 1]

      if (inString) {
        if (currentChar === "'" && nextChar === "'") {
          current += "''"
          index += 2
          continue
        }

        if (currentChar === "'") {
          inString = false
          current += currentChar
          index += 1
          continue
        }

        current += currentChar
        index += 1
        continue
      }

      if (currentChar === "'") {
        inString = true
        current += currentChar
        index += 1
        continue
      }

      if (currentChar === ',') {
        fields.push(parseSqlValue(current))
        current = ''
        index += 1
        continue
      }

      if (currentChar === ')') {
        fields.push(parseSqlValue(current))
        tuples.push(fields)
        index += 1
        break
      }

      current += currentChar
      index += 1
    }
  }

  return tuples
}

function parseSqlValue(rawValue) {
  const value = rawValue.trim()

  if (value.toLowerCase() === 'null') {
    return null
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replaceAll("''", "'")
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value)
  }

  return value
}

async function assertAdminSession() {
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })

  if (signInError) {
    throw new Error(`管理员登录失败: ${signInError.message}`)
  }

  if (!signInData.session) {
    throw new Error('管理员登录失败: 未获取到会话')
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')

  if (adminError) {
    throw new Error(`管理员权限校验失败: ${adminError.message}`)
  }

  if (!isAdmin) {
    throw new Error('当前账号不是管理员，无法导入工单')
  }
}

async function fetchExistingOrderIds(orderIds) {
  const existingIds = new Set()

  for (const idBatch of chunk(orderIds, 200)) {
    const { data, error } = await supabase
      .from('production_orders')
      .select('id')
      .in('id', idBatch)

    if (error) {
      throw new Error(`检查现有工单失败: ${error.message}`)
    }

    for (const row of data ?? []) {
      existingIds.add(row.id)
    }
  }

  return existingIds
}

async function insertOrders(orders) {
  for (const orderBatch of chunk(orders, ORDER_BATCH_SIZE)) {
    const payload = orderBatch.map(({ items, ...order }) => order)

    const { error } = await supabase.from('production_orders').insert(payload)

    if (error) {
      throw new Error(`插入工单失败: ${error.message}`)
    }
  }
}

async function insertItems(orders) {
  const items = orders.flatMap((order) =>
    order.items.map((item) => ({
      order_id: order.id,
      project_no: item.project_no,
      product_model: item.product_model,
      length_mm: item.length_mm,
      customer_model: item.customer_model,
      operation: item.operation,
      standard_seconds: item.standard_seconds,
      incoming_qualified_quantity: item.incoming_qualified_quantity,
      qualified_quantity: item.qualified_quantity,
      defect_quantity_1: item.defect_quantity_1,
      defect_reason_1: item.defect_reason_1,
      defect_quantity_2: item.defect_quantity_2,
      defect_reason_2: item.defect_reason_2,
      data_category: item.data_category,
      remark: item.remark,
    })),
  )

  for (const itemBatch of chunk(items, ITEM_BATCH_SIZE)) {
    const { error } = await supabase
      .from('production_order_items')
      .insert(itemBatch)

    if (error) {
      throw new Error(`插入工序明细失败: ${error.message}`)
    }
  }

  return items.length
}

async function verifyImport(orderIds) {
  let orderCount = 0
  let itemCount = 0

  for (const idBatch of chunk(orderIds, 200)) {
    const [
      { count: currentOrderCount, error: orderError },
      { count: currentItemCount, error: itemError },
    ] = await Promise.all([
      supabase
        .from('production_orders')
        .select('id', { count: 'exact', head: true })
        .in('id', idBatch),
      supabase
        .from('production_order_items')
        .select('order_id', { count: 'exact', head: true })
        .in('order_id', idBatch),
    ])

    if (orderError) {
      throw new Error(`回查工单数量失败: ${orderError.message}`)
    }

    if (itemError) {
      throw new Error(`回查工序明细数量失败: ${itemError.message}`)
    }

    orderCount += currentOrderCount ?? 0
    itemCount += currentItemCount ?? 0
  }

  return { orderCount, itemCount }
}

async function main() {
  await assertAdminSession()

  const orders = await loadImportData()
  const orderIds = orders.map((order) => order.id)
  const existingIds = await fetchExistingOrderIds(orderIds)

  const pendingOrders = orders.filter((order) => !existingIds.has(order.id))

  if (pendingOrders.length > 0) {
    await insertOrders(pendingOrders)
    await insertItems(pendingOrders)
  }

  const expectedItemCount = orders.reduce(
    (total, order) => total + order.items.length,
    0,
  )
  const { orderCount, itemCount } = await verifyImport(orderIds)

  console.log(
    JSON.stringify(
      {
        existingOrdersBeforeImport: existingIds.size,
        importedOrders: pendingOrders.length,
        expectedOrders: orders.length,
        expectedItems: expectedItemCount,
        verifiedOrders: orderCount,
        verifiedItems: itemCount,
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
    // ignore sign out errors on failure path
  }

  process.exit(1)
})
