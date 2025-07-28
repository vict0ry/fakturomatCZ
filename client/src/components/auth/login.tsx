import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

import { Receipt, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Uživatelské jméno je povinné"),
  password: z.string().min(1, "Heslo je povinné"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Přihlášení selhalo');
      }

      const result = await response.json();
      
      // Uložení session do localStorage
      localStorage.setItem('sessionId', result.sessionId);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      toast({
        title: "Úspěšně přihlášen",
        description: `Vítejte zpět, ${result.user.firstName}!`,
      });
      
      // Přesměrování na dashboard s force refresh pro správné načtení
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast({
        title: "Chyba při přihlášení",
        description: error.message || "Nepodařilo se přihlásit. Zkuste to znovu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Přihlášení</CardTitle>
          <CardDescription>
            Přihlaste se do svého účtu Fakturoidu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uživatelské jméno</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Zadejte uživatelské jméno"
                        {...field}
                        disabled={isLoading}
                      />
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Přihlašování..." : "Přihlásit se"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-blue-600 hover:underline"
                onClick={() => navigate('/forgot-password')}
              >
                Zapomenuté heslo?
              </Button>
            </p>
            <p className="text-sm text-gray-600">
              Nemáte účet?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => navigate('/register')}
              >
                Začít 7 dní zdarma
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}