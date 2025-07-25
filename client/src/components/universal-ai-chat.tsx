import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Bot, 
  User,
  Sparkles,
  FileText,
  Users,
  Calculator
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  command?: {
    action: string;
    data?: any;
  };
}

export function UniversalAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Ahoj! Jsem váš AI asistent pro faktury. Mohu vám pomoci s vytvářením faktur, hledáním zákazníků, analýzou dluhů a mnohem více. Zkuste mi říci například "Vytvoř fakturu pro ABC s.r.o." nebo "Najdi všechny neuhrazené faktury".',
      timestamp: new Date(),
    }
  ]);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await fetch('/api/chat/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
        },
        body: JSON.stringify({ 
          message: messageText,
          context: '',
          currentPath: window.location.pathname,
          chatHistory: messages.slice(-6).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Nepodařilo se odeslat zprávu');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.content || data.response, // Support both new and old format
        timestamp: new Date(),
        command: data.action || data.command, // Support both new and old format
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If there's an action, handle it
      if (data.action) {
        handleCommand(data.action);
      } else if (data.command) {
        handleCommand(data.command);
      }

      // AGGRESSIVE CACHE INVALIDATION - UI must always reflect backend changes
      const actionType = data.action?.type || data.command?.action;
      
      // Always invalidate if there's any invoice-related action
      if (actionType === 'create_invoice' || actionType === 'update_invoice' || 
          actionType === 'add_note_to_invoice' || actionType === 'update_invoice_universal' ||
          actionType === 'add_item_to_invoice' || actionType === 'update_invoice_prices' ||
          data.content?.includes('faktur') || data.content?.includes('byla aktualizována')) {
        
        // Invalidate all invoice-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
        
        // Get current invoice ID if we're on invoice page
        const currentInvoiceId = window.location.pathname.match(/\/invoices\/(\d+)/)?.[1];
        if (currentInvoiceId) {
          queryClient.invalidateQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId)] });
          queryClient.invalidateQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId), "items"] });
          
          // Force refetch after invalidation
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId)] });
            queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
          }, 100);
        }
        
        // Additional force refresh for dashboard and other data
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ['/api/stats'] });
          queryClient.refetchQueries({ queryKey: ['/api/analytics'] });
        }, 150);
        
        // Global refetch as final backup
        setTimeout(() => {
          window.dispatchEvent(new Event('force-ui-refresh'));
        }, 250);
      }
      
      if (actionType === 'create_customer') {
        queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      }
      
      if (actionType === 'mark_paid' || actionType === 'update_status') {
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/analytics'] });
      }
      
      // Handle refresh_current_page action and AI changes
      if (data.action?.type === 'refresh_current_page' || data.action?.type === 'navigate') {
        console.log('🔄 AI triggered refresh_current_page or navigation');
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        const currentInvoiceId = window.location.pathname.match(/\/invoices\/(\d+)/)?.[1];
        if (currentInvoiceId) {
          console.log('🔄 Refreshing invoice:', currentInvoiceId);
          queryClient.invalidateQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId)] });
          queryClient.invalidateQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId), "items"] });
          
          // Aggressive cache invalidation with multiple waves
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId)] });
            queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
          }, 100);
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId)] });
          }, 300);
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId)] });
          }, 600);
        }
      }

      // Always refresh after AI operations that modify data
      if (message.includes('poznámku') || message.includes('note') || message.includes('aktualizuj') || message.includes('změň') || message.includes('add') || message.includes('update')) {
        console.log('🔄 AI modified data - triggering aggressive UI refresh');
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
          const currentInvoiceId = window.location.pathname.match(/\/invoices\/(\d+)/)?.[1];
          if (currentInvoiceId) {
            console.log('🔄 Force refreshing invoice:', currentInvoiceId);
            queryClient.refetchQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId)] });
            queryClient.invalidateQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId)] });
          }
        }, 100);
        setTimeout(() => {
          const currentInvoiceId = window.location.pathname.match(/\/invoices\/(\d+)/)?.[1];
          if (currentInvoiceId) {
            queryClient.refetchQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId)] });
          }
        }, 500);
        setTimeout(() => {
          const currentInvoiceId = window.location.pathname.match(/\/invoices\/(\d+)/)?.[1];
          if (currentInvoiceId) {
            queryClient.refetchQueries({ queryKey: ["/api/invoices", parseInt(currentInvoiceId)] });
          }
        }, 1000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se odeslat zprávu AI asistentovi.",
        variant: "destructive",
      });
    },
  });

  const handleCommand = (command: any) => {
    const actionType = command.type || command.action;
    const actionData = command.data || command;
    
    switch (actionType) {
      case 'navigate':
        if (actionData.path) {
          // Always refresh invoice data when navigating
          if (actionData.path.includes('/invoices/')) {
            const invoiceId = actionData.path.match(/\/invoices\/(\d+)/)?.[1];
            if (invoiceId) {
              queryClient.invalidateQueries({ queryKey: ["/api/invoices", parseInt(invoiceId)] });
              queryClient.invalidateQueries({ queryKey: ["/api/invoices", parseInt(invoiceId), "items"] });
            }
            queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
          }
          window.location.href = actionData.path;
        }
        break;
      case 'navigate_to_invoices':
        window.location.href = '/invoices';
        break;
      case 'navigate_to_customers':
        window.location.href = '/customers';
        break;
      case 'navigate_to_dashboard':
        window.location.href = '/';
        break;
      case 'navigate_to_settings':
        window.location.href = '/settings';
        break;
      case 'create_invoice':
        if (actionData?.customerId) {
          window.location.href = `/invoices/new?customer=${actionData.customerId}`;
        } else {
          window.location.href = '/invoices/new';
        }
        break;
      case 'download_pdf':
        if (actionData?.url) {
          window.open(actionData.url, '_blank');
        }
        break;
      case 'mark_paid':
        if (actionData?.invoiceId) {
          // Update invoice status via API
          fetch(`/api/invoices/${actionData.invoiceId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('sessionId')}`,
            },
            body: JSON.stringify({ status: 'paid' }),
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            toast({
              title: "Úspěch",
              description: "Faktura byla označena jako zaplacená.",
            });
          });
        }
        break;
      case 'export_data':
        if (actionData?.url) {
          window.open(actionData.url, '_blank');
        }
        break;
      case 'send_reminder':
        toast({
          title: "Odesílání připomínek",
          description: "Připomínky jsou odesílány dlužníkům.",
        });
        break;
      default:
        // No specific action needed
        console.log('Unhandled action:', actionType, actionData);
        break;
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(message);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('cs-CZ', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getActionIcon = (action?: string) => {
    switch (action) {
      case 'create_invoice':
      case 'navigate_to_invoices':
        return <FileText className="h-3 w-3" />;
      case 'create_customer':
      case 'navigate_to_customers':
        return <Users className="h-3 w-3" />;
      case 'calculate':
        return <Calculator className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
        size="lg"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Otevřít AI chat</span>
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    } shadow-xl border-2 border-blue-200`}>
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <CardTitle className="text-lg font-semibold">
            AI Asistent
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
            Online
          </Badge>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0 text-white hover:bg-blue-500"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 text-white hover:bg-blue-500"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="flex flex-col h-[calc(600px-80px)] p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {msg.type === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      {msg.type === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="text-sm">{msg.content}</p>
                        {msg.command && (
                          <div className="mt-2 flex items-center space-x-1">
                            {getActionIcon(msg.command.action)}
                            <span className="text-xs opacity-75">
                              Akce: {msg.command.action}
                            </span>
                          </div>
                        )}
                        <p className="text-xs opacity-75 mt-1">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Napište zprávu..."
                className="flex-1"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                size="sm"
                className="px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Zkuste: "Vytvoř fakturu", "Najdi dlužníky", "Zobraz statistiky"
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}