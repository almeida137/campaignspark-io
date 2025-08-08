
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Megaphone, TrendingUp, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS = ['#FFD36A', '#1CC8C8', '#0B2B38', '#6B7280'];

export default function Dashboard() {
  // Buscar estatísticas de clientes
  const { data: clientStats } = useQuery({
    queryKey: ['client-stats'],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('status')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const stats = {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        paused: clients.filter(c => c.status === 'paused').length,
        closed: clients.filter(c => c.status === 'closed').length
      };
      
      return stats;
    }
  });

  // Buscar estatísticas de campanhas
  const { data: campaignStats } = useQuery({
    queryKey: ['campaign-stats'],
    queryFn: async () => {
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('status, budget')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const stats = {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        draft: campaigns.filter(c => c.status === 'draft').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0)
      };
      
      return stats;
    }
  });

  // Buscar últimos cálculos de ROI
  const { data: roiStats } = useQuery({
    queryKey: ['roi-stats'],
    queryFn: async () => {
      const { data: calculations, error } = await supabase
        .from('roi_calculations')
        .select('roi, revenue, investment')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      const avgRoi = calculations.length > 0 
        ? calculations.reduce((sum, c) => sum + c.roi, 0) / calculations.length
        : 0;
        
      const totalRevenue = calculations.reduce((sum, c) => sum + c.revenue, 0);
      const totalInvestment = calculations.reduce((sum, c) => sum + c.investment, 0);
      
      return {
        total: calculations.length,
        avgRoi,
        totalRevenue,
        totalInvestment
      };
    }
  });

  const clientChartData = clientStats ? [
    { name: 'Ativos', value: clientStats.active, color: '#1CC8C8' },
    { name: 'Pausados', value: clientStats.paused, color: '#FFD36A' },
    { name: 'Fechados', value: clientStats.closed, color: '#6B7280' }
  ] : [];

  const campaignChartData = campaignStats ? [
    { name: 'Ativas', value: campaignStats.active },
    { name: 'Rascunho', value: campaignStats.draft },
    { name: 'Concluídas', value: campaignStats.completed }
  ] : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao AdCentral - Seu hub de gestão de campanhas
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {clientStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {clientStats?.active || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {campaignStats?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              de {campaignStats?.total || 0} campanhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {roiStats?.avgRoi ? `${roiStats.avgRoi.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {roiStats?.total || 0} simulações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(campaignStats?.totalBudget || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              em campanhas ativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {clientChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status das Campanhas */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#FFD36A" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Rápido */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                Receita Total Simulada
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(roiStats?.totalRevenue || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                Investimento Total
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(roiStats?.totalInvestment || 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400">
                Lucro Projetado
              </h3>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency((roiStats?.totalRevenue || 0) - (roiStats?.totalInvestment || 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
