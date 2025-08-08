
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Copy, FileDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface Client {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  client_id: string;
  name: string;
  objective: string;
  budget: number;
  audience: string;
  platforms: string[];
  creatives: any[];
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  notes: string;
  created_at: string;
  clients?: { name: string };
}

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
type StatusFilter = 'all' | CampaignStatus;

const PLATFORMS = ['Facebook', 'Instagram', 'Google Ads', 'YouTube', 'LinkedIn', 'TikTok', 'Twitter'];

const STATUS_COLORS = {
  draft: 'bg-gray-500',
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  completed: 'bg-blue-500'
};

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    objective: '',
    budget: '',
    audience: '',
    platforms: [] as string[],
    creatives: [] as string[],
    start_date: '',
    end_date: '',
    status: 'draft' as CampaignStatus,
    notes: ''
  });

  const [newCreative, setNewCreative] = useState('');

  // Buscar clientes
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    }
  });

  // Buscar campanhas
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          clients:client_id(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    }
  });

  // Filtrar campanhas
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.objective.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesClient = clientFilter === 'all' || campaign.client_id === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  // Criar/Editar campanha
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const campaignData = {
        ...data,
        budget: data.budget ? parseFloat(data.budget) : null,
        creatives: data.creatives
      };

      if (editingCampaign) {
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('campaigns')
          .insert([campaignData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: editingCampaign ? 'Campanha atualizada!' : 'Campanha criada!',
        description: editingCampaign ? 'A campanha foi atualizada com sucesso.' : 'Nova campanha foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar campanha: ' + error.message,
        variant: 'destructive',
      });
    }
  });

  // Excluir campanha
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campanha excluída!',
        description: 'A campanha foi excluída com sucesso.',
      });
    }
  });

  // Duplicar campanha
  const duplicateMutation = useMutation({
    mutationFn: async (campaign: Campaign) => {
      const { clients, id, created_at, ...campaignData } = campaign;
      const newCampaignData = {
        ...campaignData,
        name: `${campaignData.name} (Cópia)`,
        status: 'draft' as CampaignStatus
      };

      const { error } = await supabase
        .from('campaigns')
        .insert([newCampaignData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast({
        title: 'Campanha duplicada!',
        description: 'A campanha foi duplicada com sucesso.',
      });
    }
  });

  const resetForm = () => {
    setFormData({
      client_id: '',
      name: '',
      objective: '',
      budget: '',
      audience: '',
      platforms: [],
      creatives: [],
      start_date: '',
      end_date: '',
      status: 'draft',
      notes: ''
    });
    setEditingCampaign(null);
    setNewCreative('');
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      client_id: campaign.client_id,
      name: campaign.name,
      objective: campaign.objective,
      budget: campaign.budget?.toString() || '',
      audience: campaign.audience,
      platforms: campaign.platforms || [],
      creatives: campaign.creatives?.map((c: any) => typeof c === 'string' ? c : c.name || c.url) || [],
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      status: campaign.status,
      notes: campaign.notes
    });
    setIsDialogOpen(true);
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const addCreative = () => {
    if (newCreative.trim()) {
      setFormData(prev => ({
        ...prev,
        creatives: [...prev.creatives, newCreative.trim()]
      }));
      setNewCreative('');
    }
  };

  const removeCreative = (index: number) => {
    setFormData(prev => ({
      ...prev,
      creatives: prev.creatives.filter((_, i) => i !== index)
    }));
  };

  const exportToPDF = (campaign: Campaign) => {
    const content = `
Campanha: ${campaign.name}
Cliente: ${campaign.clients?.name}
Objetivo: ${campaign.objective}
Orçamento: R$ ${campaign.budget?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Público: ${campaign.audience}
Plataformas: ${campaign.platforms?.join(', ')}
Data de Início: ${new Date(campaign.start_date).toLocaleDateString('pt-BR')}
Data de Fim: ${new Date(campaign.end_date).toLocaleDateString('pt-BR')}
Status: ${campaign.status.toUpperCase()}
Observações: ${campaign.notes}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campanha-${campaign.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Campanha exportada!',
      description: 'O arquivo foi baixado com sucesso.',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Campanhas</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? 'Editar' : 'Nova'} Campanha</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_id">Cliente *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Nome da Campanha *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="objective">Objetivo *</Label>
                  <Input
                    id="objective"
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    placeholder="Ex: Aumentar vendas, Gerar leads..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="budget">Orçamento (R$)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">Data de Fim</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: CampaignStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="paused">Pausada</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Público-alvo</Label>
                <Textarea
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  placeholder="Descreva o público-alvo da campanha..."
                />
              </div>

              <div>
                <Label>Plataformas</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {PLATFORMS.map((platform) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform}
                        checked={formData.platforms.includes(platform)}
                        onCheckedChange={() => handlePlatformToggle(platform)}
                      />
                      <Label htmlFor={platform} className="text-sm">{platform}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Criativos</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newCreative}
                      onChange={(e) => setNewCreative(e.target.value)}
                      placeholder="Nome ou URL do criativo..."
                    />
                    <Button type="button" onClick={addCreative}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.creatives.length > 0 && (
                    <div className="space-y-1">
                      {formData.creatives.map((creative, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{creative}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCreative(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações sobre a campanha..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="paused">Pausada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div>Carregando campanhas...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Objetivo</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Plataformas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.clients?.name}</TableCell>
                    <TableCell>{campaign.objective}</TableCell>
                    <TableCell>
                      {campaign.budget ? 
                        `R$ ${campaign.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {campaign.platforms?.slice(0, 2).map((platform) => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                        {campaign.platforms && campaign.platforms.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{campaign.platforms.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-white ${STATUS_COLORS[campaign.status]}`}>
                        {campaign.status === 'draft' && 'Rascunho'}
                        {campaign.status === 'active' && 'Ativa'}
                        {campaign.status === 'paused' && 'Pausada'}
                        {campaign.status === 'completed' && 'Concluída'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(campaign)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateMutation.mutate(campaign)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportToPDF(campaign)}
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta campanha?')) {
                              deleteMutation.mutate(campaign.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
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
