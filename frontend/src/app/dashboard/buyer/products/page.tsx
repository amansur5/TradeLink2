"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaHeart, FaShoppingCart, FaStar, FaMapMarkerAlt, FaIndustry } from "react-icons/fa";
import { apiService } from "@/services/api";

function Spinner() {
  return <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ width: 32, height: 32, border: '4px solid #e5e7eb', borderTop: '4px solid #0070f3', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>;
}

export default function BuyerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProducer, setSelectedProducer] = useState("All");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [sortBy, setSortBy] = useState("name");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  const [categories, setCategories] = useState<string[]>(["All"]);
  const [producers, setProducers] = useState<string[]>(["All"]);

  useEffect(() => {
    fetchProducts();
    loadUserData();
    loadCategories();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      loadProducers();
    }
  }, [products]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, search, selectedCategory, selectedProducer, priceRange, sortBy]);

  const loadUserData = () => {
    const storedWishlist = JSON.parse(localStorage.getItem("buyerWishlist") || "[]");
    const storedCart = JSON.parse(localStorage.getItem("buyerCart") || "{}");
    setWishlist(storedWishlist);
    setCart(storedCart);
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await apiService.getCategories();
      setCategories(["All", ...categoriesData]);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadProducers = async () => {
    try {
      // Extract unique producer names from products
      const producerNames = new Set<string>();
      products.forEach(product => {
        if (product.producer?.company_name) {
          producerNames.add(product.producer.company_name);
        } else if (product.producer_company) {
          producerNames.add(product.producer_company);
        }
      });
      setProducers(["All", ...Array.from(producerNames)]);
    } catch (error) {
      console.error("Error loading producers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getProducts();
      console.log('Fetched products:', data); // Debug log
      setProducts(data);
      setFilteredProducts(data);
      
      // Calculate max price for price range
      if (data && data.length > 0) {
        const maxProductPrice = Math.max(...data.map((p: any) => p.price || 0));
        setMaxPrice(maxProductPrice);
        setPriceRange([0, maxProductPrice]);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err); // Debug log
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    console.log('Filtering products:', { products: products.length, search, selectedCategory, selectedProducer, priceRange }); // Debug log
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                           (product.description && product.description.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || (product.category && product.category === selectedCategory);
      const matchesProducer = selectedProducer === "All" || 
                             (product.producer?.company_name && product.producer.company_name === selectedProducer) ||
                             (product.producer_company && product.producer_company === selectedProducer);
      const matchesPrice = (product.price || 0) >= priceRange[0] && (product.price || 0) <= priceRange[1];
      
      const matches = matchesSearch && matchesCategory && matchesProducer && matchesPrice;
      if (!matches) {
        console.log('Product filtered out:', product.name, { matchesSearch, matchesCategory, matchesProducer, matchesPrice }); // Debug log
      }
      return matches;
    });

    console.log('Filtered products count:', filtered.length); // Debug log

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const toggleWishlist = (productId: string) => {
    const newWishlist = wishlist.includes(productId)
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId];
    
    setWishlist(newWishlist);
    localStorage.setItem("buyerWishlist", JSON.stringify(newWishlist));
  };

  const addToCart = (productId: string) => {
    const newCart = { ...cart };
    newCart[productId] = (newCart[productId] || 0) + 1;
    setCart(newCart);
    localStorage.setItem("buyerCart", JSON.stringify(newCart));
  };

  const getCartQuantity = (productId: string) => cart[productId] || 0;

  if (loading) return <Spinner />;
  if (error) return <div style={{ color: "red", padding: 32 }}>{error}</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: '#1f2937' }}>Browse Products</h1>
      
      {/* Search and Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FaSearch style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: '1rem'
              }}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              fontSize: '1rem',
              minWidth: 150
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: '0.9rem'
              }}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>Producer</label>
            <select
              value={selectedProducer}
              onChange={(e) => setSelectedProducer(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                fontSize: '0.9rem'
              }}
            >
              {producers.map(prod => (
                <option key={prod} value={prod}>{prod}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#374151' }}>Price Range (₦)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="Min"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ alignSelf: 'center', color: '#6b7280' }}>-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange[1]}
                max={maxPrice}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || maxPrice])}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: '#6b7280' }}>
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      {/* Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {filteredProducts.map((product) => (
          <div key={product.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' }}>
            {/* Product Image */}
            <div style={{ height: 200, background: '#f3f4f6', position: 'relative' }}>
              {product.images && product.images[0] ? (
                <img
                  src={`http://localhost:5000${product.images[0]}`}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                  <FaIndustry style={{ fontSize: 48 }} />
                </div>
              )}
              
              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product.id.toString())}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: wishlist.includes(product.id.toString()) ? '#ec4899' : '#6b7280'
                }}
              >
                <FaHeart />
              </button>
            </div>

            {/* Product Info */}
            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>
                {product.name}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FaMapMarkerAlt style={{ color: '#6b7280', fontSize: 14 }} />
                <span style={{ fontSize: 14, color: '#6b7280' }}>
                  {product.producer?.company_name || product.producer_company || 'Unknown Producer'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ 
                  background: '#dbeafe', 
                  color: '#2563eb', 
                  padding: '4px 8px', 
                  borderRadius: 4, 
                  fontSize: 12, 
                  fontWeight: 500 
                }}>
                  {product.category}
                </span>
              </div>

              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
                {product.description?.substring(0, 100)}...
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                    {product.currency || 'NGN'} {product.price?.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 14, color: '#6b7280', marginLeft: 4 }}>
                    / {product.price_unit || 'unit'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FaStar style={{ color: '#fbbf24', fontSize: 14 }} />
                  <span style={{ fontSize: 14, color: '#6b7280' }}>
                    {product.rating || '4.5'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => addToCart(product.id.toString())}
                  style={{
                    flex: 1,
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <FaShoppingCart />
                  {getCartQuantity(product.id.toString()) > 0 ? `(${getCartQuantity(product.id.toString())})` : 'Add to Cart'}
                </button>
                
                <button
                  onClick={() => window.location.href = `/dashboard/buyer/products/${product.id}`}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    padding: '12px 16px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64, color: '#6b7280' }}>
          <FaSearch style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>No products found</h3>
          <p>Try adjusting your search criteria or filters</p>
        </div>
      )}
    </div>
  );
} 