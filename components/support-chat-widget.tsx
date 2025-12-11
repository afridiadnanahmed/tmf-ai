'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Trash2, ChevronLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface Chat {
  id: number;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'chat'>('chat');
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Fetch chat history when opening
  const fetchChats = async () => {
    try {
      const response = await fetch('/api/support-chat');
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  // Fetch messages for a specific chat
  const fetchMessages = async (chatId: number) => {
    try {
      const response = await fetch(`/api/support-chat?chatId=${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentChatId(chatId);
        setView('chat');
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  // Start a new chat
  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setView('chat');
  };

  // Delete a chat
  const deleteChat = async (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/support-chat?chatId=${chatId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setChats(chats.filter(c => c.id !== chatId));
        if (currentChatId === chatId) {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Handle opening the widget
  const handleOpen = () => {
    setIsOpen(true);
    fetchChats();
  };

  // Send message
  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          chatId: currentChatId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentChatId(data.chatId);

        // Add AI response
        setMessages(prev => [...prev, data.message]);

        // Refresh chat list
        fetchChats();
      } else {
        // Add error message
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          content: 'Sorry, I could not connect to the server. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      // Focus input after sending message (delay to ensure input is enabled)
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for chat list
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        className={cn(
          'fixed bottom-6 right-6 z-[9999] flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105',
          'w-14 h-14 bg-gradient-to-r from-[#459AFF] to-[#9F8BF9]',
          isOpen && 'scale-0 opacity-0'
        )}
        aria-label="Open support chat"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-[9999] flex flex-col rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden',
          'w-[380px] h-[600px] bg-white border border-gray-200',
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#459AFF] to-[#9F8BF9]">
          <div className="flex items-center gap-3">
            {view === 'chat' && chats.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={() => setView('list')}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI Support</h3>
                <p className="text-white/80 text-xs">Ask me anything</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {view === 'chat' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                onClick={startNewChat}
                title="New chat"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {view === 'list' ? (
          /* Chat History List */
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b">
              <Button
                onClick={startNewChat}
                className="w-full bg-gradient-to-r from-[#459AFF] to-[#9F8BF9] hover:opacity-90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No previous conversations</p>
                </div>
              ) : (
                <div className="p-2">
                  {chats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => fetchMessages(chat.id)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(chat.updatedAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                        onClick={(e) => deleteChat(chat.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          /* Chat View */
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#459AFF]/10 to-[#9F8BF9]/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-[#459AFF]" />
                  </div>
                  <h4 className="text-gray-900 font-medium mb-2">How can I help you today?</h4>
                  <p className="text-gray-500 text-sm">
                    Ask me about integrations, campaigns, scheduling, or any other feature.
                  </p>
                  <div className="mt-6 space-y-2 w-full">
                    {[
                      'How do I connect Facebook?',
                      'Help with post scheduling',
                      'What integrations are available?',
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInputValue(suggestion);
                          inputRef.current?.focus();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-2.5',
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-[#459AFF] to-[#9F8BF9] text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={cn(
                            'text-xs mt-1',
                            message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                          )}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-full border-gray-200 focus:border-[#459AFF] focus:ring-[#459AFF]"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-[#459AFF] to-[#9F8BF9] hover:opacity-90 shrink-0"
                  disabled={!inputValue.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t">
          <p className="text-xs text-gray-400 text-center">
            Powered by AI. For complex issues, contact human support.
          </p>
        </div>
      </div>
    </>
  );
}
