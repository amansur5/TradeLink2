"use client";
import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { FaHeart, FaShoppingCart, FaTrash, FaSearch, FaFilter, FaEye } from "react-icons/fa";
import Link from "next/link";

export default function BuyerWishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      // TODO: Replace with actual API call when implemented
      const mockWishlistItems = [
        {
          id: 1,
          product: {
            id: 1,
            name: "Organic Coffee Beans",
            price: 25.99,
            image: null,
            description: "Premium organic coffee beans from local farms",
            category: "Coffee",
            producer: { name: "Coffee Farm Ltd" }
          },
          added_at: "2024-01-15T10:30:00Z"
        },
        {
          id: 2,
          product: {
            id: 2,
            name: "Premium Rice",
            price: 15.50,
            image: null,
            description: "High-quality rice from certified producers",
            category: "Grains",
            producer: { name: "Rice Producers Co." }
          },
          added_at: "2024-01-14T15:45:00Z"
        },
        {
          id: 3,
          product: {
            id: 3,
            name: "Organic Honey",
            price: 12.99,
            image: null,
            description: "Pure organic honey from local beekeepers",
            category: "Honey",
            producer: { name: "Honey Valley Farms" }
          },
          added_at: "2024-01-13T09:20:00Z"
        }
      ];
      setWishlistItems(mockWishlistItems);
    } catch (error) {
      console.error("Error loading wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: number) => {
    try {
      // TODO: Replace with actual API call
      console.log("Adding product to cart:", productId);
      alert("Product added to cart! (This will be connected to the actual cart API)");
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const removeFromWishlist = async (itemId: number) => {
    try {
      // TODO: Replace with actual API call
      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  const filteredItems = wishlistItems.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.producer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.product.category.toLowerCase() === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategories = () => {
    const categories = new Set(wishlistItems.map(item => item.product.category));
    return Array.from(categories);
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div>Loading wishlist...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937", marginBottom: "0.5rem" }}>
          My Wishlist
        </h1>
        <p style={{ color: "#6b7280", fontSize: "1rem" }}>
          Save products you love and add them to cart when ready
        </p>
      </div>

      {/* Stats */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "1rem", 
        marginBottom: "2rem" 
      }}>
        <div style={{ 
          background: "#fff", 
          padding: "1.5rem", 
          borderRadius: 8, 
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <FaHeart style={{ fontSize: "1.5rem", color: "#ef4444" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                {wishlistItems.length}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Wishlist Items</div>
            </div>
          </div>
        </div>

        <div style={{ 
          background: "#fff", 
          padding: "1.5rem", 
          borderRadius: 8, 
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <FaShoppingCart style={{ fontSize: "1.5rem", color: "#3b82f6" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                ${wishlistItems.reduce((sum, item) => sum + item.product.price, 0).toFixed(2)}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Total Value</div>
            </div>
          </div>
        </div>

        <div style={{ 
          background: "#fff", 
          padding: "1.5rem", 
          borderRadius: 8, 
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <FaFilter style={{ fontSize: "1.5rem", color: "#10b981" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                {getCategories().length}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{ 
        background: "#fff", 
        padding: "1.5rem", 
        borderRadius: 8, 
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        marginBottom: "2rem",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
            <FaSearch style={{ 
              position: "absolute", 
              left: "12px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              color: "#9ca3af" 
            }} />
            <input
              type="text"
              placeholder="Search wishlist items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: "0.875rem"
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: "0.875rem",
              background: "#fff"
            }}
          >
            <option value="all">All Categories</option>
            {getCategories().map(category => (
              <option key={category} value={category.toLowerCase()}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Wishlist Items */}
      {filteredItems.length > 0 ? (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: "1.5rem" 
        }}>
          {filteredItems.map((item) => (
            <div key={item.id} style={{ 
              background: "#fff", 
              borderRadius: 8, 
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}>
              {/* Product Image */}
              <div style={{ 
                height: "200px", 
                background: "#f3f4f6", 
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <FaHeart style={{ color: "#d1d5db", fontSize: "3rem" }} />
              </div>

              {/* Product Info */}
              <div style={{ padding: "1.5rem" }}>
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ 
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    background: "#dbeafe",
                    color: "#1e40af",
                    borderRadius: 20,
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    marginBottom: "0.5rem"
                  }}>
                    {item.product.category}
                  </div>
                  <h3 style={{ 
                    fontSize: "1.125rem", 
                    fontWeight: 600, 
                    color: "#1f2937", 
                    marginBottom: "0.5rem",
                    lineHeight: 1.4
                  }}>
                    {item.product.name}
                  </h3>
                  <p style={{ 
                    fontSize: "0.875rem", 
                    color: "#6b7280", 
                    marginBottom: "0.5rem",
                    lineHeight: 1.5
                  }}>
                    {item.product.description}
                  </p>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    by {item.product.producer.name}
                  </div>
                </div>

                {/* Price and Actions */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "1rem"
                }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#10b981" }}>
                    ${item.product.price}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                    Added {new Date(item.added_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => addToCart(item.product.id)}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      background: "#3b82f6",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <FaShoppingCart style={{ fontSize: "0.75rem" }} />
                    Add to Cart
                  </button>
                  <Link href={`/dashboard/buyer/products/${item.product.id}`} style={{
                    padding: "0.75rem",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: 6,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none"
                  }}>
                    <FaEye style={{ fontSize: "0.75rem" }} />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    style={{
                      padding: "0.75rem",
                      background: "#fee2e2",
                      color: "#ef4444",
                      border: "none",
                      borderRadius: 6,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <FaTrash style={{ fontSize: "0.75rem" }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
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
          <FaHeart style={{ fontSize: "4rem", color: "#d1d5db", marginBottom: "1.5rem" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1f2937", marginBottom: "0.5rem" }}>
            {searchTerm || categoryFilter !== "all" ? "No items found" : "Your wishlist is empty"}
          </h2>
          <p style={{ color: "#6b7280", fontSize: "1rem", marginBottom: "2rem" }}>
            {searchTerm || categoryFilter !== "all" 
              ? "Try adjusting your search or filters" 
              : "Start adding products you love to your wishlist"
            }
          </p>
          {!searchTerm && categoryFilter === "all" && (
            <Link href="/dashboard/buyer/products" style={{ 
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              background: "#3b82f6",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 6,
              fontWeight: 500
            }}>
              Browse Products
            </Link>
          )}
        </div>
      )}
    </div>
  );
} 