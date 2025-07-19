"use client";
import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:5000";

function Spinner() {
  return <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ width: 32, height: 32, border: '4px solid #e5e7eb', borderTop: '4px solid #0070f3', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderSearch, setOrderSearch] = useState("");

  const orderBuyerIdRef = useRef<HTMLInputElement>(null);
  const orderStartDateRef = useRef<HTMLInputElement>(null);
  const orderEndDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(order =>
      order.buyer_username.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.buyer_email.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.product_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.status.toLowerCase().includes(orderSearch.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [orders, orderSearch]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
      setOrders(data);
      setFilteredOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderFilter = () => {
    const buyerId = orderBuyerIdRef.current?.value;
    const startDate = orderStartDateRef.current?.value;
    const endDate = orderEndDateRef.current?.value;
    
    let filtered = orders;
    if (buyerId) filtered = filtered.filter(o => o.buyer_id === parseInt(buyerId));
    if (startDate) filtered = filtered.filter(o => o.created_at >= startDate);
    if (endDate) filtered = filtered.filter(o => o.created_at <= endDate);
    
    setFilteredOrders(filtered);
  };

  const handleOrderExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Buyer,Product,Quantity,Total Amount,Status,Payment Status,Created At\n" +
      filteredOrders.map(o => `${o.id},${o.buyer_username} (${o.buyer_email}),${o.product_name},${o.quantity},${o.total_amount},${o.status},${o.payment_status},${o.created_at}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <Spinner />;
  if (error) return <div style={{ color: "red", padding: 32 }}>{error}</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: '#1f2937' }}>Order Management</h1>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>All Orders</h2>
      </div>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input ref={orderBuyerIdRef} type="number" placeholder="Buyer ID" style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db', width: 120 }} />
        <input ref={orderStartDateRef} type="date" style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        <input ref={orderEndDateRef} type="date" style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        <button onClick={handleOrderFilter} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Filter</button>
        <button onClick={handleOrderExport} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>Export CSV</button>
      </div>
      
      <input type="text" placeholder="Search orders..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} style={{ marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #d1d5db', width: 300 }} />
      
      <div style={{ overflowX: 'auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: '#fff' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: 12 }}>ID</th>
              <th>Buyer</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o: any, idx: number) => (
              <tr key={o.id} style={{ background: idx % 2 === 0 ? '#f9fafb' : '#fff', transition: 'background 0.2s' }}>
                <td style={{ padding: 12 }}>{o.id}</td>
                <td>{o.buyer_username} ({o.buyer_email})</td>
                <td>{o.product_name}</td>
                <td>{o.quantity}</td>
                <td>{o.total_amount}</td>
                <td>
                  <span style={{ 
                    background: o.status === 'completed' ? '#d1fae5' : o.status === 'pending' ? '#fef3c7' : '#fee2e2',
                    color: o.status === 'completed' ? '#059669' : o.status === 'pending' ? '#d97706' : '#dc2626',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500
                  }}>
                    {o.status}
                  </span>
                </td>
                <td>
                  <span style={{ 
                    background: o.payment_status === 'paid' ? '#d1fae5' : '#fee2e2',
                    color: o.payment_status === 'paid' ? '#059669' : '#dc2626',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500
                  }}>
                    {o.payment_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 