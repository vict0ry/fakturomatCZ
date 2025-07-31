import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CustomerForm } from "@/components/customer-form";
import { EnhancedCustomerForm } from "@/components/enhanced-customer-form";
import { Plus, Search, Edit, Eye, Building2, Mail, Phone, Globe } from "lucide-react";
import type { Customer } from "@/lib/api";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: () => customerAPI.getAll(),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (customer: Omit<Customer, 'id'>) => customerAPI.create(customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Zákazník vytvořen",
        description: "Nový zákazník byl úspěšně přidán do databáze.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba při vytváření zákazníka",
        description: error.message || "Nepodařilo se vytvořit zákazníka.",
        variant: "destructive",
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, ...customer }: Customer) => customerAPI.update(id, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setEditingCustomer(null);
      toast({
        title: "Zákazník aktualizován",
        description: "Údaje zákazníka byly úspěšně uloženy.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba při aktualizaci zákazníka",
        description: error.message || "Nepodařilo se aktualizovat zákazníka.",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers?.filter(customer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.ico?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  });

  const handleCreateCustomer = (customerData: Omit<Customer, 'id'>) => {
    createCustomerMutation.mutate(customerData);
  };

  const handleUpdateCustomer = (customerData: any) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, ...customerData });
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:truncate">
              Zákazníci
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Správa všech vašich zákazníků a jejich kontaktních údajů
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nový zákazník
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Přidat nového zákazníka</DialogTitle>
                </DialogHeader>
                <CustomerForm
                  onSubmit={handleCreateCustomer}
                  isLoading={createCustomerMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
              <Input
                placeholder="Hledat podle názvu, IČO nebo emailu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {filteredCustomers ? `${filteredCustomers.length} zákazníků` : 'Zákazníci'}
              </h3>
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSearchQuery("")}
                >
                  Zrušit vyhledávání
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : filteredCustomers && filteredCustomers.length > 0 ? (
              <div className="space-y-4">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-lg font-medium text-neutral-900 truncate">
                          {customer.name}
                        </h4>
                        {customer.source === 'ares' && (
                          <Badge variant="secondary" className="text-xs">
                            ARES
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                        {customer.ico && (
                          <span className="flex items-center">
                            <i className="fas fa-hashtag mr-1 text-xs"></i>
                            IČO: {customer.ico}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center">
                            <Mail className="mr-1 h-3 w-3" />
                            {customer.email}
                          </span>
                        )}
                        {customer.phone && (
                          <span className="flex items-center">
                            <Phone className="mr-1 h-3 w-3" />
                            {customer.phone}
                          </span>
                        )}
                      </div>
                      
                      {(customer.address || customer.city) && (
                        <div className="mt-1 text-sm text-neutral-500">
                          {customer.address && `${customer.address}, `}
                          {customer.city && customer.postalCode && `${customer.postalCode} ${customer.city}`}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Dialog 
                        open={editingCustomer?.id === customer.id} 
                        onOpenChange={(open) => !open && setEditingCustomer(null)}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingCustomer(customer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Upravit zákazníka</DialogTitle>
                          </DialogHeader>
                          {editingCustomer && (
                            <EnhancedCustomerForm
                              initialData={editingCustomer}
                              onSubmit={handleUpdateCustomer}
                              onCancel={() => setEditingCustomer(null)}
                              isLoading={updateCustomerMutation.isPending}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/invoices?customer=${customer.id}`}>
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-500">
                <Building2 className="mx-auto h-16 w-16 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Žádní zákazníci</h3>
                <p className="mb-6">
                  {searchQuery 
                    ? "Podle zadaných kritérií nebyli nalezeni žádní zákazníci."
                    : "Zatím nemáte přidané žádné zákazníky."
                  }
                </p>
                {!searchQuery && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Přidat prvního zákazníka
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Přidat nového zákazníka</DialogTitle>
                      </DialogHeader>
                      <CustomerForm
                        onSubmit={handleCreateCustomer}
                        isLoading={createCustomerMutation.isPending}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
