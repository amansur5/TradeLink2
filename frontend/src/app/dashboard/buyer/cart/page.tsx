"use client";
import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaArrowLeft, FaCreditCard } from "react-icons/fa";
import Link from "next/link";

export default function BuyerCartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      // TODO: Replace with actual API call when implemented
      const mockCartItems = [
        {
          id: 1,
          product: {
            id: 1,
            name: "Organic Coffee Beans",
            price: 25.99,
            image: null,
            description: "Premium organic coffee beans from local farms"
          },
          quantity: 2,
          added_at: "2024-01-15T10:30:00Z"
        },
        {
          id: 2,
          product: {
            id: 2,
            name: "Premium Rice",
            price: 15.50,
            image: null,
            description: "High-quality rice from certified producers"
          },
          quantity: 3,
          added_at: "2024-01-14T15:45:00Z"
        }
      ];
      setCartItems(mockCartItems);
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      // TODO: Replace with actual API call
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      // TODO: Replace with actual API call
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const getShipping = () => {
    return cartItems.length > 0 ? 5.99 : 0;
  };

  const getTax = () => {
    return getSubtotal() * 0.08; // 8% tax
  };

  const getTotal = () => {
    return getSubtotal() + getShipping() + getTax();
  };

  const proceedToCheckout = () => {
    // Redirect to checkout page with cart items
    const cartData = encodeURIComponent(JSON.stringify(cartItems));
    window.location.href = `/dashboard/buyer/checkout?fromCart=true&cartData=${cartData}`;
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div>Loading cart...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
          <Link href="/dashboard/buyer/products" style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem",
            color: "#6b7280",
            textDecoration: "none",
            fontSize: "0.875rem"
          }}>
            <FaArrowLeft style={{ fontSize: "0.75rem" }} />
            Continue Shopping
          </Link>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937", marginBottom: "0.5rem" }}>
          Shopping Cart
        </h1>
        <p style={{ color: "#6b7280", fontSize: "1rem" }}>
          Review your items and proceed to checkout
        </p>
      </div>

      {cartItems.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
          {/* Cart Items */}
          <div style={{ 
            background: "#fff", 
            borderRadius: 8, 
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
            overflow: "hidden"
          }}>
            <div style={{ 
              padding: "1.5rem", 
              borderBottom: "1px solid #e5e7eb",
              background: "#f9fafb"
            }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1f2937" }}>
                Cart Items ({cartItems.length})
              </h2>
            </div>

            <div>
              {cartItems.map((item) => (
                <div key={item.id} style={{ 
                  padding: "1.5rem", 
                  borderBottom: "1px solid #f3f4f6",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "center"
                }}>
                  {/* Product Image */}
                  <div style={{ 
                    width: "80px", 
                    height: "80px", 
                    background: "#f3f4f6", 
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <FaShoppingCart style={{ color: "#6b7280", fontSize: "1.5rem" }} />
                  </div>

                  {/* Product Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.25rem" }}>
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                      {item.product.description}
                    </div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "#10b981" }}>
                      ${item.product.price}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      style={{
                        width: "32px",
                        height: "32px",
                        background: "#f3f4f6",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <FaMinus style={{ fontSize: "0.75rem", color: "#6b7280" }} />
                    </button>
                    <span style={{ 
                      minWidth: "40px", 
                      textAlign: "center", 
                      fontWeight: 600,
                      fontSize: "0.875rem"
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{
                        width: "32px",
                        height: "32px",
                        background: "#f3f4f6",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <FaPlus style={{ fontSize: "0.75rem", color: "#6b7280" }} />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div style={{ textAlign: "right", minWidth: "100px" }}>
                    <div style={{ fontWeight: 600, color: "#1f2937", fontSize: "1.125rem" }}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      padding: "0.5rem",
                      background: "#fee2e2",
                      color: "#ef4444",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer"
                    }}
                  >
                    <FaTrash style={{ fontSize: "0.875rem" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div style={{ 
            background: "#fff", 
            borderRadius: 8, 
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
            height: "fit-content"
          }}>
            <div style={{ 
              padding: "1.5rem", 
              borderBottom: "1px solid #e5e7eb",
              background: "#f9fafb"
            }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1f2937" }}>
                Order Summary
              </h2>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Subtotal</span>
                  <span style={{ fontWeight: 600 }}>${getSubtotal().toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Shipping</span>
                  <span style={{ fontWeight: 600 }}>${getShipping().toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280" }}>Tax</span>
                  <span style={{ fontWeight: 600 }}>${getTax().toFixed(2)}</span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  paddingTop: "1rem",
                  borderTop: "1px solid #e5e7eb",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#1f2937"
                }}>
                  <span>Total</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={proceedToCheckout}
                disabled={checkoutLoading}
                style={{
                  width: "100%",
                  padding: "1rem",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                <FaCreditCard style={{ fontSize: "1rem" }} />
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: "center", 
          padding: "4rem 2rem", 
          background: "#fff", 
          borderRadius: 8, 
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <FaShoppingCart style={{ fontSize: "4rem", color: "#d1d5db", marginBottom: "1.5rem" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1f2937", marginBottom: "0.5rem" }}>
            Your cart is empty
          </h2>
          <p style={{ color: "#6b7280", fontSize: "1rem", marginBottom: "2rem" }}>
            Add some products to your cart to get started
          </p>
          <Link href="/dashboard/buyer/products" style={{
            padding: "0.75rem 1.5rem",
            background: "#3b82f6",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 6,
            fontWeight: 500,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <FaArrowLeft style={{ fontSize: "0.875rem" }} />
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  );
} 