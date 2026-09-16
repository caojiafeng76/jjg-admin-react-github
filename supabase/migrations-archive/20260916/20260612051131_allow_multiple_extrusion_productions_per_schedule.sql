-- 同一生产日期、设备和班次允许创建多张挤压生产单。
alter table public.extrusion_productions
drop constraint if exists extrusion_productions_unique_schedule;
