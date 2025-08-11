import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { customerAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, Calculator, Repeat } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Customer, Invoice, InvoiceItem } from "@/lib/api";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Popis je povinný"),
  quantity: z.string().min(1, "Množství je povinné"),
  unit: z.string().default("ks"),
  unitPrice: z.string().min(1, "Jednotková cena je povinná"),
  vatRate: z.string().default("21"),

  total: z.string().default("0"),
});

const invoiceSchema = z.object({
  customerId: z.number().optional(), // Není povinné - vytvoří se při uložení
  customerName: z.string().min(1, "Vyberte zákazníka"), // Povinný název zákazníka
  type: z.enum(["invoice", "proforma", "credit_note"]).default("invoice"),
  invoiceNumber: z.string().optional(),
  issueDate: z.string().min(1, "Datum vystavení je povinné"),
  dueDate: z.string().min(1, "Datum splatnosti je povinné"),
  subtotal: z.string().default("0"),
  vatAmount: z.string().default("0"),
  total: z.string().default("0"),
  currency: z.string().default("CZK"),
  // Recurring invoice fields
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.enum(["monthly", "quarterly", "yearly"]).optional(),
  recurringInterval: z.number().min(1).max(12).optional(),
  recurringTemplateName: z.string().optional(),
  // Payment details
  paymentMethod: z
    .enum(["bank_transfer", "card", "cash", "online", "cheque"])
    .default("bank_transfer"),
  bankAccount: z.string().optional(),
  variableSymbol: z.string().optional(),
  constantSymbol: z.string().optional(),
  specificSymbol: z.string().optional(),
  paymentReference: z.string().optional(),
  // Delivery details
  deliveryMethod: z
    .enum(["email", "post", "pickup", "courier"])
    .default("email"),
  deliveryAddress: z.string().optional(),
  orderNumber: z.string().optional(),
  warranty: z.string().optional(),
  // Standard fields
  isReverseCharge: z.boolean().default(false),
  status: z.enum(["draft", "sent", "paid", "overdue"]).default("draft"),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Alespoň jedna položka je povinná"),
  // Customer data for creating new customer if needed
  customerData: z.object({
    name: z.string(),
    ico: z.string().optional(),
    dic: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().default("CZ"),
  }).optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (data: InvoiceFormData) => void;
  isLoading?: boolean;
}

export function InvoiceForm({
  invoice,
  onSubmit,
  isLoading = false,
}: InvoiceFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    ico: "",
    dic: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "CZ",
  });
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14); // 14 days from today
  const dueDateString = defaultDueDate.toISOString().split("T")[0];

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: invoice?.customerId || undefined,
      customerName: invoice?.customer?.name || "",
      type: invoice?.type || "invoice",
      invoiceNumber: invoice?.invoiceNumber || "",
      issueDate: invoice?.issueDate
        ? new Date(invoice.issueDate).toISOString().split("T")[0]
        : today,
      dueDate: invoice?.dueDate
        ? new Date(invoice.dueDate).toISOString().split("T")[0]
        : dueDateString,
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
      // Recurring invoice fields
      isRecurring: (invoice as any)?.isRecurring || false,
      recurringFrequency: (invoice as any)?.recurringFrequency || "monthly",
      recurringInterval: (invoice as any)?.recurringInterval || 1,
      recurringTemplateName: (invoice as any)?.recurringTemplateName || "",
      items: invoice?.items?.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: (item as any).unit || "ks",
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discountType: (item as any).discountType || "none",
        discountValue: (item as any).discountValue || "0",
        total: item.total,
      })) || [
        {
          description: "",
          quantity: "1",
          unit: "ks",
          unitPrice: "0",
          vatRate: "21",
          discountType: "none",
          discountValue: "0",
          total: "0",
        },
      ],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    clearErrors,
  } = form;
  const {
    fields: watchedItems,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "items",
  });

  // Initialize customer data for editing
  useEffect(() => {
    if (invoice && invoice.customer) {
      setSelectedCustomer(invoice.customer);
      setCustomerSearch(invoice.customer.name || "");
      setValue("customerId", invoice.customer.id);
    }
  }, [invoice, setValue]);

  // Auto-preload most recent customer for new invoices
  useEffect(() => {
    const loadRecentCustomer = async () => {
      // Only auto-load for new invoices (no existing invoice data)
      if (!invoice) {
        try {
          const recentCustomers = await customerAPI.getRecent(1);
          if (recentCustomers && recentCustomers.length > 0) {
            const mostRecentCustomer = recentCustomers[0];
            console.log('Auto-preloading recent customer:', mostRecentCustomer);
            selectCustomer(mostRecentCustomer);
          }
        } catch (error) {
          console.log('No recent customer to preload:', error);
        }
      }
    };

    loadRecentCustomer();
  }, [invoice]); // Only run when invoice prop changes

  // Search customers (both database and ARES)
  const searchCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      setCustomers([]);
      setShowCustomerResults(false);
      return;
    }

    try {
      const results = await customerAPI.search(query);
      setCustomers(results);
      setShowCustomerResults(true); // Always show results container, even if empty
    } catch (error) {
      console.error("Customer search error:", error);
      toast({
        title: "Chyba při vyhledávání",
        description: "Nepodařilo se vyhledat zákazníky",
        variant: "destructive",
      });
    }
  };

  const selectCustomer = (customer: Customer) => {
    console.log('Selecting customer:', customer);
    
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    
    // Set customerName for validation and customerId if exists
    setValue("customerName", customer.name);
    if (customer.id && customer.id > 0) {
      setValue("customerId", customer.id);
    }
    
    // Set customer data for creating new customer later if needed
    setValue("customerData", {
      name: customer.name,
      ico: customer.ico || "",
      dic: customer.dic || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      postalCode: customer.postalCode || "",
      country: customer.country || "CZ"
    });
    
    clearErrors("customerName");
    setShowCustomerResults(false);
  };

  const createNewCustomer = () => {
    // Create customer from current search or manual entry
    const customerName = customerSearch || newCustomerData.name;

    if (!customerName.trim()) {
      toast({
        title: "Chyba",
        description: "Zadejte název zákazníka",
        variant: "destructive",
      });
      return;
    }

    const customerData = {
      name: customerName,
      ico: newCustomerData.ico,
      dic: newCustomerData.dic,
      email: newCustomerData.email,
      phone: newCustomerData.phone,
      address: newCustomerData.address,
      city: newCustomerData.city,
      postalCode: newCustomerData.postalCode,
      country: newCustomerData.country,
    };

    // Just set the data, don't create customer yet
    const tempCustomer = {
      id: 0, // No ID yet - will be created when invoice is saved
      ...customerData,
      isActive: true,
      companyId: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSelectedCustomer(tempCustomer);
    setValue("customerName", customerName);
    setValue("customerData", customerData);
    clearErrors("customerName");
    setShowCustomerResults(false);
    setShowNewCustomerForm(false);

    // Reset form
    setNewCustomerData({
      name: "",
      ico: "",
      dic: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "CZ",
    });

    toast({
      title: "Zákazník připraven",
      description: "Zákazník bude vytvořen při uložení faktury",
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    const currentItems = watch("items");
    if (!currentItems || currentItems.length === 0) {
      setValue("subtotal", "0.00");
      setValue("vatAmount", "0.00");
      setValue("total", "0.00");
      return;
    }

    let subtotal = 0;
    let vatAmount = 0;

    currentItems.forEach((item, index) => {
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

  // Watch all relevant values for calculation
  const watchedItemsArray = watch("items");
  const isReverseCharge = watch("isReverseCharge");

  // Recalculate when items or reverse charge change
  useEffect(() => {
    calculateTotals();
  }, [watchedItemsArray, isReverseCharge]);


  const addItem = () => {
    append({
      description: "",
      quantity: "1",
      unit: "ks",
      unitPrice: "0",
      vatRate: "21",

      total: "0",
    });
  };

  const updateItem = (
    index: number,
    field: keyof typeof invoiceItemSchema.shape,
    value: any,
  ) => {
    setValue(`items.${index}.${field}` as any, value);
  };

  const removeItem = (index: number) => {
    remove(index);
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "invoice":
        return "Faktura";
      case "proforma":
        return "Proforma faktura";
      case "credit_note":
        return "Dobropis";
      default:
        return type;
    }
  };

  const handleFormSubmit = (data: InvoiceFormData) => {
    // Debug logging for form submission
    console.log("=== FORM SUBMIT DEBUG ===");
    console.log("Form data:", JSON.stringify(data, null, 2));
    console.log("Items count:", data.items?.length || 0);
    console.log(
      "Items details:",
      data.items?.map((item, index) => ({
        index,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    );

    // Check if we have a customerId from form data OR selectedCustomer
    const hasCustomer =
      (data.customerId && data.customerId > 0) || selectedCustomer;

    // For edit mode, don't require customer selection if we already have customerId
    if (!hasCustomer && (!invoice || !invoice.customerId)) {
      toast({
        title: "Chyba",
        description: "Musíte vybrat zákazníka.",
        variant: "destructive",
      });
      return;
    }

    // If editing existing invoice and no new customer selected, use existing data
    if (invoice && invoice.customerId && !selectedCustomer) {
      console.log(
        "Submitting data for existing invoice with items:",
        data.items?.length,
      );
      onSubmit(data);
      return;
    }

    // For new customers from ARES without ID, create them first
    if (selectedCustomer && selectedCustomer.id === 0) {
      // Creating new customer - send customer data for creation
      const dataWithCustomer = {
        ...data,
        customerData: {
          name: selectedCustomer.name,
          ico: selectedCustomer.ico || "",
          dic: selectedCustomer.dic || "",
          email: selectedCustomer.email || "",
          phone: selectedCustomer.phone || "",
          address: selectedCustomer.address || "",
          city: selectedCustomer.city || "",
          postalCode: selectedCustomer.postalCode || "",
          country: selectedCustomer.country || "CZ"
        }
      };
      onSubmit(dataWithCustomer);
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
                {invoice ? "Upravit fakturu" : "Nová faktura"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {invoice
                  ? "Upravte údaje existující faktury"
                  : "Vytvořte novou fakturu pro vašeho zákazníka"}
              </p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Krok 1 ze 3
              </span>
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
            {invoice ? "✏️ Aktualizovat fakturu" : "✨ Vytvořit fakturu"}
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
                    <Label
                      htmlFor="type"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
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
                        <SelectItem value="proforma">
                          📋 Proforma faktura
                        </SelectItem>
                        <SelectItem value="credit_note">↩️ Dobropis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="issueDate"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
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
                    <Label
                      htmlFor="dueDate"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
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
                    <Label
                      htmlFor="currency"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
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
                        <SelectItem value="CZK">
                          🇨🇿 CZK - Česká koruna
                        </SelectItem>
                        <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                        <SelectItem value="USD">
                          🇺🇸 USD - Americký dolar
                        </SelectItem>
                        <SelectItem value="GBP">
                          🇬🇧 GBP - Britská libra
                        </SelectItem>
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
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Reverse Charge
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Přenesení daňové povinnosti
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Recurring Invoice Section */}
                <Separator className="my-6" />

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register("isRecurring")}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex items-center space-x-2">
                      <Repeat className="w-5 h-5 text-blue-600" />
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Nastavit jako opakovanou fakturu
                      </Label>
                    </div>
                  </div>

                  {watch("isRecurring") && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Název šablony
                          </Label>
                          <Input
                            {...register("recurringTemplateName")}
                            placeholder="např. Měsíční hosting"
                            className="border-blue-300 focus:border-blue-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Frekvence
                          </Label>
                          <Select
                            value={watch("recurringFrequency")}
                            onValueChange={(value) =>
                              setValue("recurringFrequency", value as any)
                            }
                          >
                            <SelectTrigger className="border-blue-300 focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">
                                📅 Měsíčně
                              </SelectItem>
                              <SelectItem value="quarterly">
                                📅 Čtvrtletně
                              </SelectItem>
                              <SelectItem value="yearly">📅 Ročně</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Interval (každých X{" "}
                            {watch("recurringFrequency") === "monthly"
                              ? "měsíců"
                              : watch("recurringFrequency") === "quarterly"
                                ? "čtvrtletí"
                                : "let"}
                            )
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max="12"
                            {...register("recurringInterval", {
                              valueAsNumber: true,
                            })}
                            className="border-blue-300 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
                        <Repeat className="w-4 h-4" />
                        <span>
                          Tato faktura se bude automaticky generovat každé{" "}
                          {watch("recurringInterval") || 1}{" "}
                          {watch("recurringFrequency") === "monthly"
                            ? "měsíc"
                            : watch("recurringFrequency") === "quarterly"
                              ? "čtvrtletí"
                              : "rok"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {invoice?.invoiceNumber && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-l-4 border-blue-500">
                    <Label
                      htmlFor="invoiceNumber"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
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
                    <Label
                      htmlFor="customer"
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {selectedCustomer
                        ? "Změnit zákazníka"
                        : "Vyhledat zákazníka *"}
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
                          errors.customerName
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-200 dark:border-gray-600 hover:border-green-300 focus:border-green-500"
                        }`}
                      />
                      <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    {errors.customerName && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>{errors.customerName.message}</span>
                      </p>
                    )}

                    {/* Selected Customer Display */}
                    {selectedCustomer && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-green-600 dark:text-green-400">
                                ✅
                              </span>
                              <h4 className="font-semibold text-green-800 dark:text-green-200">
                                Vybraný zákazník: {selectedCustomer.name}
                              </h4>
                            </div>
                            {selectedCustomer.ico && (
                              <p className="text-sm text-green-700 dark:text-green-300">
                                🏢 IČO: {selectedCustomer.ico}
                              </p>
                            )}
                            {selectedCustomer.address && (
                              <p className="text-sm text-green-700 dark:text-green-300">
                                📍 {selectedCustomer.address}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(null);
                              setCustomerSearch("");
                              setValue("customerName", "");
                              setValue("customerId", undefined);
                            }}
                            className="text-green-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            🗑️ Změnit
                          </Button>
                        </div>
                      </div>
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
                                      {customer.source === "ares" && (
                                        <Badge
                                          variant="secondary"
                                          className="bg-blue-100 text-blue-800"
                                        >
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

                    {/* No Results Found - Show Manual Add Option */}
                    {customerSearch.length >= 3 &&
                      showCustomerResults &&
                      customers.length === 0 && (
                        <Card className="mt-4 border-2 border-orange-200 dark:border-orange-700 shadow-xl">
                          <CardContent className="p-4">
                            <div className="text-center space-y-3">
                              <div className="text-orange-600 dark:text-orange-400">
                                <span className="text-2xl">🔍</span>
                                <p className="text-sm font-medium mt-2">
                                  Nenalezen žádný zákazník pro "{customerSearch}
                                  "
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Možná se jedná o zahraniční firmu nebo nového
                                  zákazníka
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setNewCustomerData((prev) => ({
                                    ...prev,
                                    name: customerSearch,
                                  }));
                                  setShowNewCustomerForm(true);
                                }}
                                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Přidat "{customerSearch}" jako nového zákazníka
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                    {/* Always Show Manual Add Option */}
                    {!selectedCustomer && (
                      <div className="mt-4 text-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewCustomerForm(true)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Přidat nového zákazníka ručně
                        </Button>
                      </div>
                    )}

                    {/* New Customer Form */}
                    {showNewCustomerForm && (
                      <Card className="mt-4 border-2 border-blue-200 dark:border-blue-700 shadow-xl">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                              ➕ Přidat nového zákazníka
                            </h3>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowNewCustomerForm(false)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              ❌
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Název společnosti *
                              </Label>
                              <Input
                                value={newCustomerData.name}
                                onChange={(e) =>
                                  setNewCustomerData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                placeholder="Název firmy nebo jméno"
                                className="border-blue-300 focus:border-blue-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Email
                              </Label>
                              <Input
                                type="email"
                                value={newCustomerData.email}
                                onChange={(e) =>
                                  setNewCustomerData((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
                                }
                                placeholder="email@firma.cz"
                                className="border-blue-300 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">IČO</Label>
                              <Input
                                value={newCustomerData.ico}
                                onChange={(e) =>
                                  setNewCustomerData((prev) => ({
                                    ...prev,
                                    ico: e.target.value,
                                  }))
                                }
                                placeholder="12345678"
                                maxLength={8}
                                className="border-blue-300 focus:border-blue-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">DIČ</Label>
                              <Input
                                value={newCustomerData.dic}
                                onChange={(e) =>
                                  setNewCustomerData((prev) => ({
                                    ...prev,
                                    dic: e.target.value,
                                  }))
                                }
                                placeholder="CZ12345678"
                                className="border-blue-300 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Adresa
                            </Label>
                            <Input
                              value={newCustomerData.address}
                              onChange={(e) =>
                                setNewCustomerData((prev) => ({
                                  ...prev,
                                  address: e.target.value,
                                }))
                              }
                              placeholder="Ulice a číslo popisné"
                              className="border-blue-300 focus:border-blue-500"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Město
                              </Label>
                              <Input
                                value={newCustomerData.city}
                                onChange={(e) =>
                                  setNewCustomerData((prev) => ({
                                    ...prev,
                                    city: e.target.value,
                                  }))
                                }
                                placeholder="Praha"
                                className="border-blue-300 focus:border-blue-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">PSČ</Label>
                              <Input
                                value={newCustomerData.postalCode}
                                onChange={(e) =>
                                  setNewCustomerData((prev) => ({
                                    ...prev,
                                    postalCode: e.target.value,
                                  }))
                                }
                                placeholder="11000"
                                className="border-blue-300 focus:border-blue-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Telefon
                              </Label>
                              <Input
                                value={newCustomerData.phone}
                                onChange={(e) =>
                                  setNewCustomerData((prev) => ({
                                    ...prev,
                                    phone: e.target.value,
                                  }))
                                }
                                placeholder="+420 123 456 789"
                                className="border-blue-300 focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div className="flex space-x-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowNewCustomerForm(false)}
                              className="flex-1"
                            >
                              Zrušit
                            </Button>
                            <Button
                              type="button"
                              onClick={createNewCustomer}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Přidat zákazníka
                            </Button>
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
                                  {selectedCustomer.source === "ares" && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-blue-100 text-blue-800"
                                    >
                                      ARES
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {selectedCustomer.ico && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                      <span className="font-medium">
                                        🏢 IČO:
                                      </span>
                                      <span>{selectedCustomer.ico}</span>
                                    </p>
                                  )}
                                  {selectedCustomer.dic && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                      <span className="font-medium">
                                        💼 DIČ:
                                      </span>
                                      <span>{selectedCustomer.dic}</span>
                                    </p>
                                  )}
                                  {selectedCustomer.address && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                      <span className="font-medium">
                                        📍 Adresa:
                                      </span>
                                      <span>{selectedCustomer.address}</span>
                                    </p>
                                  )}
                                  {selectedCustomer.city &&
                                    selectedCustomer.postalCode && (
                                      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                                        <span className="font-medium">
                                          🏙️ Město:
                                        </span>
                                        <span>
                                          {selectedCustomer.postalCode}{" "}
                                          {selectedCustomer.city}
                                        </span>
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
                                  setValue("customerName", "");
                                  setValue("customerId", undefined);
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
                  {watchedItems.map((item, index) => (
                    <div
                      key={`item-${index}`}
                      className="p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-11 gap-3 md:gap-4 items-end">
                        <div className="sm:col-span-2 lg:col-span-4">
                          <Label className="text-sm font-semibold">
                            Popis služby/produktu
                          </Label>
                          <Input
                            {...register(`items.${index}.description`)}
                            placeholder="Název položky..."
                            className="mt-1 h-11 border-2 border-gray-200 dark:border-gray-600"
                          />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-2">
                          <Label className="text-sm font-semibold">
                            Množství
                          </Label>
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
                          <Label className="text-sm font-semibold">
                            Jednotka
                          </Label>
                          <Input
                            {...register(`items.${index}.unit`)}
                            defaultValue="ks"
                            placeholder="ks, kg, hod, m..."
                            className="mt-1 h-11 border-2 border-gray-200 dark:border-gray-600"
                          />
                        </div>
                        <div className="sm:col-span-1 lg:col-span-1">
                          <Label className="text-sm font-semibold">
                            Cena za jednotku
                          </Label>
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
                            value={
                              watchedItems[index]?.vatRate?.toString() || "21"
                            }
                            onValueChange={(value) =>
                              setValue(`items.${index}.vatRate`, value)
                            }
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
                        {(() => {
                          const quantity =
                            parseFloat(watchedItems[index]?.quantity) || 0;
                          const unitPrice =
                            parseFloat(watchedItems[index]?.unitPrice) || 0;
                          const vatRate =
                            parseFloat(watchedItems[index]?.vatRate) || 21;
                          const isReverseCharge = watch("isReverseCharge");

                          const baseAmount = quantity * unitPrice;
                          // Reverse charge = no VAT calculation
                          const vatAmount = isReverseCharge
                            ? 0
                            : (baseAmount * vatRate) / 100;
                          const totalWithVat = baseAmount + vatAmount;

                          return (
                            <>
                              <div className="flex justify-between text-sm">
                                <span>
                                  Základ ({quantity} × {unitPrice}{" "}
                                  {watchedItems[index]?.unit || "ks"}):
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(baseAmount)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>
                                  DPH ({vatRate}%)
                                  {isReverseCharge
                                    ? " - přenesená daňová povinnost"
                                    : ""}
                                  :
                                </span>
                                <span
                                  className={`font-medium ${isReverseCharge ? "text-orange-600" : ""}`}
                                >
                                  {isReverseCharge
                                    ? "0,00 Kč"
                                    : formatCurrency(vatAmount)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                                <span>Celkem s DPH:</span>
                                <span className="text-blue-600">
                                  {formatCurrency(totalWithVat)}
                                </span>
                              </div>
                            </>
                          );
                        })()}
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
