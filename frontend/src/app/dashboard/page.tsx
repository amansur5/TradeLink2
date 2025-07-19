"use client";
import { useState, useEffect } from "react";
import { FaBoxOpen, FaClipboardList, FaEnvelopeOpenText, FaChartBar, FaShieldAlt, FaUserCircle, FaBell, FaMoneyCheckAlt, FaLink, FaHeadset } from "react-icons/fa";

const SIDEBAR_LINKS = [
  { key: "products", label: "Products", icon: <FaBoxOpen /> },
  { key: "orders", label: "Orders", icon: <FaClipboardList /> },
  { key: "inquiries", label: "Inquiries", icon: <FaEnvelopeOpenText /> },
  { key: "analytics", label: "Analytics", icon: <FaChartBar /> },
  { key: "compliance", label: "Compliance", icon: <FaShieldAlt /> },
  { key: "account", label: "Account", icon: <FaUserCircle /> },
  { key: "notifications", label: "Notifications", icon: <FaBell /> },
  { key: "finance", label: "Finance", icon: <FaMoneyCheckAlt /> },
  { key: "blockchain", label: "Blockchain", icon: <FaLink /> },
  { key: "support", label: "Support", icon: <FaHeadset /> },
];

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("products");
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    price_unit: "KG",
    quantity: "",
    category: "",
    certifications: "",
    shipping: "",
    images: [],
    tags: "",
    specifications: "",
    compliance: ""
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const previews: string[] = [];
      const fileArr: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        fileArr.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          if (previews.length === files.length) {
            setImagePreviews([...previews]);
          }
        };
        reader.readAsDataURL(file);
      }
      setImageFiles(fileArr);
    }
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

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowAddModal(false);
    setSuccessMsg("Product added successfully (mock, connect to API for real data)");
    setTimeout(() => setSuccessMsg(""), 3000);
    setForm({
      name: "",
      description: "",
      price: "",
      price_unit: "KG",
      quantity: "",
      category: "",
      certifications: "",
      shipping: "",
      images: [],
      tags: "",
      specifications: "",
      compliance: ""
    });
    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.url) imageUrls.push(data.url);
      }
    }
    const productData = {
      ...form,
      main_image_url: imageUrls[0] || '',
      images: imageUrls,
      specifications: parseSpecifications(form.specifications),
    };
    // Call your product creation API here (e.g., apiService.createProduct(productData))
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f8' }}>
      <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: '2rem 0', position: 'sticky', top: 0, minHeight: '100vh' }}>
        <div style={{ fontWeight: 700, fontSize: '1.5rem', color: '#0070f3', textAlign: 'center', marginBottom: 32 }}>TradeLink</div>
        <nav style={{ flex: 1 }}>
          {SIDEBAR_LINKS.map(link => (
            <button
              key={link.key}
              onClick={() => setActiveSection(link.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                width: '100%',
                padding: '0.9rem 2rem',
                background: activeSection === link.key ? '#f0f4ff' : 'none',
                color: activeSection === link.key ? '#0070f3' : '#333',
                border: 'none',
                borderLeft: activeSection === link.key ? '4px solid #0070f3' : '4px solid transparent',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                marginBottom: 2,
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{link.icon}</span> {link.label}
            </button>
          ))}
        </nav>
        <div style={{ textAlign: 'center', fontSize: '0.95rem', color: '#aaa', marginTop: 32 }}>Producer Dashboard</div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: 64, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#333' }}>Welcome, Producer</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <button style={{ background: 'none', border: 'none', color: '#0070f3', fontSize: '1.3rem', cursor: 'pointer' }} title="Notifications"><FaBell /></button>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#333' }}><FaUserCircle /> Producer</span>
          </div>
        </header>
        <div style={{ flex: 1, padding: '2rem 2vw', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          {activeSection === "products" && (
            <div style={{ maxWidth: 900, margin: '2rem auto', padding: '2rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1>Products Section</h1>
                <button
                  style={{ padding: '0.7rem 1.5rem', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
                  onClick={() => setShowAddModal(true)}
                >
                  + Add Product
                </button>
              </div>
              {successMsg && (
                <div style={{ background: '#d1fae5', color: '#065f46', padding: '0.75rem 1rem', borderRadius: 6, marginBottom: 16, fontWeight: 500 }}>{successMsg}</div>
              )}
              {showAddModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>
                  <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxWidth: 600, width: '100%', padding: 0, position: 'relative', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem 1rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Add New Product</h2>
                      <button onClick={() => setShowAddModal(false)} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 28, color: '#6b7280', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }} onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>&times;</button>
                    </div>
                    {/* Modal Body */}
                    <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 28, padding: '2rem', background: '#fff', maxHeight: '80vh', overflowY: 'auto' }}>
                      {/* Basic Info */}
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: 12 }}>Basic Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <label htmlFor="product-name" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Product Name *</label>
                            <input id="product-name" name="name" value={form.name} onChange={handleInputChange} placeholder="e.g. Nigerian Cocoa Beans" required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                          </div>
                          <div>
                            <label htmlFor="product-category" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Category</label>
                            <input id="product-category" name="category" value={form.category} onChange={handleInputChange} placeholder="e.g. Spices, Grains" style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                          </div>
                        </div>
                        <div style={{ marginTop: 16 }}>
                          <label htmlFor="product-description" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Description *</label>
                          <textarea id="product-description" name="description" value={form.description} onChange={handleInputChange} placeholder="Describe your product in detail..." required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem', minHeight: 80, resize: 'vertical' }} />
                        </div>
                      </div>
                      {/* Pricing & Inventory */}
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: 12 }}>Pricing & Inventory</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <label htmlFor="product-price" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Price *</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input id="product-price" name="price" value={form.price} onChange={handleInputChange} placeholder="0.00" type="number" required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                              <select name="price_unit" value={form.price_unit} onChange={handleInputChange} style={{ padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem', minWidth: 80 }}>
                                <option value="KG">per KG</option>
                                <option value="TON">per Ton</option>
                                <option value="CARTON">per Carton</option>
                                <option value="BAG">per Bag</option>
                                <option value="LITRE">per Litre</option>
                                <option value="PIECE">per Piece</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label htmlFor="product-quantity" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Available Quantity *</label>
                            <input id="product-quantity" name="quantity" value={form.quantity} onChange={handleInputChange} placeholder="0" type="number" required style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                          </div>
                        </div>
                      </div>
                      {/* Logistics & Certifications */}
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: 12 }}>Logistics & Certifications</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <label htmlFor="product-certifications" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Certifications</label>
                            <input id="product-certifications" name="certifications" value={form.certifications} onChange={handleInputChange} placeholder="e.g. Organic, ISO 9001" style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                          </div>
                          <div>
                            <label htmlFor="product-shipping" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Shipping Options</label>
                            <input id="product-shipping" name="shipping" value={form.shipping} onChange={handleInputChange} placeholder="e.g. Air, Sea, Express" style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                          </div>
                        </div>
                      </div>
                      {/* Tags & Specifications */}
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: 12 }}>Tags & Specifications</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                          <div>
                            <label htmlFor="product-tags" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Tags</label>
                            <input id="product-tags" name="tags" value={form.tags} onChange={handleInputChange} placeholder="e.g. premium, organic, bulk" style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem' }} />
                          </div>
                          <div>
                            <label htmlFor="product-specifications" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: 6 }}>Specifications</label>
                            <textarea id="product-specifications" name="specifications" value={form.specifications} onChange={handleInputChange} placeholder="key: value, one per line" style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem', minHeight: 60, resize: 'vertical' }} />
                          </div>
                        </div>
                      </div>
                      {/* Compliance */}
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: 12 }}>Export Compliance / International Standards</h3>
                        <textarea id="product-compliance" name="compliance" value={form.compliance} onChange={handleInputChange} placeholder="e.g. Meets EU/US export standards" style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #d1d5db', fontSize: '1rem', minHeight: 40, resize: 'vertical' }} />
                      </div>
                      {/* Images (mock) */}
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: 12 }}>Product Images</h3>
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} />
                        {imagePreviews.length > 0 && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            {imagePreviews.map((src, idx) => (
                              <img key={idx} src={src} alt="Preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }} />
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                        <button type="button" onClick={() => setShowAddModal(false)} style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, padding: '12px 24px', cursor: 'pointer', fontWeight: 500, fontSize: '1rem' }}>Cancel</button>
                        <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 24px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>Add Product</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <p>This is a minimal working dashboard. Add your product management UI here.</p>
            </div>
          )}
          {activeSection === "inquiries" && (
            <div style={{ maxWidth: 900, margin: '2rem auto', padding: '2rem 1rem' }}>
              <h1>Inquiries Section</h1>
              <p>This is a minimal working dashboard. Add your inquiries UI here.</p>
            </div>
          )}
          {activeSection === "orders" && (
            <section><h1>Orders</h1><p>Order management coming soon.</p></section>
          )}
          {activeSection === "analytics" && (
            <section><h1>Analytics</h1><p>Sales and product analytics coming soon.</p></section>
          )}
          {activeSection === "compliance" && (
            <section><h1>Compliance</h1><p>Compliance and trust features coming soon.</p></section>
          )}
          {activeSection === "account" && (
            <section><h1>Account</h1><p>Account management coming soon.</p></section>
          )}
          {activeSection === "notifications" && (
            <section><h1>Notifications</h1><p>Notifications center coming soon.</p></section>
          )}
          {activeSection === "finance" && (
            <section><h1>Finance</h1><p>Trade finance and payouts coming soon.</p></section>
          )}
          {activeSection === "blockchain" && (
            <section><h1>Blockchain</h1><p>Blockchain tracking coming soon.</p></section>
          )}
          {activeSection === "support" && (
            <section><h1>Support</h1><p>Live support and help center coming soon.</p></section>
          )}
        </div>
      </div>
    </div>
  );
} 