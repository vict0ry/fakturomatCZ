import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { invoiceAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { InvoiceForm } from "@/components/invoice-form";

export default function InvoiceEdit() {
  const [, params] = useRoute("/invoices/:id/edit");
  const [, setLocation] = useLocation();
  const invoiceId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: () => invoiceAPI.getById(invoiceId!),
    enabled: !!invoiceId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => invoiceAPI.update(invoiceId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Faktura aktualizována",
        description: "Faktura byla úspěšně aktualizována.",
      });
      setLocation(`/invoices/${invoiceId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se aktualizovat fakturu.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-48" />
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Faktura nenalezena</h1>
            <Button asChild>
              <a href="/invoices">Zpět na faktury</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button variant="ghost" asChild className="mr-4">
              <a href={`/invoices/${invoiceId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zpět na fakturu
              </a>
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                Upravit fakturu {invoice.invoiceNumber}
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Upravte údaje faktury
              </p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Save className="mr-2 h-5 w-5 inline" />
              Úprava faktury
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceForm
              invoice={invoice}
              onSubmit={(data) => updateMutation.mutate(data)}
              isLoading={updateMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}