import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { customerAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, Calculator } from "lucide-react";
import type { Customer, Invoice, InvoiceItem } from "@/lib/api";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Popis je povinný"),
  quantity: z.string().min(1, "Množství je povinné"),
  unitPrice: z.string().min(1, "Jednotková cena je povinná"),
  vatRate: z.string().default("21"),
  total: z.string().default("0"),
});

const invoiceSchema = z.object({
  customerId: z.number(),
  type: z.enum(["invoice", "proforma", "credit_note"]).default("invoice"),
  invoiceNumber: z.string().optional(),
  issueDate: z.string().min(1, "Datum vystavení je povinné"),
  dueDate: z.string().min(1, "Datum splatnosti je povinné"),
  subtotal: z.string().default("0"),
  vatAmount: z.string().default("0"),
  total: z.string().default("0"),
  currency: z.string().default("CZK"),
  isReverseCharge: z.boolean().default(false),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Alespoň jedna položka je povinná"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: InvoiceFormData) => void;
  isLoading?: boolean;
}

export function InvoiceForm({ invoice, onSubmit, isLoading = false }: InvoiceFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const { toast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14); // 14 days from today
  const dueDateString = defaultDueDate.toISOString().split('T')[0];

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: invoice?.customerId || 0,
      type: invoice?.type || "invoice",
      invoiceNumber: invoice?.invoiceNumber || "",
      issueDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : today,
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : dueDateString,
      subtotal: invoice?.subtotal || "0",
      vatAmount: invoice?.vatAmount || "0",
      total: invoice?.total || "0",
      currency: invoice?.currency || "CZK",
      isReverseCharge: invoice?.isReverseCharge || false,
      status: invoice?.status || "draft",
      notes: invoice?.notes || "",
      items: invoice?.items?.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        total: item.total,
      })) || [
        {
          description: "",
          quantity: "1",
          unitPrice: "0",
          vatRate: "21",
          total: "0",
        }
      ],
    },
  });

  const { register, handleSubmit, setValue, watch, control, formState: { errors }, clearErrors } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");

  // Search customers
  const searchCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      setCustomers([]);
      setShowCustomerResults(false);
      return;
    }

    try {
      const results = await customerAPI.search(query);
      setCustomers(results);
      setShowCustomerResults(results.length > 0);
    } catch (error) {
      console.error("Customer search error:", error);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    // If customer doesn't have ID (from ARES), set a temporary value
    setValue("customerId", customer.id || -1);
    clearErrors("customerId"); // Clear validation error
    setShowCustomerResults(false);
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let vatAmount = 0;
    const isReverseCharge = watch("isReverseCharge");

    watchedItems.forEach((item, index) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const vatRate = parseFloat(item.vatRate) || 21;
      
      const itemSubtotal = quantity * unitPrice;
      // If reverse charge, VAT is 0
      const itemVat = isReverseCharge ? 0 : (itemSubtotal * vatRate) / 100;
      const itemTotal = itemSubtotal + itemVat;

      subtotal += itemSubtotal;
      vatAmount += itemVat;

      // Update item total
      setValue(`items.${index}.total`, itemTotal.toFixed(2));
    });

    const total = subtotal + vatAmount;

    setValue("subtotal", subtotal.toFixed(2));
    setValue("vatAmount", vatAmount.toFixed(2));
    setValue("total", total.toFixed(2));
  };

  // Recalculate when items or reverse charge change
  useEffect(() => {
    calculateTotals();
  }, [watchedItems, watch("isReverseCharge")]);

  const addItem = () => {
    append({
      description: "",
      quantity: "1",
      unitPrice: "0",
      vatRate: "21",
      total: "0",
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'Faktura';
      case 'proforma':
        return 'Proforma faktura';
      case 'credit_note':
        return 'Dobropis';
      default:
        return type;
    }
  };

  const handleFormSubmit = (data: InvoiceFormData) => {
    if (!selectedCustomer) {
      toast({
        title: "Chyba",
        description: "Musíte vybrat zákazníka.",
        variant: "destructive",
      });
      return;
    }

    // For ARES customers without ID, create them first
    if (!selectedCustomer.id) {
      // Include customer data in submission
      onSubmit({
        ...data,
        customer: selectedCustomer,
        customerId: -1 // Flag for new customer
      });
    } else {
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <CardTitle>Základní informace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Typ dokumentu</Label>
                  <Select
                    value={watch("type")}
                    onValueChange={(value) => setValue("type", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Faktura</SelectItem>
                      <SelectItem value="proforma">Proforma faktura</SelectItem>
                      <SelectItem value="credit_note">Dobropis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueDate">Datum vystavení</Label>
                  <Input
                    {...register("issueDate")}
                    type="date"
                    className={errors.issueDate ? "border-red-500" : ""}
                  />
                  {errors.issueDate && (
                    <p className="text-sm text-red-600">{errors.issueDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Datum splatnosti</Label>
                  <Input
                    {...register("dueDate")}
                    type="date"
                    className={errors.dueDate ? "border-red-500" : ""}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-red-600">{errors.dueDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Měna</Label>
                  <Select
                    value={watch("currency")}
                    onValueChange={(value) => setValue("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CZK">CZK - Česká koruna</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USD">USD - Americký dolar</SelectItem>
                      <SelectItem value="GBP">GBP - Britská libra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex items-end">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("isReverseCharge")}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Reverse Charge (přenesení daňové povinnosti)</span>
                  </label>
                </div>
              </div>

              {invoice?.invoiceNumber && (
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Číslo faktury</Label>
                  <Input
                    {...register("invoiceNumber")}
                    placeholder="Automaticky generováno"
                    readOnly
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Zákazník</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Vybrat zákazníka *</Label>
                  <div className="relative">
                    <Input
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        searchCustomers(e.target.value);
                      }}
                      placeholder="Začněte psát název nebo IČO zákazníka..."
                      className={errors.customerId ? "border-red-500" : ""}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                  </div>
                  {errors.customerId && (
                    <p className="text-sm text-red-600">{errors.customerId.message}</p>
                  )}

                  {/* Customer Search Results */}
                  {showCustomerResults && customers.length > 0 && (
                    <Card className="mt-2">
                      <CardContent className="p-3">
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {customers.map((customer) => (
                            <div
                              key={customer.id || customer.ico}
                              className="p-3 border rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                              onClick={() => selectCustomer(customer)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-sm">{customer.name}</h4>
                                    {customer.source === 'ares' && (
                                      <Badge variant="secondary" className="text-xs">
                                        ARES
                                      </Badge>
                                    )}
                                  </div>
                                  {customer.ico && (
                                    <p className="text-xs text-neutral-500">IČO: {customer.ico}</p>
                                  )}
                                  {customer.email && (
                                    <p className="text-xs text-neutral-500">{customer.email}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Selected Customer Info */}
                {selectedCustomer && (
                  <Card className="bg-neutral-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{selectedCustomer.name}</h4>
                          <div className="mt-1 space-y-1 text-sm text-neutral-600">
                            {selectedCustomer.ico && <p>IČO: {selectedCustomer.ico}</p>}
                            {selectedCustomer.address && <p>{selectedCustomer.address}</p>}
                            {(selectedCustomer.city || selectedCustomer.postalCode) && (
                              <p>{selectedCustomer.postalCode} {selectedCustomer.city}</p>
                            )}
                            {selectedCustomer.email && <p>{selectedCustomer.email}</p>}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setCustomerSearch("");
                            setValue("customerId", 0);
                          }}
                        >
                          Změnit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Položky faktury</CardTitle>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Přidat položku
              </Button>
            </CardHeader>
            <CardContent>
              {fields.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Popis</TableHead>
                      <TableHead>Množství</TableHead>
                      <TableHead>Jednotková cena</TableHead>
                      <TableHead>DPH %</TableHead>
                      <TableHead>Celkem</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Input
                            {...register(`items.${index}.description`)}
                            placeholder="Popis služby/produktu"
                            className={errors.items?.[index]?.description ? "border-red-500" : ""}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`items.${index}.quantity`)}
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`items.${index}.unitPrice`)}
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={watch(`items.${index}.vatRate`)}
                            onValueChange={(value) => setValue(`items.${index}.vatRate`, value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="12">12%</SelectItem>
                              <SelectItem value="21">21%</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(watch(`items.${index}.total`) || "0")}
                        </TableCell>
                        <TableCell>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <Calculator className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
                  <p>Zatím nemáte přidané žádné položky</p>
                  <Button type="button" variant="outline" onClick={addItem} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Přidat první položku
                  </Button>
                </div>
              )}

              {errors.items && (
                <p className="text-sm text-red-600 mt-2">Alespoň jedna položka je povinná</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Poznámky</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register("notes")}
                placeholder="Volitelné poznámky k faktuře..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Přehled</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Celkem bez DPH:</span>
                  <span>{formatCurrency(watch("subtotal"))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>DPH:</span>
                  <span>{formatCurrency(watch("vatAmount"))}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Celkem k úhradě:</span>
                  <span className="text-primary text-lg">
                    {formatCurrency(watch("total"))}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="status">Stav faktury</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Koncept</SelectItem>
                    <SelectItem value="sent">Odeslána</SelectItem>
                    <SelectItem value="paid">Uhrazena</SelectItem>
                    <SelectItem value="overdue">Po splatnosti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Akce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {invoice ? 'Aktualizovat fakturu' : 'Vytvořit fakturu'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={isLoading}
                className="w-full"
              >
                Zrušit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
