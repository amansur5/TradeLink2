"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FaArrowLeft, FaCreditCard, FaMapMarkerAlt, FaTruck, FaCheck, FaTimes, FaUniversity, FaShoppingCart } from "react-icons/fa";
import PaymentGateway from "@/components/PaymentGateway";
import BankTransferPayment from "@/components/BankTransferPayment";

const API_BASE = "http://localhost:5000";

function Spinner() {
  return <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ width: 32, height: 32, border: '4px solid #e5e7eb', borderTop: '4px solid #0070f3', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const quantity = parseInt(searchParams.get('quantity') || '1');
  const fromCart = searchParams.get('fromCart') === 'true';
  const cartDataParam = searchParams.get('cartData');
  
  const [product, setProduct] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  
  // Form states
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCountry, setShippingCountry] = useState("Nigeria");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    if (fromCart && cartDataParam) {
      // Handle cart checkout
      try {
        const cartData = JSON.parse(decodeURIComponent(cartDataParam));
        setCartItems(cartData);
        setLoading(false);
      } catch (error) {
        setError('Invalid cart data');
        setLoading(false);
      }
    } else if (productId) {
      // Handle single product checkout
      fetchProduct();
    } else {
      setError('No product or cart data provided');
      setLoading(false);
    }
    loadUserProfile();
  }, [productId, fromCart, cartDataParam]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch product');
      setProduct(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        // Pre-fill shipping address with user's address if available
        if (data.address) setShippingAddress(data.address);
        if (data.city) setShippingCity(data.city);
        if (data.country) setShippingCountry(data.country);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const calculateShippingCost = () => {
    switch (shippingMethod) {
      case "express":
        return 5000; // ₦5,000 for express
      case "standard":
        return 2500; // ₦2,500 for standard
      default:
        return 2500;
    }
  };

  const calculateSubtotal = () => {
    if (fromCart) {
      return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    } else if (product) {
      return product.price * quantity;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShippingCost();
    return subtotal + shipping;
  };

  const handlePaymentSuccess = (paymentResult: any) => {
    setPaymentData(paymentResult);
    setShowPaymentGateway(false);
    // Proceed with order placement
    placeOrder(paymentResult);
  };

  const handlePaymentError = (error: string) => {
    alert(error);
  };

  const handlePaymentCancel = () => {
    setShowPaymentGateway(false);
  };

  const placeOrder = async (paymentResult?: any) => {
    if (!shippingAddress || !shippingCity) {
      alert('Please fill in all required shipping information');
      return;
    }

    try {
      setOrderLoading(true);
      const token = localStorage.getItem('token');
      const fullAddress = `${shippingAddress}, ${shippingCity}, ${shippingState} ${shippingPostalCode}, ${shippingCountry}`;
      
      if (fromCart) {
        // Place multiple orders for cart items
        const orderPromises = cartItems.map(async (item) => {
          const orderData: any = {
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.price,
            total_amount: (item.product.price * item.quantity) + calculateShippingCost(),
            shipping_address: fullAddress,
            shipping_method: shippingMethod,
            payment_method: paymentMethod,
            special_instructions: specialInstructions,
            status: 'pending',
            payment_status: paymentResult ? 'completed' : 'pending'
          };

          if (paymentResult) {
            orderData.payment_transaction_id = paymentResult.transactionId;
            orderData.payment_timestamp = paymentResult.timestamp;
          }

          const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to place order');
          }

          return res.json();
        });

        await Promise.all(orderPromises);
      } else if (product) {
        // Place single order
        const orderData: any = {
          product_id: product.id,
          quantity: quantity,
          unit_price: product.price,
          total_amount: calculateTotal(),
          shipping_address: fullAddress,
          shipping_method: shippingMethod,
          payment_method: paymentMethod,
          special_instructions: specialInstructions,
          status: 'pending',
          payment_status: paymentResult ? 'completed' : 'pending'
        };

        if (paymentResult) {
          orderData.payment_transaction_id = paymentResult.transactionId;
          orderData.payment_timestamp = paymentResult.timestamp;
        }

        const res = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderData)
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to place order');
        }
      }

      // Success - redirect to orders page
      window.location.href = '/dashboard/buyer/orders';
    } catch (error: any) {
      setError(error.message || 'Failed to place order');
    } finally {
      setOrderLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === 'credit_card') {
      setShowPaymentGateway(true);
    } else {
      placeOrder();
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div style={{ color: "red", padding: 32 }}>{error}</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          marginBottom: 24,
          fontSize: '1rem'
        }}
      >
        <FaArrowLeft />
        Back to {fromCart ? 'Cart' : 'Product'}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 48 }}>
        {/* Checkout Form */}
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 24, color: '#1f2937' }}>
            Checkout
          </h1>

          {/* Shipping Information */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, marginBottom: 24, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
              <FaMapMarkerAlt style={{ marginRight: 8, color: '#3b82f6' }} />
              Shipping Information
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151' }}>
                  Address *
                </label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street address"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151' }}>
                  City *
                </label>
                <input
                  type="text"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="City"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151' }}>
                  State/Province
                </label>
                <input
                  type="text"
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  placeholder="State or province"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151' }}>
                  Postal Code
                </label>
                <input
                  type="text"
                  value={shippingPostalCode}
                  onChange={(e) => setShippingPostalCode(e.target.value)}
                  placeholder="Postal code"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, color: '#374151' }}>
                  Country
                </label>
                <input
                  type="text"
                  value={shippingCountry}
                  onChange={(e) => setShippingCountry(e.target.value)}
                  placeholder="Country"
                  style={{
                    width: '100%',
                    padding: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Shipping Method */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, marginBottom: 24, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
              <FaTruck style={{ marginRight: 8, color: '#3b82f6' }} />
              Shipping Method
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="shipping"
                  value="standard"
                  checked={shippingMethod === 'standard'}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontWeight: 500, color: '#374151' }}>Standard Shipping</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>5-7 business days • ₦2,500</div>
                </div>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="shipping"
                  value="express"
                  checked={shippingMethod === 'express'}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontWeight: 500, color: '#374151' }}>Express Shipping</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>2-3 business days • ₦5,000</div>
                </div>
              </label>
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, marginBottom: 24, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
              <FaCreditCard style={{ marginRight: 8, color: '#3b82f6' }} />
              Payment Method
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="payment"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontWeight: 500, color: '#374151' }}>Bank Transfer</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pay directly to supplier's bank account</div>
                </div>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="payment"
                  value="credit_card"
                  checked={paymentMethod === 'credit_card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ margin: 0 }}
                />
                <div>
                  <div style={{ fontWeight: 500, color: '#374151' }}>Credit Card</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Secure payment via Stripe</div>
                </div>
              </label>
            </div>
          </div>

          {/* Special Instructions */}
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, marginBottom: 24, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
              Special Instructions
            </h2>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special instructions for your order..."
              style={{
                width: '100%',
                minHeight: 80,
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Order Summary */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
              Order Summary
            </h2>
            
            {/* Items */}
            <div style={{ marginBottom: 16 }}>
              {fromCart ? (
                cartItems.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: '#374151' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 600, color: '#374151' }}>
                      ₦{(item.product.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: '#374151' }}>{product?.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Qty: {quantity}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: '#374151' }}>
                    ₦{(product?.price * quantity).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
            
            {/* Totals */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#6b7280' }}>Subtotal</span>
                <span style={{ fontWeight: 500 }}>₦{calculateSubtotal().toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#6b7280' }}>Shipping</span>
                <span style={{ fontWeight: 500 }}>₦{calculateShippingCost().toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, color: '#1f2937', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                <span>Total</span>
                <span>₦{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
            
            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrder}
              disabled={orderLoading || !shippingAddress || !shippingCity}
              style={{
                width: '100%',
                padding: 16,
                background: orderLoading || !shippingAddress || !shippingCity ? '#9ca3af' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: '1rem',
                fontWeight: 600,
                cursor: orderLoading || !shippingAddress || !shippingCity ? 'not-allowed' : 'pointer',
                marginTop: 16
              }}
            >
              {orderLoading ? 'Processing...' : `Place Order - ₦${calculateTotal().toLocaleString()}`}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showPaymentGateway && (
        <PaymentGateway
          amount={calculateTotal()}
          currency="₦"
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CheckoutContent />
    </Suspense>
  );
} 