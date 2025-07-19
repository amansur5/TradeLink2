"use client";
import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaBox } from "react-icons/fa";

export default function ProducerProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "NGN",
    price_unit: "",
    quantity: "",
    category: "",
    main_image_url: "",
    min_order_quantity: "1",
    lead_time: "",
    origin: "",
    specifications: "",
    export_compliance: "",
    packaging: "",
    shelf_life: "",
    product_status: "active",
    images: [] as File[]
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await apiService.getProfile();
      setCurrentUser(user.user);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await apiService.getProducerProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await apiService.deleteProduct(productId);
      // Reload products to get updated list
      await loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const toggleProductStatus = async (productId: number) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      const newStatus = product.product_status === 'active' ? 'inactive' : 'active';
      await apiService.updateProduct(productId, { product_status: newStatus });
      
      // Reload products to get updated list
      await loadProducts();
    } catch (error) {
      console.error("Error updating product status:", error);
      alert('Failed to update product status. Please try again.');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || (product.category && product.category.toLowerCase() === categoryFilter);
    
    return matchesSearch && matchesCategory;
  });

  const getCategories = () => {
    const categories = new Set(products.map(product => product.category).filter(Boolean));
    return Array.from(categories);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { background: '#d1fae5', color: '#065f46' };
      case 'inactive':
        return { background: '#fee2e2', color: '#dc2626' };
      default:
        return { background: '#f3f4f6', color: '#374151' };
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for price field
    if (name === 'price') {
      // Remove all non-numeric characters except decimal point
      const numericValue = value.replace(/[^\d.]/g, '');
      
      // Ensure only one decimal point
      const parts = numericValue.split('.');
      if (parts.length > 2) {
        return; // Don't update if multiple decimal points
      }
      
      // Limit decimal places to 2
      if (parts.length === 2 && parts[1].length > 2) {
        return; // Don't update if more than 2 decimal places
      }
      
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newFiles]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const formatPriceDisplay = (value: string) => {
    if (!value) return '';
    
    // Remove any existing commas and get the numeric value
    const numericValue = value.replace(/,/g, '');
    
    // Split by decimal point
    const parts = numericValue.split('.');
    const wholePart = parts[0];
    const decimalPart = parts[1] || '';
    
    // Add commas to whole number part
    const formattedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Combine with decimal part
    return decimalPart ? `${formattedWhole}.${decimalPart}` : formattedWhole;
  };

  const getDisplayPrice = (value: string) => {
    return formatPriceDisplay(value);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Product description is required';
    }
    if (!formData.price || parseFloat(formData.price.replace(/,/g, '')) <= 0) {
      errors.price = 'Valid price is required';
    }
    if (!formData.price_unit.trim()) {
      errors.price_unit = 'Price unit is required';
    }
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }
    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      errors.quantity = 'Valid quantity is required';
    }
    if (!formData.min_order_quantity || parseInt(formData.min_order_quantity) < 1) {
      errors.min_order_quantity = 'Minimum order quantity must be at least 1';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const parseSpecifications = (specString: string): { [key: string]: string } => {
    const obj: { [key: string]: string } = {};
    specString.split('\n').forEach(line => {
      const [key, ...rest] = line.split(':');
      if (key && rest.length > 0) {
        obj[key.trim()] = rest.join(':').trim();
      }
    });
    return obj;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price.replace(/,/g, '')),
        quantity: parseInt(formData.quantity),
        min_order_quantity: parseInt(formData.min_order_quantity),
        specifications: JSON.stringify(parseSpecifications(formData.specifications)),
        images: [], // handle image upload as before
        producer_id: currentUser?.id,
      };
      await apiService.createProduct(productData);
      resetForm();
      setShowAddModal(false);
      await loadProducts();
    } catch (error: any) {
      setFormErrors({ general: error.message || 'Failed to add product.' });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      currency: "NGN",
      price_unit: "",
      quantity: "",
      category: "",
      main_image_url: "",
      min_order_quantity: "1",
      lead_time: "",
      origin: "",
      specifications: "",
      export_compliance: "",
      packaging: "",
      shelf_life: "",
      product_status: "active",
      images: []
    });
    setFormErrors({});
  };

  const closeModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div>Loading products...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937", marginBottom: "0.5rem" }}>
            My Products
          </h1>
          <p style={{ color: "#6b7280", fontSize: "1rem" }}>
            Manage your product catalog and inventory
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <FaPlus style={{ fontSize: "0.875rem" }} />
          Add Product
        </button>
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
            <FaBox style={{ fontSize: "1.5rem", color: "#3b82f6" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                {products.length}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Total Products</div>
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
            <FaBox style={{ fontSize: "1.5rem", color: "#10b981" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                {products.filter(p => p.product_status === 'active').length}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Active Products</div>
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
            <FaBox style={{ fontSize: "1.5rem", color: "#f59e0b" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                {products.reduce((sum, p) => sum + p.quantity, 0)}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Total Stock</div>
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
              placeholder="Search products..."
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

      {/* Products Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
        gap: "1.5rem" 
      }}>
        {filteredProducts.map((product) => (
          <div key={product.id} style={{ 
            background: "#fff", 
            borderRadius: 8, 
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
            overflow: "hidden"
          }}>
            {/* Product Image */}
            <div style={{ 
              height: "200px", 
              background: "#f3f4f6", 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative"
            }}>
              {product.images && product.images.length > 0 ? (
                <>
                  <img
                    src={`http://localhost:5000${product.images[0]}`}
                    alt={product.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                  {product.images.length > 1 && (
                    <div style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "rgba(0, 0, 0, 0.7)",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 500
                    }}>
                      +{product.images.length - 1}
                    </div>
                  )}
                </>
              ) : (
                <FaBox style={{ color: "#d1d5db", fontSize: "3rem" }} />
              )}
            </div>

            {/* Product Info */}
            <div style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ 
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.5rem"
                }}>
                  <h3 style={{ 
                    fontSize: "1.125rem", 
                    fontWeight: 600, 
                    color: "#1f2937",
                    lineHeight: 1.4
                  }}>
                    {product.name}
                  </h3>
                  <div style={{ 
                    padding: "0.25rem 0.75rem", 
                    borderRadius: 20, 
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    display: "inline-block",
                    ...getStatusColor(product.product_status)
                  }}>
                    {product.product_status.charAt(0).toUpperCase() + product.product_status.slice(1)}
                  </div>
                </div>
                <p style={{ 
                  fontSize: "0.875rem", 
                  color: "#6b7280", 
                  marginBottom: "0.5rem",
                  lineHeight: 1.5
                }}>
                  {product.description}
                </p>
                <div style={{ 
                  display: "inline-block",
                  padding: "0.25rem 0.75rem",
                  background: "#dbeafe",
                  color: "#1e40af",
                  borderRadius: 20,
                  fontSize: "0.75rem",
                  fontWeight: 500
                }}>
                  {product.category}
                </div>
              </div>

              {/* Price and Stock */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: "1rem"
              }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#10b981" }}>
                  {product.currency || 'NGN'} {formatPriceDisplay(product.price.toString())} {product.price_unit ? `/ ${product.price_unit}` : ''}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Stock: {product.quantity} units
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => toggleProductStatus(product.id)}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    background: product.product_status === 'active' ? "#fee2e2" : "#d1fae5",
                    color: product.product_status === 'active' ? "#dc2626" : "#065f46",
                    border: "none",
                    borderRadius: 6,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  {product.product_status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  style={{
                    padding: "0.5rem",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: 6,
                    fontSize: "0.875rem",
                    cursor: "pointer"
                  }}
                >
                  <FaEdit style={{ fontSize: "0.75rem" }} />
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  style={{
                    padding: "0.5rem",
                    background: "#fee2e2",
                    color: "#ef4444",
                    border: "none",
                    borderRadius: 6,
                    fontSize: "0.875rem",
                    cursor: "pointer"
                  }}
                >
                  <FaTrash style={{ fontSize: "0.75rem" }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "4rem 2rem", 
          background: "#fff", 
          borderRadius: 8, 
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          border: "1px solid #e5e7eb"
        }}>
          <FaBox style={{ fontSize: "4rem", color: "#d1d5db", marginBottom: "1.5rem" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1f2937", marginBottom: "0.5rem" }}>
            {searchTerm || categoryFilter !== "all" ? "No products found" : "No products yet"}
          </h2>
          <p style={{ color: "#6b7280", fontSize: "1rem", marginBottom: "2rem" }}>
            {searchTerm || categoryFilter !== "all" 
              ? "Try adjusting your search or filters" 
              : "Start by adding your first product"
            }
          </p>
          {!searchTerm && categoryFilter === "all" && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                margin: "0 auto"
              }}
            >
              <FaPlus style={{ fontSize: "0.875rem" }} />
              Add Your First Product
            </button>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div style={{
            background: "#fff",
            padding: "2rem",
            borderRadius: 8,
            maxWidth: "600px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1f2937" }}>
                Add New Product
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#6b7280"
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Basic Information */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label htmlFor="name" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: formErrors.name ? "1px solid #dc2626" : "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem"
                    }}
                    placeholder="Enter product name"
                  />
                  {formErrors.name && (
                    <div style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      {formErrors.name}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="category" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: formErrors.category ? "1px solid #dc2626" : "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem",
                      background: "#fff"
                    }}
                  >
                    <option value="">Select a category</option>
                    <option value="Coffee">Coffee</option>
                    <option value="Grains">Grains</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Spices">Spices</option>
                    <option value="Nuts">Nuts</option>
                    <option value="Herbs">Herbs</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.category && (
                    <div style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      {formErrors.category}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Description */}
              <div>
                <label htmlFor="description" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: formErrors.description ? "1px solid #dc2626" : "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: "0.875rem",
                    resize: "vertical"
                  }}
                  placeholder="Describe your product..."
                />
                {formErrors.description && (
                  <div style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                    {formErrors.description}
                  </div>
                )}
              </div>

              {/* Pricing and Quantity */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label htmlFor="price" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Price *
                  </label>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={getDisplayPrice(formData.price)}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: formErrors.price ? "1px solid #dc2626" : "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem"
                    }}
                    placeholder="0.00"
                  />
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                    Enter amount (e.g., 1,250.50 for ₦1,250.50)
                  </div>
                  {formErrors.price && (
                    <div style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      {formErrors.price}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="currency" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Currency *
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem",
                      background: "#fff"
                    }}
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="price_unit" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Price Unit *
                  </label>
                  <select
                    id="price_unit"
                    name="price_unit"
                    value={formData.price_unit}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: formErrors.price_unit ? "1px solid #dc2626" : "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem",
                      background: "#fff"
                    }}
                  >
                    <option value="">Select unit</option>
                    <option value="per_unit">Per Unit</option>
                    <option value="per_kg">Per Kilogram</option>
                    <option value="per_gram">Per Gram</option>
                    <option value="per_lb">Per Pound</option>
                    <option value="per_ton">Per Ton</option>
                    <option value="per_bag">Per Bag</option>
                    <option value="per_box">Per Box</option>
                    <option value="per_crate">Per Crate</option>
                    <option value="per_bundle">Per Bundle</option>
                    <option value="per_piece">Per Piece</option>
                  </select>
                  {formErrors.price_unit && (
                    <div style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      {formErrors.price_unit}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="quantity" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: formErrors.quantity ? "1px solid #dc2626" : "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem"
                    }}
                    placeholder="0"
                  />
                  {formErrors.quantity && (
                    <div style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      {formErrors.quantity}
                    </div>
                  )}
                </div>
              </div>

              {/* Order and Lead Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label htmlFor="min_order_quantity" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Min Order Quantity *
                  </label>
                  <input
                    type="number"
                    id="min_order_quantity"
                    name="min_order_quantity"
                    value={formData.min_order_quantity}
                    onChange={handleInputChange}
                    min="1"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: formErrors.min_order_quantity ? "1px solid #dc2626" : "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem"
                    }}
                    placeholder="1"
                  />
                  {formErrors.min_order_quantity && (
                    <div style={{ color: "#dc2626", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      {formErrors.min_order_quantity}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="lead_time" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Lead Time
                  </label>
                  <input
                    type="text"
                    id="lead_time"
                    name="lead_time"
                    value={formData.lead_time}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem"
                    }}
                    placeholder="e.g., 2-3 weeks"
                  />
                </div>
              </div>

              {/* Origin and Shelf Life */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label htmlFor="origin" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Origin
                  </label>
                  <input
                    type="text"
                    id="origin"
                    name="origin"
                    value={formData.origin}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem"
                    }}
                    placeholder="e.g., Nigeria, Kenya"
                  />
                </div>

                <div>
                  <label htmlFor="shelf_life" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Shelf Life
                  </label>
                  <input
                    type="text"
                    id="shelf_life"
                    name="shelf_life"
                    value={formData.shelf_life}
                    onChange={handleInputChange}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem"
                    }}
                    placeholder="e.g., 12 months"
                  />
                </div>
              </div>

              {/* Specifications and Compliance */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label htmlFor="specifications" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Specifications
                  </label>
                  <textarea
                    id="specifications"
                    name="specifications"
                    value={formData.specifications}
                    onChange={handleInputChange}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem",
                      resize: "vertical"
                    }}
                    placeholder="Product specifications..."
                  />
                </div>

                <div>
                  <label htmlFor="export_compliance" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                    Export Compliance
                  </label>
                  <textarea
                    id="export_compliance"
                    name="export_compliance"
                    value={formData.export_compliance}
                    onChange={handleInputChange}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: "0.875rem",
                      resize: "vertical"
                    }}
                    placeholder="Export compliance details..."
                  />
                </div>
              </div>

              {/* Packaging */}
              <div>
                <label htmlFor="packaging" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                  Packaging
                </label>
                <textarea
                  id="packaging"
                  name="packaging"
                  value={formData.packaging}
                  onChange={handleInputChange}
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: "0.875rem",
                    resize: "vertical"
                  }}
                  placeholder="Packaging details..."
                />
              </div>

              {/* Product Images */}
              <div>
                <label htmlFor="images" style={{ display: "block", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                  Product Images
                </label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: "0.875rem"
                  }}
                />
                <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                  Upload high-quality images of your product (multiple images allowed)
                </div>
                
                {/* Display selected images */}
                {formData.images.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151", marginBottom: "0.5rem" }}>
                      Selected Images ({formData.images.length})
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.5rem" }}>
                      {formData.images.map((image, index) => (
                        <div key={index} style={{ position: "relative" }}>
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Product ${index + 1}`}
                            style={{
                              width: "100%",
                              height: "100px",
                              objectFit: "cover",
                              borderRadius: 6,
                              border: "1px solid #e5e7eb"
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            style={{
                              position: "absolute",
                              top: "-8px",
                              right: "-8px",
                              background: "#ef4444",
                              color: "#fff",
                              border: "none",
                              borderRadius: "50%",
                              width: "20px",
                              height: "20px",
                              fontSize: "12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#6b7280",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: submitting ? "#9ca3af" : "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontWeight: 500
                  }}
                >
                  {submitting ? "Adding..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 