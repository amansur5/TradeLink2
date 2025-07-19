const API_BASE_URL = 'http://localhost:5000';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  user_type: 'producer' | 'buyer';
  first_name: string;
  last_name: string;
  company_name?: string;
  phone?: string;
  address?: string;
  country?: string;
  city?: string;
  postal_code?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  price_unit?: string;
  quantity: number;
  category?: string;
  main_image_url?: string;
  min_order_quantity?: number;
  lead_time?: string;
  origin?: string;
  specifications?: { [key: string]: string };
  export_compliance?: string;
  packaging?: string;
  shelf_life?: string;
  product_status: string;
  producer_id?: number;
  producer?: {
    id: number;
    company_name?: string;
    country?: string;
    city?: string;
  };
  images: string[];
  certifications: string[];
  shipping_options: string[];
  tags: string[];
  specifications_data?: { [key: string]: string };
  created_at: string;
  updated_at?: string;
}

export interface Inquiry {
  id: number;
  product: {
    id: number;
    name: string;
    image?: string;
  };
  buyer: {
    id: number;
    first_name: string;
    last_name: string;
    company_name?: string;
  };
  message: string;
  quantity_requested?: number;
  status: string;
  created_at: string;
  messages_count: number;
}

export interface Message {
  id: number;
  sender: {
    id: number;
    first_name: string;
    last_name: string;
    user_type: string;
  };
  message: string;
  is_read: boolean;
  is_important: boolean;
  status: string;
  created_at: string;
  attachments: {
    id: number;
    file_name: string;
    file_url: string;
    file_size: number;
  }[];
}

export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
  created_at: string;
}

export interface WishlistItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    image?: string;
  };
  created_at: string;
}

export interface Order {
  id: number;
  product: {
    id: number;
    name: string;
    image?: string;
  };
  buyer: {
    id: number;
    first_name: string;
    last_name: string;
  };
  quantity: number;
  unit_price: number;
  total_amount: number;
  shipping_address: string;
  shipping_method?: string;
  status: string;
  payment_status: string;
  created_at: string;
}

