"use client";
import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { FaShoppingCart, FaBox, FaEnvelope, FaDollarSign, FaEye, FaHeart, FaSearch } from "react-icons/fa";
import Link from "next/link";

export default function BuyerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    cartItems: 0,
    wishlistItems: 0,
    unreadMessages: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load user data
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
        }

        // Load orders
        const ordersResponse = await apiService.getOrders();
        const orders = ordersResponse || [];
        setRecentOrders(orders.slice(0, 5)); // Show last 5 orders

        // Calculate stats
        const totalOrders = orders.length;
        const completedOrders = orders.filter((order: any) => order.status === 'completed').length;
        const pendingOrders = orders.filter((order: any) => order.status === 'pending').length;
        const totalSpent = orders
          .filter((order: any) => order.status === 'completed')
          .reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);

        // Load cart and wishlist (these might not be implemented yet, so we'll use placeholder data)
        const cartItems = 0; // TODO: Implement cart API
        const wishlistItems = 0; // TODO: Implement wishlist API
        const unreadMessages = 0; // TODO: Implement messages API

        setStats({
          totalOrders,
          completedOrders,
          pendingOrders,
          totalSpent,
          cartItems,
          wishlistItems,
          unreadMessages
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937", marginBottom: "0.5rem" }}>
          Welcome back, {user?.first_name || user?.username || "Buyer"}!
        </h1>
        <p style={{ color: "#6b7280", fontSize: "1rem" }}>
          Here's what's happening with your account today
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
        gap: "1.5rem", 
        marginBottom: "2rem" 
      }}>
        <div style={{ 
          background: "#fff", 
          padding: "1.5rem", 
          borderRadius: 12, 
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#3b82f6", marginBottom: "0.5rem" }}>
                {stats.totalOrders}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Total Orders</div>
            </div>
            <FaBox style={{ fontSize: "2rem", color: "#3b82f6" }} />
          </div>
        </div>

        <div style={{ 
          background: "#fff", 
          padding: "1.5rem", 
          borderRadius: 12, 
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#10b981", marginBottom: "0.5rem" }}>
                {stats.completedOrders}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Completed Orders</div>
            </div>
            <FaBox style={{ fontSize: "2rem", color: "#10b981" }} />
          </div>
        </div>

        <div style={{ 
          background: "#fff", 
          padding: "1.5rem", 
          borderRadius: 12, 
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.5rem" }}>
                {stats.pendingOrders}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Pending Orders</div>
            </div>
            <FaBox style={{ fontSize: "2rem", color: "#f59e0b" }} />
          </div>
        </div>

        <div style={{ 
          background: "#fff", 
          padding: "1.5rem", 
          borderRadius: 12, 
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.5rem" }}>
                ${stats.totalSpent.toLocaleString()}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Total Spent</div>
            </div>
            <FaDollarSign style={{ fontSize: "2rem", color: "#8b5cf6" }} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ 
        background: "#fff", 
        padding: "1.5rem", 
        borderRadius: 12, 
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        marginBottom: "2rem",
        border: "1px solid #e5e7eb"
      }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1f2937", marginBottom: "1rem" }}>
          Quick Actions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <Link href="/dashboard/buyer/products" style={{ textDecoration: "none" }}>
            <div style={{ 
              padding: "1rem", 
              border: "1px solid #e5e7eb", 
              borderRadius: 8, 
              textAlign: "center",
              transition: "all 0.2s",
              cursor: "pointer",
              background: "#f9fafb"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}>
              <FaSearch style={{ fontSize: "1.5rem", color: "#3b82f6", marginBottom: "0.5rem" }} />
              <div style={{ fontWeight: 500, color: "#374151" }}>Browse Products</div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Find new suppliers</div>
            </div>
          </Link>

          <Link href="/dashboard/buyer/orders" style={{ textDecoration: "none" }}>
            <div style={{ 
              padding: "1rem", 
              border: "1px solid #e5e7eb", 
              borderRadius: 8, 
              textAlign: "center",
              transition: "all 0.2s",
              cursor: "pointer",
              background: "#f9fafb"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}>
              <FaShoppingCart style={{ fontSize: "1.5rem", color: "#10b981", marginBottom: "0.5rem" }} />
              <div style={{ fontWeight: 500, color: "#374151" }}>View Orders</div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Track your purchases</div>
            </div>
          </Link>

          <Link href="/dashboard/buyer/messages" style={{ textDecoration: "none" }}>
            <div style={{ 
              padding: "1rem", 
              border: "1px solid #e5e7eb", 
              borderRadius: 8, 
              textAlign: "center",
              transition: "all 0.2s",
              cursor: "pointer",
              background: "#f9fafb"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}>
              <FaEnvelope style={{ fontSize: "1.5rem", color: "#f59e0b", marginBottom: "0.5rem" }} />
              <div style={{ fontWeight: 500, color: "#374151" }}>Messages</div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Communicate with suppliers</div>
            </div>
          </Link>

          <Link href="/dashboard/buyer/financials" style={{ textDecoration: "none" }}>
            <div style={{ 
              padding: "1rem", 
              border: "1px solid #e5e7eb", 
              borderRadius: 8, 
              textAlign: "center",
              transition: "all 0.2s",
              cursor: "pointer",
              background: "#f9fafb"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}>
              <FaDollarSign style={{ fontSize: "1.5rem", color: "#8b5cf6", marginBottom: "0.5rem" }} />
              <div style={{ fontWeight: 500, color: "#374151" }}>Financials</div>
              <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>View spending analytics</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ 
        background: "#fff", 
        padding: "1.5rem", 
        borderRadius: 12, 
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1f2937" }}>
            Recent Orders
          </h2>
          <Link href="/dashboard/buyer/orders" style={{ 
            textDecoration: "none", 
            color: "#3b82f6", 
            fontSize: "0.875rem",
            fontWeight: 500
          }}>
            View All Orders →
          </Link>
        </div>
        
        {recentOrders.length > 0 ? (
          <div style={{ display: "grid", gap: "1rem" }}>
            {recentOrders.map((order: any) => (
              <div key={order.id} style={{ 
                padding: "1rem", 
                border: "1px solid #e5e7eb", 
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontWeight: 500, color: "#374151", marginBottom: "0.25rem" }}>
                    {order.product?.name || "Product"}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Quantity: {order.quantity} • ${order.total_amount || order.unit_price}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ 
                    padding: "0.25rem 0.75rem", 
                    borderRadius: 20, 
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    background: order.status === 'completed' ? "#d1fae5" : 
                               order.status === 'pending' ? "#fef3c7" : "#fee2e2",
                    color: order.status === 'completed' ? "#065f46" : 
                          order.status === 'pending' ? "#92400e" : "#dc2626"
                  }}>
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || "Unknown"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "2rem", 
            color: "#6b7280",
            background: "#f9fafb",
            borderRadius: 8
          }}>
            <FaShoppingCart style={{ fontSize: "2rem", color: "#d1d5db", marginBottom: "1rem" }} />
            <div style={{ fontSize: "1rem", fontWeight: 500, marginBottom: "0.5rem" }}>
              No orders yet
            </div>
            <div style={{ fontSize: "0.875rem" }}>
              Start browsing products to make your first purchase
            </div>
            <Link href="/dashboard/buyer/products" style={{ 
              display: "inline-block",
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#3b82f6",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 6,
              fontSize: "0.875rem",
              fontWeight: 500
            }}>
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 