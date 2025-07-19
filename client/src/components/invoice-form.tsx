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
  // Payment details
  paymentMethod: z.enum(["bank_transfer", "card", "cash", "online", "cheque"]).default("bank_transfer"),
  bankAccount: z.string().optional(),
  variableSymbol: z.string().optional(),
  constantSymbol: z.string().optional(),
  specificSymbol: z.string().optional(),
  paymentReference: z.string().optional(),
  // Delivery details
  deliveryMethod: z.enum(["email", "post", "pickup", "courier"]).default("email"),
  deliveryAddress: z.string().optional(),
  orderNumber: z.string().optional(),
  warranty: z.string().optional(),
  // Standard fields
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
      // Payment details
      paymentMethod: (invoice as any)?.paymentMethod || "bank_transfer",
      bankAccount: (invoice as any)?.bankAccount || "",
      variableSymbol: (invoice as any)?.variableSymbol || "",
      constantSymbol: (invoice as any)?.constantSymbol || "",
      specificSymbol: (invoice as any)?.specificSymbol || "",
      paymentReference: (invoice as any)?.paymentReference || "",
      // Delivery details
      deliveryMethod: (invoice as any)?.deliveryMethod || "email",
      deliveryAddress: (invoice as any)?.deliveryAddress || "",
      orderNumber: (invoice as any)?.orderNumber || "",
      warranty: (invoice as any)?.warranty || "",
      // Standard fields
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
    if (!watchedItems || watchedItems.length === 0) {
      setValue("subtotal", "0.00");
      setValue("vatAmount", "0.00");
      setValue("total", "0.00");
      return;
    }

    let subtotal = 0;
    let vatAmount = 0;
    const isReverseCharge = watch("isReverseCharge");

    watchedItems.forEach((item, index) => {
      if (!item) return;
      
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

  const updateItem = (index: number, field: string, value: any) => {
    setValue(`items.${index}.${field}`, value);
  };

  const removeItem = (index: number) => {
    remove(index);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Header Section with Progress */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-blue-100 dark:border-blue-900/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {invoice ? 'Upravit fakturu' : 'Nová faktura'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {invoice ? 'Upravte údaje existující faktury' : 'Vytvořte novou fakturu pro vašeho zákazníka'}
              </p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Krok 1 ze 3</span>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <div className="flex-1 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>

        {/* Fixed Create Button - Always Visible */}
        <div className="fixed-action-buttons">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
            className="h-12 px-6 bg-white dark:bg-gray-800 border-2 shadow-lg hover:shadow-xl transition-all btn"
          >
            ❌ Zrušit
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 px-8 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all btn"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            )}
            {invoice ? '✏️ Aktualizovat fakturu' : '✨ Vytvořit fakturu'}
          </Button>
        </div>

        <div className="invoice-form-container">
          {/* Main Content */}
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {/* Document Settings */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <span>Nastavení dokumentu</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Typ dokumentu *
                    </Label>
                    <Select
                      value={watch("type")}
                      onValueChange={(value) => setValue("type", value as any)}
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 focus:border-blue-500 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">📄 Faktura</SelectItem>
                        <SelectItem value="proforma">📋 Proforma faktura</SelectItem>
                        <SelectItem value="credit_note">↩️ Dobropis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueDate" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Datum vystavení *
                    </Label>
                    <Input
                      {...register("issueDate")}
                      type="date"
                      className={`h-12 border-2 transition-colors ${
                        errors.issueDate 
                          ? "border-red-500 focus:border-red-500" 
                          : "border-gray-200 dark:border-gray-600 hover:border-blue-300 focus:border-blue-500"
                      }`}
                    />
                    {errors.issueDate && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>{errors.issueDate.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Datum splatnosti *
                    </Label>
                    <Input
                      {...register("dueDate")}
                      type="date"
                      className={`h-12 border-2 transition-colors ${
                        errors.dueDate 
                          ? "border-red-500 focus:border-red-500" 
                          : "border-gray-200 dark:border-gray-600 hover:border-blue-300 focus:border-blue-500"
                      }`}
                    />
                    {errors.dueDate && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>{errors.dueDate.message}</span>
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Měna *
                    </Label>
                    <Select
                      value={watch("currency")}
                      onValueChange={(value) => setValue("currency", value)}
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 focus:border-blue-500 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CZK">🇨🇿 CZK - Česká koruna</SelectItem>
                        <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                        <SelectItem value="USD">🇺🇸 USD - Americký dolar</SelectItem>
                        <SelectItem value="GBP">🇬🇧 GBP - Britská libra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Speciální nastavení
                    </Label>
                    <div className="h-12 flex items-center">
                      <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
                        <input
                          type="checkbox"
                          {...register("isReverseCharge")}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Reverse Charge</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Přenesení daňové povinnosti</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {invoice?.invoiceNumber && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-l-4 border-blue-500">
                    <Label htmlFor="invoiceNumber" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Číslo faktury
                    </Label>
                    <Input
                      {...register("invoiceNumber")}
                      placeholder="Automaticky generováno"
                      readOnly
                      className="mt-2 bg-white dark:bg-gray-800 font-mono"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Selection */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <span>Výběr zákazníka</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="customer" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Vyhledat zákazníka *
                    </Label>
                    <div className="relative">
                      <Input
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          searchCustomers(e.target.value);
                        }}
                        placeholder="🔍 Začněte psát název firmy nebo IČO..."
                        className={`h-12 md:h-14 pl-10 md:pl-12 text-base md:text-lg border-2 transition-colors ${
                          errors.customerId 
                            ? "border-red-500 focus:border-red-500" 
                            : "border-gray-200 dark:border-gray-600 hover:border-green-300 focus:border-green-500"
                        }`}
                      />
                      <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    {errors.customerId && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>{errors.customerId.message}</span>
                      </p>
                    )}

                    {/* Customer Search Results */}
                    {showCustomerResults && customers.length > 0 && (
                      <Card className="mt-4 border-2 border-green-200 dark:border-green-700 shadow-xl">
                        <CardHeader className="pb-3">
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Nalezení zákazníci ({customers.length})
                          </h3>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {customers.map((customer) => (
                              <div
                                key={customer.id || customer.ico}
                                className="p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-950/20 cursor-pointer transition-all duration-200 group"
                                onClick={() => selectCustomer(customer)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-300">
                                        {customer.name}
                                      </h4>
                                      {customer.source === 'ares' && (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                          📋 ARES
                                        </Badge>
                                      )}
                                    </div>
                                    {customer.ico && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        🏢 IČO: {customer.ico}
                                      </p>
                                    )}
                                    {customer.address && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        📍 {customer.address}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    ✅
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Selected Customer Display */}
                    {selectedCustomer && (
                      <Card className="mt-4 border-2 border-green-500 bg-green-50 dark:bg-green-950/20 shadow-lg">
                        <CardHeader className="pb-3">
                          <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center space-x-2">
                            <span>✅</span>
                            <span>Vybraný zákazník</span>
                          </h3>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-3">
                                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    {selectedCustomer.name}
                                  </h4>
                                  {selectedCustomer.source === 'ares' && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                      ARES
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {selectedCustomer.ico && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                      <span className="font-medium">🏢 IČO:</span>
                                      <span>{selectedCustomer.ico}</span>
                                    </p>
                                  )}
                                  {selectedCustomer.dic && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                      <span className="font-medium">💼 DIČ:</span>
                                      <span>{selectedCustomer.dic}</span>
                                    </p>
                                  )}
                                  {selectedCustomer.address && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                      <span className="font-medium">📍 Adresa:</span>
                                      <span>{selectedCustomer.address}</span>
                                    </p>
                                  )}
                                  {selectedCustomer.city && selectedCustomer.postalCode && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                      <span className="font-medium">🏙️ Město:</span>
                                      <span>{selectedCustomer.postalCode} {selectedCustomer.city}</span>
                                    </p>
                                  )}
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
                                className="text-gray-500 hover:text-red-500"
                              >
                                ❌
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <span>Položky faktury</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  {fields.map((item, index) => (
                    <div key={`item-${index}`} className="p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4 items-end">
                        <div className="sm:col-span-2 lg:col-span-4">
                          <Label className="text-sm font-semibold">Popis služby/produktu</Label>
                          <Input
                            {...register(`items.${index}.description`)}
                            placeholder="Název položky..."
                            className="mt-1 h-11 border-2 border-gray-200 dark:border-gray-600"
                          />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-2">
                          <Label className="text-sm font-semibold">Množství</Label>
                          <Input
                            type="number"
                            {...register(`items.${index}.quantity`)}
                            placeholder="1"
                            min="0"
                            step="0.01"
                            className="mt-1 h-11 border-2 border-gray-200 dark:border-gray-600"
                          />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-2">
                          <Label className="text-sm font-semibold">Jednotka</Label>
                          <Input
                            defaultValue="ks"
                            placeholder="ks"
                            className="mt-1 h-11 border-2 border-gray-200 dark:border-gray-600"
                            disabled
                          />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-2">
                          <Label className="text-sm font-semibold">Cena za jednotku</Label>
                          <Input
                            type="number"
                            {...register(`items.${index}.unitPrice`)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="mt-1 h-11 border-2 border-gray-200 dark:border-gray-600"
                          />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                          <Label className="text-sm font-semibold">VAT %</Label>
                          <Select
                            value={watchedItems[index]?.vatRate?.toString() || "21"}
                            onValueChange={(value) => setValue(`items.${index}.vatRate`, value)}
                          >
                            <SelectTrigger className="h-11 border-2 border-gray-200 dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="10">10%</SelectItem>
                              <SelectItem value="15">15%</SelectItem>
                              <SelectItem value="21">21%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="h-11 w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                        <div className="flex justify-between text-sm">
                          <span>Celkem bez DPH:</span>
                          <span className="font-medium">{formatCurrency((parseFloat(watchedItems[index]?.quantity) || 0) * (parseFloat(watchedItems[index]?.unitPrice) || 0))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>DPH ({watchedItems[index]?.vatRate || 21}%):</span>
                          <span className="font-medium">{formatCurrency(((parseFloat(watchedItems[index]?.quantity) || 0) * (parseFloat(watchedItems[index]?.unitPrice) || 0)) * ((parseFloat(watchedItems[index]?.vatRate) || 21) / 100))}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                          <span>Celkem s DPH:</span>
                          <span className="text-blue-600">{formatCurrency(((parseFloat(watchedItems[index]?.quantity) || 0) * (parseFloat(watchedItems[index]?.unitPrice) || 0)) * (1 + ((parseFloat(watchedItems[index]?.vatRate) || 21) / 100)))}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    onClick={addItem}
                    variant="outline"
                    className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Přidat položku
                  </Button>

                  {errors.items && (
                    <p className="text-sm text-red-600 mt-2 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>Alespoň jedna položka je povinná</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">📝</span>
                  </div>
                  <span>Poznámky</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  {...register("notes")}
                  placeholder="Volitelné poznámky k faktuře..."
                  rows={4}
                  className="border-2 border-gray-200 dark:border-gray-600 hover:border-orange-300 focus:border-orange-500 transition-colors"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