// API Service Class
class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        let errorMsg = 'API request failed';
        try {
          const error = await response.json();
          errorMsg = error.error || error.message || errorMsg;
        } catch (jsonErr) {
          // If not JSON, keep default errorMsg
        }
        throw new Error(errorMsg);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async register(userData: {
    username: string;
    email: string;
    password: string;
    user_type: 'producer' | 'buyer';
    first_name: string;
    last_name: string;
    company_name?: string;
    phone?: string;
    address?: string;
    country?: string;
    city?: string;
    postal_code?: string;
    // Bank details (required for producers)
    bank_name?: string;
    account_name?: string;
    account_number?: string;
    bank_code?: string;
    swift_code?: string;
    routing_number?: string;
  }) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(response.token);
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  // Products
  async getProducts(params?: {
    page?: number;
    per_page?: number;
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return await this.request(`/products?${queryParams.toString()}`);
  }

  async getProducerProducts() {
    return await this.request('/producer/products');
  }

  async getProduct(id: number) {
    return await this.request(`/products/${id}`);
  }

  async createProduct(productData: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    price_unit?: string;
    quantity: number;
    category?: string;
    main_image_url?: string;
    min_order_quantity?: number;
    lead_time?: string;
    origin?: string;
    specifications?: string;
    export_compliance?: string;
    packaging?: string;
    shelf_life?: string;
    product_status?: string;
    producer_id: number;
    images?: string[];
    created_at?: string;
  }) {
    return await this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id: number, productData: any) {
    return await this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id: number) {
    return await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Inquiries
  async createInquiry(inquiryData: {
    product_id?: number;
    buyer_id: number;
    producer_id?: number;
    message: string;
    quantity_requested?: number;
  }) {
    return await this.request('/inquiries', {
      method: 'POST',
      body: JSON.stringify(inquiryData),
    });
  }

  async getInquiries() {
    return await this.request('/inquiries');
  }

  // Messages
  async sendMessage(inquiryId: number, messageData: {
    message: string;
    is_important?: boolean;
  }) {
    return await this.request(`/inquiries/${inquiryId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getMessages(inquiryId: number) {
    return await this.request(`/inquiries/${inquiryId}/messages`);
  }

  // Cart
  async getCart() {
    return await this.request('/cart');
  }

  async addToCart(cartData: {
    product_id: number;
    quantity?: number;
  }) {
    return await this.request('/cart', {
      method: 'POST',
      body: JSON.stringify(cartData),
    });
  }

  async removeFromCart(itemId: number) {
    return await this.request(`/cart/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Wishlist
  async getWishlist() {
    return await this.request('/wishlist');
  }

  async addToWishlist(wishlistData: {
    product_id: number;
  }) {
    return await this.request('/wishlist', {
      method: 'POST',
      body: JSON.stringify(wishlistData),
    });
  }

  async removeFromWishlist(itemId: number) {
    return await this.request(`/wishlist/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async createOrder(orderData: {
    product_id: number;
    quantity: number;
    shipping_address: string;
    shipping_method?: string;
  }) {
    return await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders() {
    return await this.request('/orders');
  }

  // Utilities
  async getCategories() {
    return await this.request('/categories');
  }

  async getCertifications() {
    return await this.request('/certifications');
  }

  async getShippingOptions() {
    return await this.request('/shipping-options');
  }

  // Profile
  async getProfile() {
    return await this.request('/profile');
  }

  async updateProfile(profileData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    company?: string;
    first_name?: string;
    last_name?: string;
    password?: string;
  }) {
    return await this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return await this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      }),
    });
  }

  async getProducerOrders() {
    return await this.request('/producer/orders');
  }

  async getProducerDashboard() {
    return await this.request('/producer/dashboard');
  }

  async getProducerFinancials() {
    return await this.request('/producer/financials');
  }

  async getProducerPayments() {
    return await this.request('/producer/payments');
  }

  async updateProducerOrderStatus(orderId: number, status: string) {
    return await this.request(`/producer/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async updateProducerPaymentStatus(orderId: number, paymentStatus: string) {
    return await this.request(`/producer/orders/${orderId}/payment-status`, {
      method: 'PUT',
      body: JSON.stringify({ payment_status: paymentStatus })
    });
  }

  async getBankDetails() {
    return await this.request('/bank-details');
  }

  // Get producer commissions
  async getProducerCommissions() {
    return await this.request('/producer/commissions');
  }

  // Get admin bank details
  async getAdminBankDetails() {
    return await this.request('/admin/bank-details');
  }

  // Get admin commissions
  async getAdminCommissions() {
    return await this.request('/admin/commissions');
  }

  // Get commission summary
  async getCommissionSummary() {
    return await this.request('/admin/commission-summary');
  }

  // Update commission status
  async updateCommissionStatus(commissionId: number, status: string, paymentReference?: string) {
    return await this.request(`/admin/commissions/${commissionId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, payment_reference: paymentReference })
    });
  }

  // Real-time Messaging APIs

  // Get conversations for current user
  async getConversations() {
    return await this.request('/conversations');
  }

  // Get messages for a specific inquiry
  async getConversationMessages(inquiryId: number) {
    return await this.request(`/conversations/${inquiryId}/messages`);
  }

  // Send a message via REST API (alternative to WebSocket)
  async sendConversationMessage(inquiryId: number, message: string) {
    return await this.request(`/conversations/${inquiryId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // Get unread message count
  async getUnreadMessageCount() {
    return await this.request('/messages/unread-count');
  }

  // Mark messages as read for a specific inquiry
  async markMessagesRead(inquiryId: number) {
    return await this.request(`/conversations/${inquiryId}/mark-read`, {
      method: 'POST'
    });
  }

  // Get online users (Admin only)
  async getOnlineUsers() {
    return await this.request('/admin/online-users');
  }

  // Bank Details Management
  async getProducerBankDetails() {
    return await this.request('/producer/bank-details');
  }

  async addProducerBankDetails(bankData: {
    bank_name: string;
    account_name: string;
    account_number: string;
    bank_code?: string;
    swift_code?: string;
    routing_number?: string;
  }) {
    return await this.request('/producer/bank-details', {
      method: 'POST',
      body: JSON.stringify(bankData),
    });
  }

  async updateProducerBankDetails(bankId: number, bankData: {
    bank_name: string;
    account_name: string;
    account_number: string;
    bank_code?: string;
    swift_code?: string;
    routing_number?: string;
  }) {
    return await this.request(`/producer/bank-details/${bankId}`, {
      method: 'PUT',
      body: JSON.stringify(bankData),
    });
  }

  async deleteProducerBankDetails(bankId: number) {
    return await this.request(`/producer/bank-details/${bankId}`, {
      method: 'DELETE',
    });
  }

  async setPrimaryBankDetails(bankId: number) {
    return await this.request(`/producer/bank-details/${bankId}/set-primary`, {
      method: 'POST',
    });
  }

  async getProducerPublicBankDetails(producerId: number) {
    return await this.request(`/producer/${producerId}/bank-details`);
  }

  async getProducers() {
    return await this.request('/producers');
  }
}

export const apiService = new ApiService(); 