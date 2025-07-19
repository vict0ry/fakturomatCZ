import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, GripVertical, Eye, EyeOff, BarChart3, Users, FileText, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { StatsCards } from '@/components/stats-cards';
import { RevenueChart } from '@/components/revenue-chart';
import { useQuery } from "@tanstack/react-query";
import { invoiceAPI } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DashboardWidget {
  id: string;
  title: string;
  type: 'stats' | 'chart' | 'recent-invoices' | 'quick-actions' | 'ai-assistant' | 'calendar';
  icon: React.ReactNode;
  enabled: boolean;
  order: number;
}

const defaultWidgets: DashboardWidget[] = [
  {
    id: 'stats',
    title: 'Statistiky',
    type: 'stats',
    icon: <BarChart3 className="w-4 h-4" />,
    enabled: true,
    order: 0
  },
  {
    id: 'chart',
    title: 'Graf výkonnosti', 
    type: 'chart',
    icon: <TrendingUp className="w-4 h-4" />,
    enabled: true,
    order: 1
  },
  {
    id: 'recent-invoices',
    title: 'Nejnovější faktury',
    type: 'recent-invoices',
    icon: <FileText className="w-4 h-4" />,
    enabled: true,
    order: 2
  },
  {
    id: 'quick-actions',
    title: 'Rychlé akce',
    type: 'quick-actions',
    icon: <DollarSign className="w-4 h-4" />,
    enabled: true,
    order: 3
  },
  {
    id: 'ai-assistant',
    title: 'AI Asistent',
    type: 'ai-assistant',
    icon: <Users className="w-4 h-4" />,
    enabled: true,
    order: 4
  },
  {
    id: 'calendar',
    title: 'Kalendář splatností',
    type: 'calendar',
    icon: <Calendar className="w-4 h-4" />,
    enabled: false,
    order: 5
  }
];

interface DraggableDashboardProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

export function DraggableDashboard({ isEditMode, onToggleEditMode }: DraggableDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    return saved ? JSON.parse(saved) : defaultWidgets;
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices/recent"],
    queryFn: () => invoiceAPI.getRecent(5),
  });

  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  }, [widgets]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedWidgets = items.map((item, index) => ({
      ...item,
      order: index
    }));

    setWidgets(updatedWidgets);
  };

  const toggleWidget = (widgetId: string) => {
    setWidgets(widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, enabled: !widget.enabled }
        : widget
    ));
  };

  const resetToDefault = () => {
    setWidgets(defaultWidgets);
    localStorage.removeItem('dashboard-widgets');
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="invoice-status-badge paid">Uhrazena</Badge>;
      case 'sent':
        return <Badge className="invoice-status-badge sent">Čeká na platbu</Badge>;
      case 'overdue':
        return <Badge className="invoice-status-badge overdue">Po splatnosti</Badge>;
      case 'draft':
        return <Badge className="invoice-status-badge draft">Koncept</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.enabled) return null;

    switch (widget.type) {
      case 'stats':
        return (
          <div className={`dashboard-widget ${isEditMode ? 'edit-mode' : ''}`}>
            <StatsCards />
          </div>
        );

      case 'chart':
        return (
          <div className={`dashboard-widget ${isEditMode ? 'edit-mode' : ''}`}>
            <RevenueChart />
          </div>
        );

      case 'recent-invoices':
        return (
          <div className={`dashboard-widget ${isEditMode ? 'edit-mode' : ''}`}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Nejnovější faktury
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="text-center py-4">Načítání...</div>
                ) : recentInvoices && recentInvoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Číslo</TableHead>
                        <TableHead>Zákazník</TableHead>
                        <TableHead>Částka</TableHead>
                        <TableHead>Stav</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentInvoices.slice(0, 3).map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <a 
                              href={`/invoices/${invoice.id}`}
                              className="text-primary hover:underline"
                            >
                              {invoice.invoiceNumber}
                            </a>
                          </TableCell>
                          <TableCell>{invoice.customer?.name}</TableCell>
                          <TableCell>{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Zatím nemáte žádné faktury
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'quick-actions':
        return (
          <div className={`dashboard-widget ${isEditMode ? 'edit-mode' : ''}`}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Rychlé akce
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" asChild>
                    <a href="/invoices/new">Nová faktura</a>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/customers/new">Nový zákazník</a>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/invoices?status=overdue">Faktury po splatnosti</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'ai-assistant':
        return (
          <div className={`dashboard-widget ${isEditMode ? 'edit-mode' : ''}`}>
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  AI Asistent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Zkuste: "Vytvoř fakturu pro ABC s.r.o. za konzultace 5000 Kč"
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    💬 Otevřít AI chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'calendar':
        return (
          <div className={`dashboard-widget ${isEditMode ? 'edit-mode' : ''}`}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Kalendář splatností
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Komponentní kalendář bude implementován
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (isEditMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Nastavení dashboardu</h2>
            <p className="text-sm text-gray-500">Přetáhněte widgety pro změnu pořadí a zapněte/vypněte je</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefault}>
              Obnovit výchozí
            </Button>
            <Button onClick={onToggleEditMode}>
              Dokončit úpravy
            </Button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard-widgets">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {widgets
                  .sort((a, b) => a.order - b.order)
                  .map((widget, index) => (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 ${snapshot.isDragging ? 'shadow-lg' : ''} ${
                            widget.enabled ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20' : 'border-gray-200 bg-gray-50 dark:bg-gray-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="w-5 h-5 text-gray-400" />
                              </div>
                              {widget.icon}
                              <span className="font-medium">{widget.title}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`widget-${widget.id}`} className="text-sm">
                                {widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </Label>
                              <Switch
                                id={`widget-${widget.id}`}
                                checked={widget.enabled}
                                onCheckedChange={() => toggleWidget(widget.id)}
                              />
                            </div>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {widgets
        .filter(widget => widget.enabled)
        .sort((a, b) => a.order - b.order)
        .map(widget => (
          <div key={widget.id}>
            {renderWidget(widget)}
          </div>
        ))}
    </div>
  );
}