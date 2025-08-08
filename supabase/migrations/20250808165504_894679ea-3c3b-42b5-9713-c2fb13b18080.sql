
-- Criar enum para status dos clientes
CREATE TYPE client_status AS ENUM ('active', 'paused', 'closed');

-- Criar enum para status das campanhas
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');

-- Criar tabela de clientes
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  niche TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  monthly_budget DECIMAL(10,2),
  notes TEXT,
  status client_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de campanhas
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT,
  platform TEXT,
  audience TEXT,
  budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  creatives JSONB DEFAULT '[]',
  notes TEXT,
  status campaign_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de checklists
CREATE TABLE public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Checklist de Lançamento',
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de cálculos de ROI
CREATE TABLE public.roi_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment DECIMAL(10,2) NOT NULL,
  ticket DECIMAL(10,2) NOT NULL,
  conversion_rate DECIMAL(5,2) NOT NULL,
  sales INTEGER NOT NULL,
  revenue DECIMAL(10,2) NOT NULL,
  roi DECIMAL(10,2) NOT NULL,
  cac DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_calculations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clients
CREATE POLICY "Users can view their own clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para campaigns
CREATE POLICY "Users can view campaigns of their clients" ON public.campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = campaigns.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create campaigns for their clients" ON public.campaigns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = campaigns.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaigns of their clients" ON public.campaigns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = campaigns.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaigns of their clients" ON public.campaigns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = campaigns.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Políticas RLS para checklists
CREATE POLICY "Users can view checklists of their campaigns" ON public.checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.clients cl ON c.client_id = cl.id
      WHERE c.id = checklists.campaign_id 
      AND cl.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create checklists for their campaigns" ON public.checklists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.clients cl ON c.client_id = cl.id
      WHERE c.id = checklists.campaign_id 
      AND cl.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checklists of their campaigns" ON public.checklists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.clients cl ON c.client_id = cl.id
      WHERE c.id = checklists.campaign_id 
      AND cl.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checklists of their campaigns" ON public.checklists
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.clients cl ON c.client_id = cl.id
      WHERE c.id = checklists.campaign_id 
      AND cl.user_id = auth.uid()
    )
  );

-- Políticas RLS para roi_calculations
CREATE POLICY "Users can view their own ROI calculations" ON public.roi_calculations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ROI calculations" ON public.roi_calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ROI calculations" ON public.roi_calculations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ROI calculations" ON public.roi_calculations
  FOR DELETE USING (auth.uid() = user_id);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON public.checklists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
