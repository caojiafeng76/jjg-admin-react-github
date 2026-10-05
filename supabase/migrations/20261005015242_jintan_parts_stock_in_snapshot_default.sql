-- 快照名称由 BEFORE INSERT 触发器填充；默认值仅使客户端可以只提交业务输入列。
alter table public.jintan_parts_stock_in
  alter column part_name set default '';
