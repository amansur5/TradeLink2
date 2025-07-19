"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FaHeart, FaShoppingCart, FaStar, FaMapMarkerAlt, FaIndustry, FaPhone, FaEnvelope, FaWhatsapp, FaArrowLeft, FaShare } from "react-icons/fa";

const API_BASE = "http://localhost:5000";

function Spinner() {
  return <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ width: 32, height: 32, border: '4px solid #e5e7eb', borderTop: '4px solid #0070f3', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id;
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
    loadUserData();
  }, [productId]);

  const loadUserData = () => {
    const storedWishlist = JSON.parse(localStorage.getItem("buyerWishlist") || "[]");
    const storedCart = JSON.parse(localStorage.getItem("buyerCart") || "{}");
    setWishlist(storedWishlist);
    setCart(storedCart);
  };

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
      // Store product name in localStorage for inquiry message context
      localStorage.setItem(`product_${productId}`, JSON.stringify({ name: data.name }));
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = () => {
    const newWishlist = wishlist.includes(productId as string)
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId as string];
    
    setWishlist(newWishlist);
    localStorage.setItem("buyerWishlist", JSON.stringify(newWishlist));
  };

  const addToCart = () => {
    const newCart = { ...cart };
    newCart[productId as string] = (newCart[productId as string] || 0) + quantity;
    setCart(newCart);
    localStorage.setItem("buyerCart", JSON.stringify(newCart));
  };

  const placeOrder = () => {
    if (!product || quantity <= 0) return;
    
    // Navigate to checkout page with product and quantity parameters
    window.location.href = `/dashboard/buyer/checkout?productId=${product.id}&quantity=${quantity}`;
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Product link copied to clipboard!');
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div style={{ color: "red", padding: 32 }}>{error}</div>;
  if (!product) return <div style={{ padding: 32 }}>Product not found</div>;

  return (
    <div style={{ padding: 32 }}>
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
        Back to Products
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        {/* Product Images */}
        <div>
          <div style={{ 
            height: 400, 
            background: '#f3f4f6', 
            borderRadius: 12, 
            overflow: 'hidden',
            marginBottom: 16,
            position: 'relative'
          }}>
            {product.images && product.images[selectedImage] ? (
              <img
                src={`http://localhost:5000${product.images[selectedImage]}`}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%', 
                color: '#9ca3af' 
              }}>
                <FaIndustry style={{ fontSize: 64 }} />
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 12 }}>
              {product.images.map((image: string, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedImage === idx ? '3px solid #2563eb' : '1px solid #e5e7eb'
                  }}
                >
                  <img
                    src={`http://localhost:5000${image}`}
                    alt={`${product.name} ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1f2937', flex: 1 }}>
                {product.name}
              </h1>
              <button
                onClick={toggleWishlist}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: wishlist.includes(productId as string) ? '#ec4899' : '#6b7280',
                  fontSize: 24
                }}
              >
                <FaHeart />
              </button>
              <button
                onClick={shareProduct}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: 20
                }}
              >
                <FaShare />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <FaStar style={{ color: '#fbbf24' }} />
                <span style={{ fontWeight: 600, color: '#374151' }}>
                  {product.rating || '4.5'}
                </span>
                <span style={{ color: '#6b7280' }}>({product.reviews_count || 12} reviews)</span>
              </div>
              <span style={{ 
                background: '#dbeafe', 
                color: '#2563eb', 
                padding: '4px 12px', 
                borderRadius: 16, 
                fontSize: 14, 
                fontWeight: 500 
              }}>
                {product.category}
              </span>
            </div>

            <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937', marginBottom: 16 }}>
              ₦{product.price?.toLocaleString()}
              <span style={{ fontSize: 16, color: '#6b7280', fontWeight: 400 }}>
                / {product.price_unit || 'unit'}
              </span>
            </div>
          </div>

          {/* Producer Info */}
          <div style={{ 
            background: '#f9fafb', 
            borderRadius: 12, 
            padding: 20, 
            marginBottom: 24,
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1f2937' }}>
              Producer Information
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                background: '#dbeafe', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#2563eb'
              }}>
                <FaIndustry />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>
                  {product.producer_company || product.producer_username}
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FaMapMarkerAlt />
                  {product.producer_location || 'Nigeria'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  if (product.producer_phone) {
                    const whatsappUrl = `https://wa.me/${product.producer_phone}?text=Hello, I'm interested in your product: ${encodeURIComponent(product.name)}`;
                    window.open(whatsappUrl, '_blank');
                  } else {
                    alert('Producer phone number not available');
                  }
                }}
                style={{
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: product.producer_phone ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
                disabled={!product.producer_phone}
              >
                <FaWhatsapp />
                WhatsApp
              </button>
              <button
                onClick={() => {
                  // Redirect to messages page with product and producer info
                  window.location.href = `/dashboard/buyer/messages?productId=${product.id}&producerId=${product.producer_id}`;
                }}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <FaEnvelope />
                Message
              </button>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>
              Description
            </h3>
            <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
              {product.description || 'No description available for this product.'}
            </p>
          </div>

          {/* Product Details */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>
              Product Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <span style={{ fontSize: 14, color: '#6b7280' }}>Available Quantity:</span>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>
                  {product.quantity || 'N/A'} {product.price_unit || 'units'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 14, color: '#6b7280' }}>Minimum Order:</span>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>
                  {product.min_order_quantity || '1'} {product.price_unit || 'units'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 14, color: '#6b7280' }}>Origin:</span>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>
                  {product.origin || 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 14, color: '#6b7280' }}>Lead Time:</span>
                <div style={{ fontWeight: 600, color: '#1f2937' }}>
                  {product.lead_time || 'N/A'}
                </div>
              </div>
              {product.specifications && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>Specifications:</span>
                  <div style={{ fontWeight: 600, color: '#1f2937', marginTop: 4 }}>
                    {product.specifications}
                  </div>
                </div>
              )}
              {product.packaging && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>Packaging:</span>
                  <div style={{ fontWeight: 600, color: '#1f2937', marginTop: 4 }}>
                    {product.packaging}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Section */}
          <div style={{ 
            background: '#f9fafb', 
            borderRadius: 12, 
            padding: 24,
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1f2937' }}>
              Place Order
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <label style={{ fontWeight: 500, color: '#374151' }}>Quantity:</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: 8 }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  min={1}
                  max={product.quantity || 1}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.quantity || 1, parseInt(e.target.value) || 1)))}
                  style={{
                    width: 60,
                    textAlign: 'center',
                    border: 'none',
                    padding: '8px',
                    fontSize: '1rem'
                  }}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.quantity || 1, quantity + 1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  +
                </button>
              </div>
              <span style={{ color: '#6b7280' }}>{product.price_unit || 'units'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: '#1f2937' }}>Total:</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                ₦{(product.price * quantity).toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={addToCart}
                style={{
                  flex: 1,
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  padding: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <FaShoppingCart />
                Add to Cart
              </button>
              <button
                onClick={placeOrder}
                style={{
                  flex: 1,
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 