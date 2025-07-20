import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, ChevronUp, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthApi } from '@/hooks/use-auth-api';
import { useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIResponse {
  content: string;
  action?: {
    type: string;
    data: any;
  };
}

export function BottomAIChat() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { apiRequest } = useAuthApi();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('ai-chat-history');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsed);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai-chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  // Disable WebSocket for now to fix connection issues
  // TODO: Re-implement WebSocket connection later
  useEffect(() => {
    // WebSocket connection logic disabled temporarily
  }, []);

  const addMessage = (type: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      const currentPath = window.location.pathname;
      const response = await apiRequest('/api/chat/universal', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          context: JSON.stringify(messages.slice(-5)), // Posledních 5 zpráv jako kontext
          currentPath
        })
      });

      addMessage('assistant', response.content);

      // Handle AI actions without page reload
      if (response.action) {
        switch (response.action.type) {
          case 'navigate':
            setLocation(response.action.data.path);
            break;
          case 'refresh_current_page':
            // Agresivní refresh - invaliduj všechny invoice dotazy
            console.log('AI akce vyžaduje refresh dat');
            queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
            queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            
            // Specifický refresh pro editovanou fakturu
            const invoiceMatch = currentPath.match(/\/invoices\/(\d+)/);
            if (invoiceMatch) {
              const invoiceId = parseInt(invoiceMatch[1]);
              console.log('Refreshing invoice data:', invoiceId);
              queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId] });
              queryClient.invalidateQueries({ queryKey: ["/api/invoices", invoiceId, "items"] });
              
              // Několik vln refreshe pro jistotu
              setTimeout(() => {
                queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
                queryClient.refetchQueries({ queryKey: ["/api/invoices", invoiceId] });
              }, 50);
              setTimeout(() => {
                queryClient.refetchQueries({ queryKey: ["/api/invoices", invoiceId, "items"] });
              }, 150);
            }
            
            // Globální refresh jako záloha
            setTimeout(() => {
              queryClient.refetchQueries();
            }, 300);
            break;
          case 'refresh_data':
            queryClient.invalidateQueries();
            break;
          case 'create_invoice_direct':
            // Navigation handled by action response
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('assistant', 'Omlouváme se, došlo k chybě. Zkuste to prosím znovu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('ai-chat-history');
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 400 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-2xl"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Asistent</h3>
                {messages.length > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {messages.length} zpráv
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Vymazat
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleExpanded}
                  className="p-2"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="h-64 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm font-medium mb-2">Co pro vás mohu udělat?</p>
                  <div className="text-xs space-y-1 opacity-75">
                    <p>💼 "vytvoř fakturu pro ABC za 15000 Kč"</p>
                    <p>🔍 "najdi neplacené faktury"</p>
                    <p>📊 "zobraz statistiky"</p>
                    <p>👥 "přidej zákazníka XYZ"</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg text-sm ${
                          message.type === 'user'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        <div
                          className={`text-xs mt-1 opacity-70 ${
                            message.type === 'user' ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString('cs-CZ', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input Bar */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            {!isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            )}
            
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => !isExpanded && setIsExpanded(true)}
                placeholder="Zeptejte se AI asistenta na cokoli..."
                disabled={isLoading}
                className="pr-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {messages.length > 0 && !isExpanded && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-4 h-4 mr-1" />
                {messages.length}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}