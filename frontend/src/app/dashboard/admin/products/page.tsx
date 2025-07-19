"use client";
import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:5000";

function Spinner() {
  return <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ width: 32, height: 32, border: '4px solid #e5e7eb', borderTop: '4px solid #0070f3', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const productProducerIdRef = useRef<HTMLInputElement>(null);
  const productStartDateRef = useRef<HTMLInputElement>(null);
  const productEndDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      (product.producer_company && product.producer_company.toLowerCase().includes(productSearch.toLowerCase())) ||
      (product.producer_username && product.producer_username.toLowerCase().includes(productSearch.toLowerCase()))
    );
    setFilteredProducts(filtered);
  }, [products, productSearch]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch products');
      setProducts(data);
      setFilteredProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleProductFilter = () => {
    const producerId = productProducerIdRef.current?.value;
    const startDate = productStartDateRef.current?.value;
    const endDate = productEndDateRef.current?.value;
    
    let filtered = products;
    if (producerId) filtered = filtered.filter(p => p.producer_id === parseInt(producerId));
    if (startDate) filtered = filtered.filter(p => p.created_at >= startDate);
    if (endDate) filtered = filtered.filter(p => p.created_at <= endDate);
    
    setFilteredProducts(filtered);
  };

  const handleProductExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Name,Producer,Category,Price,Price Unit,Description,Created At\n" +
      filteredProducts.map(p => `${p.id},${p.name},${p.producer_company || p.producer_username},${p.category},${p.price},${p.price_unit},${p.description || ''},${p.created_at}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <Spinner />;
  if (error) return <div style={{ color: "red", padding: 32 }}>{error}</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: '#1f2937' }}>Product Management</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>All Products</h2>
      </div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input ref={productProducerIdRef} type="number" placeholder="Producer ID" style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db', width: 120 }} />
        <input ref={productStartDateRef} type="date" style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        <input ref={productEndDateRef} type="date" style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        <button onClick={handleProductFilter} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Filter</button>
        <button onClick={handleProductExport} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Export CSV</button>
      </div>
      
      <input type="text" placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} style={{ marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #d1d5db', width: 300 }} />
      
      <div style={{ overflowX: 'auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: '#fff' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: 12 }}>ID</th>
              <th>Name</th>
              <th>Producer</th>
              <th>Category</th>
              <th>Price</th>
              <th>Images</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p: any, idx: number) => (
              <tr key={p.id} style={{ background: idx % 2 === 0 ? '#f9fafb' : '#fff', transition: 'background 0.2s' }}>
                <td style={{ padding: 12 }}>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.producer_company || p.producer_username}</td>
                <td>{p.category}</td>
                <td>{p.price} {p.price_unit}</td>
                <td>{p.images && p.images.length > 0 && p.images.map((img: string, idx: number) => <img key={idx} src={img} alt="img" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, marginRight: 4 }} />)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 