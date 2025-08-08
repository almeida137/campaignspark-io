
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Target, Calculator, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  // Buscar dados para o dashboard
  const { data: clientsCount = 0 } = useQuery({
    queryKey: ['clients-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: activeCampaigns = 0 } = useQuery({
    queryKey: ['active-campaigns'],
    queryFn: async () => {
      const { count } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      return count || 0;
    },
  });

  const { data: averageROI = 0 } = useQuery({
    queryKey: ['average-roi'],
    queryFn: async () => {
      const { data } = await supabase
        .from('roi_calculations')
        .select('roi');
      
      if (!data || data.length === 0) return 0;
      
      const sum = data.reduce((acc, calc) => acc + Number(calc.roi), 0);
      return Math.round(sum / data.length);
    },
  });

  const quickActions = [
    {
      title: 'Novo Cliente',
      description: 'Adicionar um novo cliente',
      href: '/clients?action=new',
      icon: Users,
      color: 'text-primary',
    },
    {
      title: 'Nova Campanha',
      description: 'Criar uma nova campanha',
      href: '/campaigns?action=new',
      icon: Target,
      color: 'text-secondary',
    },
    {
      title: 'Simular ROI',
      description: 'Calcular ROI e CAC',
      href: '/roi?action=new',
      icon: Calculator,
      color: 'text-primary',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu negócio de gestão de tráfego pago
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{clientsCount}</div>
              <p className="text-xs text-muted-foreground">clientes ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{activeCampaigns}</div>
              <p className="text-xs text-muted-foreground">campanhas em execução</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{averageROI}%</div>
              <p className="text-xs text-muted-foreground">retorno sobre investimento</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href}>
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                      <CardTitle className="text-base">{action.title}</CardTitle>
                    </div>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
