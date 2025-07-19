"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import websocketService, { Message, Conversation, TypingIndicator, UserStatus } from '@/services/websocket';
import { apiService } from '@/services/api';

interface MessagingContextType {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  isConnected: boolean;
  typingUsers: Map<number, TypingIndicator>;
  onlineUsers: UserStatus[];
  loading: boolean;
  error: string | null;
  
  // Actions
  selectConversation: (conversation: Conversation | null) => void;
  sendMessage: (inquiryId: number, message: string) => Promise<void>;
  markMessagesRead: (inquiryId: number) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (inquiryId: number) => Promise<void>;
  setTyping: (inquiryId: number, isTyping: boolean) => void;
  connect: (token?: string) => void;
  disconnect: () => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

interface MessagingProviderProps {
  children: ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<number, TypingIndicator>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket event handlers
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewMessage = (message: Message) => {
      // Add new message to messages if it's for the current conversation
      if (selectedConversation && message.inquiry_id === selectedConversation.inquiry_id) {
        setMessages(prev => [...prev, message]);
      }

      // Update conversations list with new message
      setConversations(prev => prev.map(conv => {
        if (conv.inquiry_id === message.inquiry_id) {
          return {
            ...conv,
            last_message: message.message,
            last_message_time: message.created_at,
            unread_count: conv.unread_count + (message.sender_id !== getCurrentUserId() ? 1 : 0)
          };
        }
        return conv;
      }));

      // Update unread count
      if (message.sender_id !== getCurrentUserId()) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleUserTyping = (data: TypingIndicator) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (data.is_typing) {
          newMap.set(data.user_id, data);
        } else {
          newMap.delete(data.user_id);
        }
        return newMap;
      });
    };

    const handleUserStatusChange = (data: UserStatus) => {
      setOnlineUsers(prev => {
        const existingIndex = prev.findIndex(user => user.user_id === data.user_id);
        if (existingIndex >= 0) {
          const newUsers = [...prev];
          newUsers[existingIndex] = data;
          return newUsers;
        } else {
          return [...prev, data];
        }
      });
    };

    const handleError = (error: any) => {
      setError(error.message || 'WebSocket error occurred');
    };

    // Register event listeners
    websocketService.on('connected', handleConnect);
    websocketService.on('disconnected', handleDisconnect);
    websocketService.on('new_message', handleNewMessage);
    websocketService.on('user_typing', handleUserTyping);
    websocketService.on('user_status_change', handleUserStatusChange);
    websocketService.on('error', handleError);

    // Cleanup
    return () => {
      websocketService.off('connected');
      websocketService.off('disconnected');
      websocketService.off('new_message');
      websocketService.off('user_typing');
      websocketService.off('user_status_change');
      websocketService.off('error');
    };
  }, [selectedConversation]);

  // Helper function to get current user ID from token
  const getCurrentUserId = (): number => {
    if (typeof window === 'undefined') return 0;
    
    const token = localStorage.getItem('token');
    if (!token) return 0;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id;
    } catch {
      return 0;
    }
  };

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getConversations();
      setConversations(data);
      
      // Calculate total unread count
      const totalUnread = data.reduce((sum: number, conv: Conversation) => sum + conv.unread_count, 0);
      setUnreadCount(totalUnread);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages for a specific conversation
  const loadMessages = useCallback(async (inquiryId: number) => {
    try {
      setLoading(true);
      const data = await apiService.getConversationMessages(inquiryId);
      setMessages(data);
      
      // Mark messages as read
      await markMessagesRead(inquiryId);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = async (inquiryId: number, messageText: string) => {
    try {
      // Try WebSocket first
      if (isConnected) {
        websocketService.sendMessage(inquiryId, messageText);
      } else {
        // Fallback to REST API
        await apiService.sendConversationMessage(inquiryId, messageText);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      throw err;
    }
  };

  // Mark messages as read
  const markMessagesRead = async (inquiryId: number) => {
    try {
      if (isConnected) {
        websocketService.markMessagesRead(inquiryId);
      } else {
        await apiService.markMessagesRead(inquiryId);
      }
      
      // Update local state
      setMessages(prev => prev.map(msg => ({ ...msg, is_read: true })));
      setConversations(prev => prev.map(conv => 
        conv.inquiry_id === inquiryId 
          ? { ...conv, unread_count: 0 }
          : conv
      ));
    } catch (err: any) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  // Set typing indicator
  const setTyping = (inquiryId: number, isTyping: boolean) => {
    if (isConnected) {
      websocketService.setTyping(inquiryId, isTyping);
    }
  };

  // Select conversation
  const selectConversation = (conversation: Conversation | null) => {
    setSelectedConversation(conversation);
    
    if (conversation) {
      // Join conversation room
      websocketService.joinConversation(conversation.inquiry_id);
      
      // Load messages
      loadMessages(conversation.inquiry_id);
    } else {
      // Leave current conversation room
      if (selectedConversation) {
        websocketService.leaveConversation(selectedConversation.inquiry_id);
      }
      setMessages([]);
    }
  };

  // Connect to WebSocket only once on mount
  useEffect(() => {
    websocketService.connect();
    return () => websocketService.disconnect();
  }, []);

  // Auto-connect when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        connect(token);
        loadConversations();
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Connect to WebSocket (exposed for consumers, but not used for auto-connect)
  const connect = (token?: string) => {
    websocketService.connect(token);
  };

  // Disconnect from WebSocket (exposed for consumers)
  const disconnect = () => {
    websocketService.disconnect();
  };

  const value: MessagingContextType = {
    conversations,
    selectedConversation,
    messages,
    unreadCount,
    isConnected,
    typingUsers,
    onlineUsers,
    loading,
    error,
    selectConversation,
    sendMessage,
    markMessagesRead,
    loadConversations,
    loadMessages,
    setTyping,
    connect,
    disconnect
  };

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        selectedConversation,
        messages,
        unreadCount,
        isConnected,
        typingUsers,
        onlineUsers,
        loading,
        error,
        selectConversation,
        sendMessage,
        markMessagesRead,
        loadConversations,
        loadMessages,
        setTyping,
        connect,
        disconnect
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}; 