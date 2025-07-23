import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Pencil, Save, X, Building2, Mail, Phone, Globe, MapPin, Hash } from "lucide-react";

const updateCompanySchema = z.object({
  name: z.string().min(1, "Název společnosti je povinný"),
  ico: z.string().optional(),
  dic: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Neplatný email").optional().or(z.literal("")),
  website: z.string().url("Neplatná URL").optional().or(z.literal(""))
});

type UpdateCompanyForm = z.infer<typeof updateCompanySchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCompany, setEditingCompany] = useState(false);

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ["/api/companies", user?.companyId],
    queryFn: () => fetch(`/api/companies/${user?.companyId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
    }).then(res => res.json()),
    enabled: !!user?.companyId,
  });

  const companyForm = useForm<UpdateCompanyForm>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      name: company?.name || "",
      ico: company?.ico || "",
      dic: company?.dic || "",
      address: company?.address || "",
      city: company?.city || "",
      postalCode: company?.postalCode || "",
      phone: company?.phone || "",
      email: company?.email || "",
      website: company?.website || ""
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: (data: UpdateCompanyForm) => 
      apiRequest(`/api/companies/${user?.companyId}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Firma aktualizována",
        description: "Údaje společnosti byly úspěšně uloženy."
      });
      setEditingCompany(false);
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat údaje společnosti.",
        variant: "destructive"
      });
    }
  });

  const onCompanySubmit = (data: UpdateCompanyForm) => {
    updateCompanyMutation.mutate(data);
  };

  if (!user) {
    return <div>Načítání...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Building2 className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nastavení</h1>
          <p className="text-gray-600 dark:text-gray-400">Správa systému a firemních údajů</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firemní údaje */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Údaje společnosti
                  </CardTitle>
                  <CardDescription>
                    Základní informace o vaší společnosti
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCompany(!editingCompany)}
                >
                  {editingCompany ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Zrušit
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Upravit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {companyLoading ? (
                <div>Načítání údajů společnosti...</div>
              ) : !editingCompany ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Název společnosti
                    </Label>
                    <p className="text-sm">{company?.name || "Neuvedeno"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      IČO
                    </Label>
                    <p className="text-sm">{company?.ico || "Neuvedeno"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      DIČ
                    </Label>
                    <p className="text-sm">{company?.dic || "Neuvedeno"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Telefon
                    </Label>
                    <p className="text-sm">{company?.phone || "Neuvedeno"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </Label>
                    <p className="text-sm">{company?.email || "Neuvedeno"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Web
                    </Label>
                    <p className="text-sm">{company?.website || "Neuvedeno"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Adresa
                    </Label>
                    <p className="text-sm">
                      {company?.address ? (
                        <>
                          {company.address}
                          {company.city && `, ${company.city}`}
                          {company.postalCode && ` ${company.postalCode}`}
                        </>
                      ) : (
                        "Neuvedeno"
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Název společnosti</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="ico"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IČO</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="dic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DIČ</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefon</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Webové stránky</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresa</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Město</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PSČ</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={updateCompanyMutation.isPending}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Uložit změny
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Systémová nastavení */}
        <Card>
          <CardHeader>
            <CardTitle>Systémová nastavení</CardTitle>
            <CardDescription>
              Konfigurace aplikace a preferencí
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tmavý režim</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatické přepínání podle systémového nastavení
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Konfigurace
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Emailové upozornění</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notifikace o nových fakturách a platbách
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Nastavit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Záloha a export */}
        <Card>
          <CardHeader>
            <CardTitle>Záloha a export</CardTitle>
            <CardDescription>
              Správa dat a exporty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export dat</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Stáhnout všechna data ve formátu CSV
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Exportovat
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automatická záloha</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Denní zálohy do cloudu
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Konfigurace
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}