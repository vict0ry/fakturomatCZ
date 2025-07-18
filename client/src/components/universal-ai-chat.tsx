import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Send, Bot, User, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  action?: {
    type: 'navigate' | 'fill_form' | 'search' | 'create_invoice';
    data?: any;
  };
}

interface UniversalAIChatProps {
  onFormFill?: (data: any) => void;
  context?: 'registration' | 'login' | 'dashboard' | 'invoices' | 'customers' | 'general';
}

export function UniversalAIChat({ onFormFill, context = 'general' }: UniversalAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();

  // Initialize chat based on context
  useEffect(() => {
    let welcomeMessage = '';
    
    switch (context) {
      case 'registration':
        welcomeMessage = 'Pomohu vám s registrací! Stačí mi říct email a IČO vaší firmy a automaticky vyplním registrační formulář pomocí dat z ARES.';
        break;
      case 'login':
        welcomeMessage = 'Pomohu vám s přihlášením nebo vás nasměruji na registraci, pokud ještě nemáte účet.';
        break;
      case 'dashboard':
        welcomeMessage = 'Vítejte! Můžete mi říct například: "Zobraz faktury od CreativeLand", "Vytvoř novou fakturu pro XYZ s.r.o." nebo "Najdi neplacené faktury".';
        break;
      case 'invoices':
        welcomeMessage = 'Pomohu vám s fakturami. Můžete říct: "Najdi faktury od března", "Vytvoř fakturu pro XYZ za 10000 Kč" nebo "Zobraz neplacené faktury".';
        break;
      case 'customers':
        welcomeMessage = 'Pomohu vám se zákazníky. Zkuste: "Najdi zákazníka s IČO 12345678", "Pridej nového zákazníka XYZ" nebo "Zobraz neaktivní zákazníky".';
        break;
      default:
        welcomeMessage = 'Jsem zde, abych vám pomohl s fakturací. Můžete mi říct například: "Vytvoř fakturu pro CreativeLand s.r.o. za konzultace za 5000 Kč"';
    }

    setMessages([{
      id: '1',
      type: 'ai',
      content: welcomeMessage,
      timestamp: new Date(),
    }]);
  }, [context]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: 'Zpracovávám váš požadavek...',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      const response = await processAIMessage(inputValue, context);
      
      setMessages(prev => prev.map(msg => 
        msg.isLoading ? {
          ...msg,
          content: response.content,
          isLoading: false,
          action: response.action
        } : msg
      ));

      // Execute action if provided
      if (response.action) {
        executeAction(response.action);
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.isLoading ? {
          ...msg,
          content: 'Omlouváme se, došlo k chybě při zpracování vašeho požadavku.',
          isLoading: false
        } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const processAIMessage = async (message: string, context: string) => {
    const requestData = {
      message,
      context,
      currentPath: location,
      isAuthenticated,
    };

    if (isAuthenticated) {
      const sessionId = localStorage.getItem('sessionId');
      const response = await fetch('/api/chat/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      return await response.json();
    } else {
      // For non-authenticated users (registration/login)
      const response = await fetch('/api/chat/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('Failed to process message');
      }

      return await response.json();
    }
  };

  const executeAction = (action: any) => {
    switch (action.type) {
      case 'navigate':
        navigate(action.data.path);
        break;
      case 'fill_form':
        if (onFormFill) {
          onFormFill(action.data);
        }
        break;
      case 'search':
        if (action.data.filters) {
          const params = new URLSearchParams();
          Object.entries(action.data.filters).forEach(([key, value]) => {
            if (value) params.append(key, value as string);
          });
          navigate(`${action.data.path}?${params.toString()}`);
        }
        break;
      case 'create_invoice':
        navigate('/invoices/new', { state: action.data });
        break;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={handleToggle}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
          "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
          isOpen && "scale-110"
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 z-50 w-96 h-96 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span className="font-medium">AI Asistent</span>
                <Sparkles className="h-4 w-4" />
              </div>
              <Button
                onClick={handleToggle}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start space-x-2",
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.type === 'ai' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-xs p-3 rounded-lg text-sm",
                        message.type === 'user'
                          ? 'bg-blue-500 text-white ml-auto'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {message.isLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                    {message.type === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Napište zprávu..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}

// Export specific context versions for convenience
export const RegistrationAIChat = (props: { onFormFill?: (data: any) => void }) => (
  <UniversalAIChat context="registration" {...props} />
);

export const LoginAIChat = () => (
  <UniversalAIChat context="login" />
);

export const DashboardAIChat = () => (
  <UniversalAIChat context="dashboard" />
);

export const InvoicesAIChat = () => (
  <UniversalAIChat context="invoices" />
);

export const CustomersAIChat = () => (
  <UniversalAIChat context="customers" />
);