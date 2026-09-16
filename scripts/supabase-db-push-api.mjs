// Keep the historical command name while sharing standard CLI migration execution.
console.log(
  'db:push:api 已改为标准迁移入口的兼容别名；不再逐条执行 SQL 或手动登记历史。',
)
await import('./supabase-db-push.mjs')
