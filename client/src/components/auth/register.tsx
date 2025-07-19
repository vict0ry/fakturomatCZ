import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft, Receipt, Eye, EyeOff } from "lucide-react";

const registerSchema = z.object({
  // User data
  username: z.string().min(3, "Uživatelské jméno musí mít alespoň 3 znaky"),
  email: z.string().email("Neplatný email"),
  password: z.string().min(6, "Heslo musí mít alespoň 6 znaků"),
  firstName: z.string().min(1, "Jméno je povinné"),
  lastName: z.string().min(1, "Příjmení je povinné"),
  
  // Company data
  companyName: z.string().min(1, "Název firmy je povinný"),
  ico: z.string().min(8, "IČO musí mít alespoň 8 znaků"),
  dic: z.string().optional(),
  companyAddress: z.string().min(1, "Adresa firmy je povinná"),
  companyCity: z.string().min(1, "Město je povinné"),
  companyPostalCode: z.string().min(1, "PSČ je povinné"),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email("Neplatný email firmy"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterProps {
  onBack: () => void;
}

export function Register({ onBack }: RegisterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      companyName: "",
      ico: "",
      dic: "",
      companyAddress: "",
      companyCity: "",
      companyPostalCode: "",
      companyPhone: "",
      companyEmail: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const requestData = {
        user: {
          username: data.username,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        },
        company: {
          name: data.companyName,
          ico: data.ico,
          dic: data.dic || null,
          address: data.companyAddress,
          city: data.companyCity,
          postalCode: data.companyPostalCode,
          phone: data.companyPhone || null,
          email: data.companyEmail,
          country: "CZ",
        },
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registrace selhala');
      }

      const result = await response.json();
      login(result.user, result.sessionId);
      
      toast({
        title: "Úspěšně zaregistrován",
        description: `Vítejte v Fakturoidu, ${result.user.firstName}!`,
      });
    } catch (error: any) {
      toast({
        title: "Chyba při registraci",
        description: error.message || "Nepodařilo se zaregistrovat. Zkuste to znovu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="absolute left-4 top-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zpět
            </Button>
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Receipt className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Registrace</CardTitle>
          <CardDescription>
            Vytvořte si účet a začněte používat Fakturoidu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Osobní údaje</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jméno</FormLabel>
                        <FormControl>
                          <Input placeholder="Jan" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Příjmení</FormLabel>
                        <FormControl>
                          <Input placeholder="Novák" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Uživatelské jméno</FormLabel>
                      <FormControl>
                        <Input placeholder="jan.novak" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jan@firma.cz" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heslo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Zadejte heslo"
                            {...field}
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Údaje o firmě</h3>
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Název firmy</FormLabel>
                      <FormControl>
                        <Input placeholder="Můj podnik s.r.o." {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IČO</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DIČ (volitelné)</FormLabel>
                        <FormControl>
                          <Input placeholder="CZ12345678" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Hlavní 123" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Město</FormLabel>
                        <FormControl>
                          <Input placeholder="Praha" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="companyPostalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PSČ</FormLabel>
                        <FormControl>
                          <Input placeholder="11000" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon (volitelné)</FormLabel>
                        <FormControl>
                          <Input placeholder="+420 123 456 789" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Firemní email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="info@firma.cz" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registrování..." : "Vytvořit účet"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}