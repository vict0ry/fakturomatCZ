import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, Users, Receipt, CreditCard, Calendar, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: 'invoice' | 'customer' | 'expense' | 'recurring';
  title: string;
  subtitle?: string;
  url: string;
  status?: string;
  amount?: string;
  date?: string;
}

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Search API call
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['/api/search', debouncedQuery],
    enabled: debouncedQuery.length >= 2,
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    }
  });

  const handleResultClick = (result: SearchResult) => {
    setQuery("");
    setIsOpen(false);
    setLocation(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery("");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'invoice': return FileText;
      case 'customer': return Users;
      case 'expense': return Receipt;
      case 'recurring': return Calendar;
      default: return FileText;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice': return 'Faktura';
      case 'customer': return 'Zákazník';
      case 'expense': return 'Náklad';
      case 'recurring': return 'Opakovaná';
      default: return type;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Hledat faktury, zákazníky, náklady..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length >= 2);
          }}
          onFocus={() => setIsOpen(query.length >= 2)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 w-full max-w-md"
        />
      </div>

      {isOpen && (query.length >= 2) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                Vyhledávám...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Žádné výsledky pro "{debouncedQuery}"
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {results.map((result: SearchResult) => {
                  const Icon = getIcon(result.type);
                  return (
                    <Button
                      key={result.id}
                      variant="ghost"
                      className="w-full justify-start p-4 h-auto hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5 text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {getTypeLabel(result.type)}
                            </Badge>
                            {result.status && (
                              <Badge className={cn("text-xs", getStatusColor(result.status))}>
                                {result.status === 'paid' ? 'Zaplaceno' : 
                                 result.status === 'pending' ? 'Čeká' :
                                 result.status === 'overdue' ? 'Po splatnosti' :
                                 result.status === 'draft' ? 'Koncept' : result.status}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="font-medium text-gray-900 truncate">
                            {result.title}
                          </div>
                          
                          {result.subtitle && (
                            <div className="text-sm text-gray-500 truncate">
                              {result.subtitle}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-1">
                            {result.amount && (
                              <div className="text-sm font-medium text-gray-900">
                                {result.amount}
                              </div>
                            )}
                            {result.date && (
                              <div className="text-xs text-gray-500">
                                {result.date}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overlay to close search when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}