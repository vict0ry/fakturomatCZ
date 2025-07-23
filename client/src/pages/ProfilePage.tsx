import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Edit3, Save, X, User, Building2, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const updateUserSchema = z.object({
  firstName: z.string().min(1, "Křestní jméno je povinné"),
  lastName: z.string().min(1, "Příjmení je povinné"),
  email: z.string().email("Neplatná e-mailová adresa"),
  username: z.string().min(3, "Uživatelské jméno musí mít alespoň 3 znaky")
});

const updateCompanySchema = z.object({
  name: z.string().min(1, "Název společnosti je povinný"),
  ico: z.string().optional(),
  dic: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional()
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;
type UpdateCompanyForm = z.infer<typeof updateCompanySchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);

  const { data: company } = useQuery({
    queryKey: ["/api/companies", user?.companyId],
    enabled: !!user?.companyId
  });

  const userForm = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      username: user?.username || ""
    }
  });

  const companyForm = useForm<UpdateCompanyForm>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      name: (company as any)?.name || "",
      ico: (company as any)?.ico || "",
      dic: (company as any)?.dic || "",
      address: (company as any)?.address || "",
      city: (company as any)?.city || "",
      postalCode: (company as any)?.postalCode || "",
      phone: (company as any)?.phone || "",
      email: (company as any)?.email || "",
      website: (company as any)?.website || ""
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UpdateUserForm) => {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Nepodařilo se aktualizovat profil");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Profil byl úspěšně aktualizován" });
      setEditingUser(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/validate"] });
    },
    onError: () => {
      toast({
        title: "Chyba při aktualizaci profilu",
        variant: "destructive"
      });
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: UpdateCompanyForm) => {
      const response = await fetch(`/api/companies/${user?.companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Nepodařilo se aktualizovat společnost");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Údaje společnosti byly úspěšně aktualizovány" });
      setEditingCompany(false);
      queryClient.invalidateQueries({ queryKey: ["/api/companies", user?.companyId] });
    },
    onError: () => {
      toast({
        title: "Chyba při aktualizaci společnosti",
        variant: "destructive"
      });
    }
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Načítání profilu...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profil uživatele</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Spravujte své osobní údaje a nastavení společnosti
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <div>
                  <CardTitle>Osobní údaje</CardTitle>
                  <CardDescription>Vaše základní informace</CardDescription>
                </div>
              </div>
              {!editingUser ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Upravit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingUser(false);
                      userForm.reset();
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Zrušit
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!editingUser ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Křestní jméno
                    </Label>
                    <p className="text-sm">{user.firstName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Příjmení
                    </Label>
                    <p className="text-sm">{user.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      E-mail
                    </Label>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Uživatelské jméno
                    </Label>
                    <p className="text-sm">{user.username}</p>
                  </div>
                </div>
              </div>
            ) : (
              <Form {...userForm}>
                <form
                  onSubmit={userForm.handleSubmit((data) => updateUserMutation.mutate(data))}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={userForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Křestní jméno</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Příjmení</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Uživatelské jméno</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateUserMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {updateUserMutation.isPending ? "Ukládání..." : "Uložit"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Company Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <div>
                  <CardTitle>Údaje společnosti</CardTitle>
                  <CardDescription>Informace o vaší společnosti</CardDescription>
                </div>
              </div>
              {!editingCompany ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCompany(true)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Upravit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCompany(false);
                      companyForm.reset();
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Zrušit
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!editingCompany ? (
              <div className="space-y-4">
                {company ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Název společnosti
                      </Label>
                      <p className="text-sm">{(company as any)?.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        IČO
                      </Label>
                      <p className="text-sm">{(company as any)?.ico || "Neuvedeno"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        DIČ
                      </Label>
                      <p className="text-sm">{(company as any)?.dic || "Neuvedeno"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Telefon
                      </Label>
                      <p className="text-sm">{(company as any)?.phone || "Neuvedeno"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Adresa
                      </Label>
                      <p className="text-sm">
                        {(company as any)?.address ? (
                          <>
                            {(company as any).address}
                            {(company as any).city && `, ${(company as any).city}`}
                            {(company as any).postalCode && ` ${(company as any).postalCode}`}
                          </>
                        ) : (
                          "Neuvedeno"
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p>Načítání údajů společnosti...</p>
                )}
              </div>
            ) : (
              <Form {...companyForm}>
                <form
                  onSubmit={companyForm.handleSubmit((data) => updateCompanyMutation.mutate(data))}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
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
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail společnosti</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
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
                            <Input {...field} placeholder="https://www.example.cz" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateCompanyMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {updateCompanyMutation.isPending ? "Ukládání..." : "Uložit"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}