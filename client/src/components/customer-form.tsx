import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { customerAPI, aresAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Search, Building2, CheckCircle } from "lucide-react";
import type { Customer } from "@/lib/api";

const customerSchema = z.object({
  name: z.string().min(1, "Název je povinný"),
  email: z.string().email("Neplatný email").optional().or(z.literal("")),
  phone: z.string().optional(),
  ico: z.string().optional(),
  dic: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("CZ"),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: Customer | Omit<Customer, 'id'>) => void;
  isLoading?: boolean;
}

export function CustomerForm({ customer, onSubmit, isLoading = false }: CustomerFormProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      ico: customer?.ico || "",
      dic: customer?.dic || "",
      address: customer?.address || "",
      city: customer?.city || "",
      postalCode: customer?.postalCode || "",
      country: customer?.country || "CZ",
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const watchedName = watch("name");
  const watchedIco = watch("ico");

  const searchAres = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await customerAPI.search(query);
      setSearchResults(results);
      setShowResults(results.length > 0);
    } catch (error) {
      console.error("ARES search error:", error);
      toast({
        title: "Chyba při vyhledávání",
        description: "Nepodařilo se vyhledat v databázi ARES.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("name", value);
    
    // Auto-search in ARES when typing company name
    if (value.length >= 3 && !customer) {
      const timeoutId = setTimeout(() => searchAres(value), 300);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleIcoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("ico", value);
    
    // Auto-search in ARES when ICO is entered
    if (value.length === 8 && !customer) {
      searchAres(value);
    }
  };

  const selectAresResult = (result: Customer) => {
    setValue("name", result.name);
    setValue("ico", result.ico || "");
    setValue("dic", result.dic || "");
    setValue("address", result.address || "");
    setValue("city", result.city || "");
    setValue("postalCode", result.postalCode || "");
    setShowResults(false);
    
    toast({
      title: "Údaje předvyplněny",
      description: "Údaje ze systému ARES byly automaticky načteny.",
    });
  };

  const handleFormSubmit = (data: CustomerFormData) => {
    if (customer) {
      onSubmit({ ...customer, ...data });
    } else {
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Company Name with ARES Search */}
      <div className="space-y-2">
        <Label htmlFor="name">Název společnosti / Jméno *</Label>
        <div className="relative">
          <Input
            {...register("name")}
            onChange={handleNameChange}
            placeholder="Zadejte název společnosti..."
            className={errors.name ? "border-red-500" : ""}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
        
        {/* ARES Search Results */}
        {showResults && searchResults.length > 0 && (
          <Card className="mt-2">
            <CardContent className="p-3">
              <div className="text-sm font-medium text-neutral-700 mb-2">
                Nalezeno v registru ARES:
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                    onClick={() => selectAresResult(result)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-sm">{result.name}</h4>
                          {result.source === 'ares' && (
                            <Badge variant="secondary" className="text-xs">
                              ARES
                            </Badge>
                          )}
                        </div>
                        {result.ico && (
                          <p className="text-xs text-neutral-500">IČO: {result.ico}</p>
                        )}
                        {(result.address || result.city) && (
                          <p className="text-xs text-neutral-500">
                            {result.address && `${result.address}, `}
                            {result.city && result.postalCode && `${result.postalCode} ${result.city}`}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => selectAresResult(result)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ico">IČO</Label>
          <Input
            {...register("ico")}
            onChange={handleIcoChange}
            placeholder="12345678"
            maxLength={8}
          />
          {errors.ico && (
            <p className="text-sm text-red-600">{errors.ico.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dic">DIČ</Label>
          <Input
            {...register("dic")}
            placeholder="CZ12345678"
          />
          {errors.dic && (
            <p className="text-sm text-red-600">{errors.dic.message}</p>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            {...register("email")}
            type="email"
            placeholder="info@company.cz"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            {...register("phone")}
            type="tel"
            placeholder="+420 123 456 789"
          />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Adresa</Label>
          <Input
            {...register("address")}
            placeholder="Ulice a číslo popisné"
          />
          {errors.address && (
            <p className="text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Město</Label>
            <Input
              {...register("city")}
              placeholder="Praha"
            />
            {errors.city && (
              <p className="text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="postalCode">PSČ</Label>
            <Input
              {...register("postalCode")}
              placeholder="110 00"
              maxLength={6}
            />
            {errors.postalCode && (
              <p className="text-sm text-red-600">{errors.postalCode.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Zrušit
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-secondary hover:bg-green-700"
        >
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          )}
          {customer ? 'Aktualizovat zákazníka' : 'Vytvořit zákazníka'}
        </Button>
      </div>
    </form>
  );
}
