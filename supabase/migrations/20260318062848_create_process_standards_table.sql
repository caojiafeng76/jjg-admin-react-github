
CREATE TABLE IF NOT EXISTS public.process_standards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    operation text NOT NULL,
    model text NOT NULL,
    standard_seconds numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT process_standards_operation_model_unique UNIQUE (operation, model)
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_process_standards_updated_at ON public.process_standards;

CREATE TRIGGER update_process_standards_updated_at
    BEFORE UPDATE ON public.process_standards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用 RLS
ALTER TABLE public.process_standards ENABLE ROW LEVEL SECURITY;
;
