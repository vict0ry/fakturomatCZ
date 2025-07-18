import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { chatAPI } from "@/lib/api";
import { X, Send, Mic, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Dobrý den! Jsem zde, abych vám pomohl s fakturací. Můžete mi říct například: "Vytvoř fakturu pro CreativeLand s.r.o. za konzultace za 5000 Kč"',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // WebSocket connection for real-time chat
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_response') {
        setMessages(prev => prev.map(msg => 
          msg.isLoading ? {
            ...msg,
            content: data.response,
            isLoading: false
          } : msg
        ));
        setIsLoading(false);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsLoading(false);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };

    return () => {
      websocket.close();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

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
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Use WebSocket for real-time response
        ws.send(JSON.stringify({
          type: 'chat',
          message: inputValue
        }));
      } else {
        // Fallback to HTTP API
        const response = await chatAPI.sendMessage(inputValue);
        
        setMessages(prev => prev.map(msg => 
          msg.isLoading ? {
            ...msg,
            content: response.response,
            isLoading: false
          } : msg
        ));
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg => 
        msg.isLoading ? {
          ...msg,
          content: 'Omlouváme se, došlo k chybě při zpracování vašeho požadavku.',
          isLoading: false
        } : msg
      ));
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Focus input when opening chat
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <Button 
        onClick={toggleChat}
        className={cn(
          "rounded-full w-14 h-14 shadow-lg hover:scale-105 transition-all duration-200",
          isOpen ? "bg-red-600 hover:bg-red-700" : "bg-secondary hover:bg-green-700"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Bot className="h-6 w-6" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden",
          "chat-widget-enter"
        )}>
          {/* Chat Header */}
          <div className="bg-secondary text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span className="font-medium">AI Asistent</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleChat}
              className="text-white hover:text-neutral-200 hover:bg-green-600 h-auto p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="h-80 p-4 custom-scrollbar">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start space-x-2",
                    message.type === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.type === 'ai' && (
                    <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "rounded-lg p-3 max-w-xs text-sm",
                      message.type === 'user' 
                        ? "bg-primary text-white" 
                        : "bg-neutral-100 text-neutral-800"
                    )}
                  >
                    {message.isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>

                  {message.type === 'user' && (
                    <div className="w-6 h-6 bg-neutral-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-3 w-3 text-neutral-600" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Chat Input */}
          <div className="border-t border-neutral-200 p-4">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Napište zprávu nebo použijte hlasový příkaz..."
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button
                variant="outline"
                size="sm"
                className="px-3"
                disabled={isLoading}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                size="sm"
                className="bg-secondary hover:bg-green-700"
                disabled={isLoading || !inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
