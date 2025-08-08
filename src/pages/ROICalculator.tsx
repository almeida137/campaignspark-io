
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Calculator, TrendingUp, DollarSign, Target, History } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ROICalculation {
  id: string;
  campaign_id?: string;
  investment: number;
  ticket: number;
  conversion_rate: number;
  sales: number;
  revenue: number;
  target_revenue?: number;
  roi: number;
  cac: number;
  breakeven?: number;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
}

export default function ROICalculator() {
  const [formData, setFormData] = useState({
    campaign_id: '',
    investment: '',
    ticket: '',
    conversion_rate: '',
    target_revenue: ''
  });

  const [calculatedResults, setCalculatedResults] = useState<{
    sales: number;
    revenue: number;
    roi: number;
    cac: number;
    breakeven: number;
  } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar campanhas para seleção
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .in('status', ['active', 'completed'])
        .order('name');
      
      if (error) throw error;
      return data as Campaign[];
    }
  });

  // Buscar histórico de cálculos
  const { data: calculations = [], isLoading } = useQuery({
    queryKey: ['roi-calculations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roi_calculations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as ROICalculation[];
    }
  });

  // Salvar cálculo
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('roi_calculations')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roi-calculations'] });
      toast({
        title: 'Cálculo salvo!',
        description: 'O cálculo de ROI foi salvo no histórico.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar cálculo: ' + error.message,
        variant: 'destructive',
      });
    }
  });

  const calculateMetrics = () => {
    const investment = parseFloat(formData.investment);
    const ticket = parseFloat(formData.ticket);
    const conversionRate = parseFloat(formData.conversion_rate);
    const targetRevenue = parseFloat(formData.target_revenue) || 0;

    if (!investment || !ticket || !conversionRate) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha pelo menos investimento, ticket médio e taxa de conversão.',
        variant: 'destructive',
      });
      return;
    }

    // Cálculos
    const sales = Math.round((investment / ticket) * (conversionRate / 100));
    const revenue = sales * ticket;
    const roi = ((revenue - investment) / investment) * 100;
    const cac = investment / sales;
    const breakeven = investment / (ticket * 0.3); // Assumindo margem de 30%

    const results = {
      sales,
      revenue,
      roi,
      cac,
      breakeven
    };

    setCalculatedResults(results);

    // Preparar dados para salvar
    const calculationData = {
      campaign_id: formData.campaign_id || null,
      investment,
      ticket,
      conversion_rate: conversionRate,
      sales,
      revenue,
      target_revenue: targetRevenue || null,
      roi,
      cac,
      breakeven
    };

    // Salvar automaticamente
    saveMutation.mutate(calculationData);
  };

  const resetForm = () => {
    setFormData({
      campaign_id: '',
      investment: '',
      ticket: '',
      conversion_rate: '',
      target_revenue: ''
    });
    setCalculatedResults(null);
  };

  // Preparar dados para gráfico comparativo
  const chartData = calculations.slice(0, 5).map((calc, index) => ({
    name: `Cálculo ${index + 1}`,
    ROI: calc.roi,
    'ROI Ideal': 200, // Meta de 200% ROI
    CAC: calc.cac,
    'CAC Ideal': calc.ticket * 0.3 // 30% do ticket
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Simulador ROI/CAC</h1>
        <Button onClick={resetForm} variant="outline">
          <Calculator className="w-4 h-4 mr-2" />
          Nova Simulação
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Cálculo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Dados da Campanha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="campaign_id">Campanha (opcional)</Label>
              <select
                id="campaign_id"
                value={formData.campaign_id}
                onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="">Selecione uma campanha</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="investment">Investimento (R$) *</Label>
              <Input
                id="investment"
                type="number"
                step="0.01"
                placeholder="10000.00"
                value={formData.investment}
                onChange={(e) => setFormData({ ...formData, investment: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="ticket">Ticket Médio (R$) *</Label>
              <Input
                id="ticket"
                type="number"
                step="0.01"
                placeholder="500.00"
                value={formData.ticket}
                onChange={(e) => setFormData({ ...formData, ticket: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="conversion_rate">Taxa de Conversão (%) *</Label>
              <Input
                id="conversion_rate"
                type="number"
                step="0.01"
                placeholder="2.5"
                value={formData.conversion_rate}
                onChange={(e) => setFormData({ ...formData, conversion_rate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="target_revenue">Meta de Faturamento (R$)</Label>
              <Input
                id="target_revenue"
                type="number"
                step="0.01"
                placeholder="50000.00"
                value={formData.target_revenue}
                onChange={(e) => setFormData({ ...formData, target_revenue: e.target.value })}
              />
            </div>

            <Button onClick={calculateMetrics} className="w-full" disabled={saveMutation.isPending}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Calcular Métricas
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        {calculatedResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Resultados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Vendas</span>
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {calculatedResults.sales}
                  </p>
                  <p className="text-xs text-muted-foreground">unidades</p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Receita</span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(calculatedResults.revenue)}
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ROI</span>
                    <Target className="w-4 h-4 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatPercentage(calculatedResults.roi)}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CAC</span>
                    <Calculator className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(calculatedResults.cac)}
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <h4 className="font-medium mb-2">Ponto de Equilíbrio</h4>
                <p className="text-lg font-bold">
                  {Math.ceil(calculatedResults.breakeven)} vendas
                </p>
                <p className="text-sm text-muted-foreground">
                  Para cobrir o investimento (assumindo 30% de margem)
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Gráfico Comparativo */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'ROI' || name === 'ROI Ideal' ? formatPercentage(Number(value)) : formatCurrency(Number(value)),
                      name
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="ROI" stroke="#FFD36A" strokeWidth={2} name="ROI Real" />
                  <Line type="monotone" dataKey="ROI Ideal" stroke="#1CC8C8" strokeWidth={2} strokeDasharray="5 5" name="ROI Ideal" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Cálculos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="w-5 h-5 mr-2" />
            Histórico de Simulações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Carregando histórico...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Investimento</TableHead>
                  <TableHead>Ticket Médio</TableHead>
                  <TableHead>Conv. %</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Receita</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>CAC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calc) => (
                  <TableRow key={calc.id}>
                    <TableCell>
                      {new Date(calc.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{formatCurrency(calc.investment)}</TableCell>
                    <TableCell>{formatCurrency(calc.ticket)}</TableCell>
                    <TableCell>{formatPercentage(calc.conversion_rate)}</TableCell>
                    <TableCell>{calc.sales}</TableCell>
                    <TableCell>{formatCurrency(calc.revenue)}</TableCell>
                    <TableCell className={calc.roi > 100 ? 'text-green-600 font-semibold' : 'text-red-600'}>
                      {formatPercentage(calc.roi)}
                    </TableCell>
                    <TableCell>{formatCurrency(calc.cac)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
