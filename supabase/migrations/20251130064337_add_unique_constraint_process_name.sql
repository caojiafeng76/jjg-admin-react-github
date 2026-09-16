-- 为工序名称添加唯一约束
ALTER TABLE workshop_processes 
ADD CONSTRAINT workshop_processes_process_name_unique UNIQUE (process_name);;
