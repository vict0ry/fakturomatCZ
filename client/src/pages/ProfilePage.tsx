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
import { Pencil, Save, X, User, Mail, Phone, Lock, Camera, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const updateUserSchema = z.object({
  firstName: z.string().min(1, "Jméno je povinné"),
  lastName: z.string().min(1, "Příjmení je povinné"),
  email: z.string().email("Neplatný email"),
  username: z.string().min(3, "Uživatelské jméno musí mít alespoň 3 znaky"),
  phone: z.string().optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Současné heslo je povinné"),
  newPassword: z.string().min(6, "Nové heslo musí mít alespoň 6 znaků"),
  confirmPassword: z.string().min(1, "Potvrzení hesla je povinné")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Hesla se neshodují",
  path: ["confirmPassword"]
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const profileForm = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      username: user?.username || "",
      phone: user?.phone || ""
    }
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateUserForm) => 
      apiRequest(`/api/users/${user?.id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Profil aktualizován",
        description: "Vaše údaje byly úspěšně uloženy."
      });
      setEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/validate"] });
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat profil.",
        variant: "destructive"
      });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordForm) => 
      apiRequest(`/api/users/${user?.id}/change-password`, {
        method: "PATCH",
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Heslo změněno",
        description: "Vaše heslo bylo úspěšně změněno."
      });
      setChangingPassword(false);
      passwordForm.reset();
    },
    onError: () => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit heslo.",
        variant: "destructive"
      });
    }
  });

  const onProfileSubmit = (data: UpdateUserForm) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: ChangePasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!user) {
    return <div>Načítání...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <User className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Můj profil</h1>
          <p className="text-gray-600 dark:text-gray-400">Správa vašich osobních údajů</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar a základní info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="text-2xl bg-orange-100 text-orange-600">
                    {getInitials(user.firstName || "", user.lastName || "")}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{user.firstName} {user.lastName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="h-4 w-4" />
                  <span>@{user.username}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Shield className="h-4 w-4" />
                  <span>{user.role === 'admin' ? 'Administrátor' : 'Uživatel'}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hlavní obsah */}
        <div className="lg:col-span-2 space-y-6">
          {/* Osobní údaje */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Osobní údaje
                  </CardTitle>
                  <CardDescription>
                    Základní informace o vašem účtu
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProfile(!editingProfile)}
                >
                  {editingProfile ? (
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
              {!editingProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Jméno
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
                      Email
                    </Label>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Uživatelské jméno
                    </Label>
                    <p className="text-sm">@{user.username}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Telefon
                    </Label>
                    <p className="text-sm">{user.phone || "Neuvedeno"}</p>
                  </div>
                </div>
              ) : (
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jméno</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
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
                        control={profileForm.control}
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
                        control={profileForm.control}
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
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Telefon</FormLabel>
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
                        disabled={updateProfileMutation.isPending}
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

          {/* Změna hesla */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Bezpečnost
                  </CardTitle>
                  <CardDescription>
                    Změna hesla a bezpečnostní nastavení
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChangingPassword(!changingPassword)}
                >
                  {changingPassword ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Zrušit
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Změnit heslo
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!changingPassword ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Heslo je nastaveno</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Poslední změna hesla před více než 30 dny
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Současné heslo</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nové heslo</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Potvrzení nového hesla</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Změnit heslo
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}