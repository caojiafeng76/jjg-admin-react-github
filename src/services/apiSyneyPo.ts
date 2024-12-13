import supabase from './supabase'

export async function getSyneyPoDetail(PoId: string) {
  const { data, error } = await supabase
    .from('syney-po-items')
    .select('*')
    .eq('PoId', +PoId)

  if (error) {
    console.error(error)
    throw new Error('获取订单详情失败')
  }

  return data
}
