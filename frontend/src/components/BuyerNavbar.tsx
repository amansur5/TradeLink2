"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { apiService } from "@/services/api";
import { FaUser, FaCog, FaBell, FaShoppingCart, FaHeart } from "react-icons/fa";

export default function BuyerNavbar() {
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [cartItems, setCartItems] = useState(0);
  const [wishlistItems, setWishlistItems] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        // Load cart and wishlist counts (placeholder for now)
        // TODO: Implement actual API calls when cart/wishlist APIs are ready
        setCartItems(0);
        setWishlistItems(0);
        setNotifications(0);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLogout = () => {
    apiService.clearToken();
    localStorage.removeItem("user");
    setUser(null);
    setShowDropdown(false);
    router.push("/");
  };

  // Check if user is a buyer (handle both type and user_type properties)
  const isBuyer = user && (user.type === "buyer" || user.user_type === "buyer");
  
  // Show navbar for all users on buyer routes (for now)
  // TODO: Implement proper user type checking when needed

  const isActive = (path: string) => {
    if (path === "/dashboard/buyer") {
      return pathname === "/dashboard/buyer";
    }
    return pathname.startsWith(path);
  };

  const getLinkStyle = (path: string) => ({
    textDecoration: 'none',
    color: isActive(path) ? '#2563eb' : '#374151',
    fontWeight: isActive(path) ? 600 : 500,
    padding: '0.5rem 1rem',
    borderRadius: 6,
    background: isActive(path) ? '#eff6ff' : 'transparent',
    transition: 'all 0.2s'
  });

  return (
    <nav style={{ background: '#fff', padding: '1rem 2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
        <Link href="/dashboard/buyer" style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0070f3', margin: 0 }}>TradeLink Buyer</h1>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/dashboard/buyer" style={getLinkStyle("/dashboard/buyer")}>Dashboard</Link>
          <Link href="/dashboard/buyer/products" style={getLinkStyle("/dashboard/buyer/products")}>Products</Link>
          <Link href="/dashboard/buyer/orders" style={getLinkStyle("/dashboard/buyer/orders")}>Orders</Link>
          <Link href="/dashboard/buyer/messages" style={getLinkStyle("/dashboard/buyer/messages")}>Messages</Link>
          <Link href="/dashboard/buyer/financials" style={getLinkStyle("/dashboard/buyer/financials")}>Financials</Link>
          
          {/* Cart Icon */}
          <Link href="/dashboard/buyer/cart" style={{ 
            textDecoration: 'none', 
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            padding: '0.5rem',
            borderRadius: 6,
            transition: 'all 0.2s',
            position: 'relative'
          }}>
            <FaShoppingCart style={{ fontSize: '1.2rem' }} />
            {cartItems > 0 && (
              <span style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}>
                {cartItems > 9 ? '9+' : cartItems}
              </span>
            )}
          </Link>

          {/* Wishlist Icon */}
          <Link href="/dashboard/buyer/wishlist" style={{ 
            textDecoration: 'none', 
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            padding: '0.5rem',
            borderRadius: 6,
            transition: 'all 0.2s',
            position: 'relative'
          }}>
            <FaHeart style={{ fontSize: '1.2rem' }} />
            {wishlistItems > 0 && (
              <span style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}>
                {wishlistItems > 9 ? '9+' : wishlistItems}
              </span>
            )}
          </Link>

          {/* Notifications Icon */}
          <Link href="/dashboard/buyer/notifications" style={{ 
            textDecoration: 'none', 
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            padding: '0.5rem',
            borderRadius: 6,
            transition: 'all 0.2s',
            position: 'relative'
          }}>
            <FaBell style={{ fontSize: '1.2rem' }} />
            {notifications > 0 && (
              <span style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}>
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </Link>
          
          {/* Profile Icon - Always Visible */}
          <Link href="/dashboard/buyer/account" style={{ 
            textDecoration: 'none', 
            color: isActive("/dashboard/buyer/account") ? '#2563eb' : '#374151',
            display: 'flex',
            alignItems: 'center',
            padding: '0.5rem',
            borderRadius: 6,
            background: isActive("/dashboard/buyer/account") ? '#eff6ff' : 'transparent',
            transition: 'all 0.2s'
          }}>
            <FaUser style={{ fontSize: '1.2rem' }} />
          </Link>

          {/* Settings Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#374151', 
                fontWeight: 500, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                borderRadius: 6,
                transition: 'all 0.2s'
              }}
            >
              <FaCog style={{ fontSize: '1.2rem', color: '#6b7280' }} />
            </button>
            {showDropdown && (
              <div style={{ 
                position: 'absolute', 
                top: '100%', 
                right: 0, 
                background: '#fff', 
                border: '1px solid #e5e7eb', 
                borderRadius: 8, 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                padding: '0.5rem 0',
                minWidth: 200,
                zIndex: 1000
              }}>
                <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ fontWeight: 600, color: '#374151' }}>
                    {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'User'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{user.email}</div>
                </div>
                <Link href="/dashboard/buyer/account" style={{ display: 'block', padding: '0.5rem 1rem', textDecoration: 'none', color: '#374151' }}>
                  Account Settings
                </Link>
                <Link href="/profile" style={{ display: 'block', padding: '0.5rem 1rem', textDecoration: 'none', color: '#374151' }}>
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  style={{ 
                    display: 'block', 
                    width: '100%', 
                    padding: '0.5rem 1rem', 
                    background: 'none', 
                    border: 'none', 
                    color: '#dc2626', 
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showDropdown && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </nav>
  );
} 