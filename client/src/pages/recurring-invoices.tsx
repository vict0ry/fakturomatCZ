import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Repeat, Plus, Edit, Pause, Play, Trash2, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const recurringInvoiceSchema = z.object({
  templateName: z.string().min(1, "Název šablony je povinný"),
  customerId: z.number().min(1, "Zákazník je povinný"),
  frequency: z.enum(["monthly", "quarterly", "yearly"]),
  interval: z.number().min(1).max(12),
  startDate: z.string().min(1, "Datum začátku je povinné"),
  endDate: z.string().optional(),
  maxCount: z.number().optional(),
  notes: z.string().optional(),
});

type RecurringInvoiceForm = z.infer<typeof recurringInvoiceSchema>;

interface RecurringInvoice {
  id: number;
  templateName: string;
  customer: { name: string; id: number };
  frequency: string;
  interval: number;
  nextInvoiceDate: string;
  isActive: boolean;
  totalGenerated: number;
  lastGenerated?: string;
}

export default function RecurringInvoicesPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RecurringInvoiceForm>({
    resolver: zodResolver(recurringInvoiceSchema),
    defaultValues: {
      templateName: "",
      customerId: 0,
      frequency: "monthly",
      interval: 1,
      startDate: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  // Load recurring invoices
  const { data: recurringInvoices = [], isLoading } = useQuery<RecurringInvoice[]>({
    queryKey: ['/api/invoices/recurring'],
  });

  // Load customers for select
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  // Create recurring invoice
  const createMutation = useMutation({
    mutationFn: async (data: RecurringInvoiceForm) => {
      const response = await fetch('/api/invoices/recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to create recurring invoice');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Opakovaná faktura vytvořena",
        description: "Šablona pro opakované faktury byla úspěšně vytvořena.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices/recurring'] });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit opakovanou fakturu.",
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/invoices/recurring/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      
      if (!response.ok) throw new Error('Failed to toggle recurring invoice');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices/recurring'] });
      toast({
        title: "Stav změněn",
        description: "Stav opakované faktury byl úspěšně změněn.",
      });
    },
  });

  const getFrequencyLabel = (frequency: string, interval: number) => {
    const labels = {
      monthly: interval === 1 ? "Měsíčně" : `Každé ${interval} měsíce`,
      quarterly: interval === 1 ? "Čtvrtletně" : `Každé ${interval} čtvrtletí`,
      yearly: interval === 1 ? "Ročně" : `Každé ${interval} roky`,
    };
    return labels[frequency as keyof typeof labels] || frequency;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Opakované faktury
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Automatické generování faktur podle nastaveného rozvrhu
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-5 w-5 mr-2" />
              Nová opakovaná faktura
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Vytvořit opakovanou fakturu</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div>
                <Label htmlFor="templateName">Název šablony *</Label>
                <Input
                  {...form.register("templateName")}
                  placeholder="Měsíční faktura - Klient XYZ"
                  className="mt-1"
                />
                {form.formState.errors.templateName && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.templateName.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="customerId">Zákazník *</Label>
                <Select
                  value={form.watch("customerId")?.toString() || ""}
                  onValueChange={(value) => form.setValue("customerId", parseInt(value))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Vyberte zákazníka" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency">Frekvence *</Label>
                  <Select
                    value={form.watch("frequency")}
                    onValueChange={(value) => form.setValue("frequency", value as any)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Měsíčně</SelectItem>
                      <SelectItem value="quarterly">Čtvrtletně</SelectItem>
                      <SelectItem value="yearly">Ročně</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="interval">Interval *</Label>
                  <Input
                    type="number"
                    {...form.register("interval", { valueAsNumber: true })}
                    min="1"
                    max="12"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Začátek *</Label>
                  <Input
                    type="date"
                    {...form.register("startDate")}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">Konec (volitelné)</Label>
                  <Input
                    type="date"
                    {...form.register("endDate")}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="maxCount">Max. počet faktur (volitelné)</Label>
                <Input
                  type="number"
                  {...form.register("maxCount", { valueAsNumber: true })}
                  min="1"
                  placeholder="Neomezeně"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Poznámky</Label>
                <Textarea
                  {...form.register("notes")}
                  placeholder="Dodatečné poznámky k opakované faktuře"
                  className="mt-1"
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Zrušit
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? "Vytváření..." : "Vytvořit"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Načítání opakovaných faktur...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Repeat className="h-5 w-5" />
              <span>Aktivní opakované faktury ({recurringInvoices.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recurringInvoices.length === 0 ? (
              <div className="text-center py-8">
                <Repeat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Žádné opakované faktury
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Vytvořte si první šablonu pro automatické generování faktur
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Vytvořit první opakovanou fakturu
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Název šablony</TableHead>
                    <TableHead>Zákazník</TableHead>
                    <TableHead>Frekvence</TableHead>
                    <TableHead>Další faktura</TableHead>
                    <TableHead>Vytvořeno</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead>Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringInvoices.map((recurring) => (
                    <TableRow key={recurring.id}>
                      <TableCell className="font-medium">
                        {recurring.templateName}
                      </TableCell>
                      <TableCell>{recurring.customer.name}</TableCell>
                      <TableCell>
                        {getFrequencyLabel(recurring.frequency, recurring.interval)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(recurring.nextInvoiceDate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {recurring.totalGenerated} faktur
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={recurring.isActive ? "default" : "secondary"}>
                          {recurring.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aktivní
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pozastaveno
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleMutation.mutate({ 
                              id: recurring.id, 
                              isActive: recurring.isActive 
                            })}
                            disabled={toggleMutation.isPending}
                          >
                            {recurring.isActive ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
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
      )}
    </div>
  );
}