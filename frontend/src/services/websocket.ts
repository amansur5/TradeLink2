import { io, Socket } from 'socket.io-client';

export interface Message {
  id: number;
  inquiry_id: number;
  sender_id: number;
  sender_name: string;
  sender_username: string;
  sender_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  product_name: string;
  buyer_name: string;
  producer_name: string;
}

export interface Conversation {
  inquiry_id: number;
  product_id: number;
  buyer_id: number;
  producer_id: number;
  product_name: string;
  product_image: string;
  buyer_username: string;
  buyer_first_name: string;
  buyer_last_name: string;
  buyer_company: string;
  producer_username: string;
  producer_first_name: string;
  producer_last_name: string;
  producer_company: string;
  inquiry_created_at: string;
  unread_count: number;
  last_message: string;
  last_message_time: string;
  other_user: {
    id: number;
    username: string;
    name: string;
    company: string;
    type: string;
  };
}

export interface TypingIndicator {
  inquiry_id: number;
  user_id: number;
  username: string;
  user_name: string;
  is_typing: boolean;
}

export interface UserStatus {
  user_id: number;
  username: string;
  user_name: string;
  is_online: boolean;
  last_seen?: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    // Get token from localStorage only if we're in the browser
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  connect(token?: string) {
    if (token) {
      this.token = token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
    }

    if (!this.token) {
      console.error('No token available for WebSocket connection');
      return;
    }

    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
    }

    // Connect to WebSocket server
    this.socket = io('http://localhost:5000', {
      auth: {
        token: this.token
      },
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000, // 20 second timeout
      forceNew: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('disconnected', reason);
    });

    this.socket.on('connection_confirmed', (data) => {
      console.log('Connection confirmed:', data);
      this.emit('connection_confirmed', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    this.socket.on('new_message', (message: Message) => {
      console.log('New message received:', message);
      this.emit('new_message', message);
    });

    this.socket.on('message_sent', (data) => {
      console.log('Message sent confirmation:', data);
      this.emit('message_sent', data);
    });

    this.socket.on('messages_read', (data) => {
      console.log('Messages marked as read:', data);
      this.emit('messages_read', data);
    });

    this.socket.on('user_typing', (data: TypingIndicator) => {
      console.log('User typing:', data);
      this.emit('user_typing', data);
    });

    this.socket.on('user_status_change', (data: UserStatus) => {
      console.log('User status change:', data);
      this.emit('user_status_change', data);
    });

    this.socket.on('notification', (data) => {
      console.log('Notification received:', data);
      this.emit('notification', data);
    });

    this.socket.on('admin_notification', (data) => {
      console.log('Admin notification received:', data);
      this.emit('admin_notification', data);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.emit('reconnect_failed');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(inquiryId: number) {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', { conversation_id: inquiryId });
    }
  }

  leaveConversation(inquiryId: number) {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', { conversation_id: inquiryId });
    }
  }

  sendMessage(inquiryId: number, message: string) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        inquiry_id: inquiryId,
        message: message
      });
    } else {
      console.error('WebSocket not connected');
      throw new Error('WebSocket not connected');
    }
  }

  markMessagesRead(inquiryId: number) {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', { inquiry_id: inquiryId });
    }
  }

  setTyping(inquiryId: number, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('typing', {
        inquiry_id: inquiryId,
        is_typing: isTyping
      });
    }
  }

  updateOnlineStatus(isOnline: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('online_status', { is_online: isOnline });
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService; 