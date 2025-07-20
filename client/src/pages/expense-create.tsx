import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { ArrowLeft, Save, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const expenseSchema = z.object({
  supplierName: z.string().min(1, 'Název dodavatele je povinný'),
  category: z.string().min(1, 'Kategorie je povinná'),
  description: z.string().min(1, 'Popis je povinný'),
  receiptNumber: z.string().optional(),
  amount: z.string().min(1, 'Částka je povinná'),
  vatRate: z.string().default('21'),
  vatAmount: z.string().optional(),
  total: z.string().min(1, 'Celková částka je povinná'),
  expenseDate: z.string().min(1, 'Datum nákladu je povinné'),
  dueDate: z.string().optional(),
  status: z.string().default('draft'),
  notes: z.string().optional()
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const EXPENSE_CATEGORIES = [
  'Office',
  'Travel',
  'Marketing', 
  'IT',
  'Utilities',
  'Fuel',
  'Materials',
  'Services',
  'Other'
];

export default function ExpenseCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      supplierName: '',
      category: '',
      description: '',
      receiptNumber: '',
      amount: '',
      vatRate: '21',
      vatAmount: '',
      total: '',
      expenseDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      status: 'draft',
      notes: ''
    }
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => 
      apiRequest('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: 'Náklad vytvořen',
        description: 'Náklad byl úspěšně vytvořen'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      setLocation('/expenses');
    },
    onError: (error: any) => {
      toast({
        title: 'Chyba',
        description: error.message || 'Nepodařilo se vytvořit náklad',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: ExpenseFormData) => {
    createExpenseMutation.mutate(data);
  };

  // Auto-calculate total from amount and VAT
  const calculateTotal = () => {
    const amount = parseFloat(form.getValues('amount') || '0');
    const vatRate = parseFloat(form.getValues('vatRate') || '21');
    
    if (amount > 0) {
      const vatAmount = (amount * vatRate) / 100;
      const total = amount + vatAmount;
      
      form.setValue('vatAmount', vatAmount.toFixed(2));
      form.setValue('total', total.toFixed(2));
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/expenses')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět na náklady
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Nový náklad
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Vytvořte nový náklad pro vaši společnost
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Základní informace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="supplierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Název dodavatele *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Např. ČEZ a.s."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte kategorii" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Popis nákladu *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Např. Elektřina za prosinec 2024"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receiptNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Číslo účtenky/faktury</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Např. 5858338"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expenseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum nákladu *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="w-5 h-5" />
                <span>Finanční údaje</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Částka bez DPH *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onBlur={() => {
                            field.onBlur();
                            calculateTotal();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vatRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sazba DPH (%)</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setTimeout(calculateTotal, 100);
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="21">21%</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celková částka *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={calculateTotal}
                className="flex items-center space-x-2"
              >
                <Calculator className="w-4 h-4" />
                <span>Vypočítat celkovou částku</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dodatečné informace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poznámky</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Dodatečné poznámky k nákladu..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/expenses')}
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              disabled={createExpenseMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {createExpenseMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Vytvořit náklad
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}