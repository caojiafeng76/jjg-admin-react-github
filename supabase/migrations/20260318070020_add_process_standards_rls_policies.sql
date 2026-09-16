-- 允许所有用户读取 process_standards
CREATE POLICY "Allow all users to read process_standards" 
ON public.process_standards FOR SELECT 
USING (true);

-- 允许所有用户插入 process_standards
CREATE POLICY "Allow all users to insert process_standards" 
ON public.process_standards FOR INSERT 
WITH CHECK (true);

-- 允许所有用户更新 process_standards
CREATE POLICY "Allow all users to update process_standards" 
ON public.process_standards FOR UPDATE 
USING (true) WITH CHECK (true);

-- 允许所有用户删除 process_standards
CREATE POLICY "Allow all users to delete process_standards" 
ON public.process_standards FOR DELETE 
USING (true);;
