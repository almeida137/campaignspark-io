
-- Adicionar coluna goals na tabela clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS goals TEXT;

-- Modificar tabela campaigns para incluir os novos campos
ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}',
  DROP COLUMN IF EXISTS platform;

-- Modificar tabela roi_calculations para incluir os novos campos
ALTER TABLE public.roi_calculations 
  ADD COLUMN IF NOT EXISTS target_revenue DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS breakeven DECIMAL(10,2);
