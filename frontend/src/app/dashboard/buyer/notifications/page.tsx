"use client";
import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { FaBell, FaCheckCircle, FaTimesCircle, FaBox, FaEnvelope, FaShoppingCart } from "react-icons/fa";

export default function BuyerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // TODO: Replace with actual API call when implemented
      const mockNotifications = [
        {
          id: 1,
          type: "order",
          title: "Order Shipped",
          message: "Your order #1234 has been shipped.",
          created_at: "2024-01-15T10:30:00Z",
          read: false
        },
        {
          id: 2,
          type: "message",
          title: "New Message",
          message: "You have a new message from Coffee Farm Ltd.",
          created_at: "2024-01-14T15:45:00Z",
          read: true
        },
        {
          id: 3,
          type: "cart",
          title: "Cart Reminder",
          message: "You have items left in your cart. Complete your purchase!",
          created_at: "2024-01-13T09:20:00Z",
          read: false
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return <FaBox style={{ color: "#3b82f6" }} />;
      case "message":
        return <FaEnvelope style={{ color: "#10b981" }} />;
      case "cart":
        return <FaShoppingCart style={{ color: "#f59e0b" }} />;
      default:
        return <FaBell style={{ color: "#6b7280" }} />;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div>Loading notifications...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937", marginBottom: "0.5rem" }}>
            Notifications
          </h1>
          <p style={{ color: "#6b7280", fontSize: "1rem" }}>
            Stay up to date with your orders, messages, and account activity
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 500,
            cursor: "pointer"
          }}
        >
          Mark All as Read
        </button>
      </div>

      {/* Notifications List */}
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification.id} style={{ 
              padding: "1.5rem", 
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              background: notification.read ? "#fff" : "#f0f9ff"
            }}>
              <div style={{ fontSize: "1.5rem" }}>
                {getIcon(notification.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.25rem" }}>
                  {notification.title}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.25rem" }}>
                  {notification.message}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  {new Date(notification.created_at).toLocaleString()}
                </div>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
            <FaBell style={{ fontSize: "3rem", color: "#d1d5db", marginBottom: "1rem" }} />
            <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              No notifications
            </div>
            <div style={{ fontSize: "1rem" }}>
              You're all caught up!
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 