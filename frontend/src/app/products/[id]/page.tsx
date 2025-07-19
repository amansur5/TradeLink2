"use client";
import { useState } from "react";
import { Product } from '@/services/api';
import Link from 'next/link';
import { useParams } from "next/navigation";

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Nigerian Cocoa Beans',
    description: 'Premium quality cocoa beans sourced from local Nigerian farms.',
    price: 120000,
    price_unit: 'Ton',
    quantity: 50,
    category: 'Cocoa',
    main_image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    min_order_quantity: 1,
    lead_time: '2 weeks',
    origin: 'Nigeria',
    export_compliance: 'EU Organic',
    packaging: 'Jute Bags',
    shelf_life: '12 months',
    product_status: 'active',
    producer: { id: 1, company_name: 'Naija Agro', country: 'Nigeria', city: 'Lagos' },
    images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80'
    ],
    certifications: ['EU Organic', 'Fairtrade'],
    shipping_options: ['Sea', 'Air'],
    tags: ['Cocoa', 'Beans'],
    specifications: { Moisture: '<7%', Grade: 'A' },
    created_at: '2024-07-01T12:00:00Z',
  },
  {
    id: 2,
    name: 'Shea Butter',
    description: 'Raw, organic shea butter perfect for cosmetics and skincare.',
    price: 35000,
    price_unit: 'KG',
    quantity: 200,
    category: 'Shea',
    main_image_url: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80',
    min_order_quantity: 10,
    lead_time: '1 week',
    origin: 'Nigeria',
    export_compliance: 'USDA Organic',
    packaging: 'Plastic Drums',
    shelf_life: '24 months',
    product_status: 'active',
    producer: { id: 2, company_name: 'Shea Exports', country: 'Nigeria', city: 'Abuja' },
    images: [
      'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80'
    ],
    certifications: ['USDA Organic'],
    shipping_options: ['Air'],
    tags: ['Shea', 'Butter'],
    specifications: { Purity: '100%' },
    created_at: '2024-07-01T12:00:00Z',
  },
  {
    id: 3,
    name: 'Dried Hibiscus Flowers',
    description: 'Sun-dried hibiscus flowers for teas and beverages.',
    price: 18000,
    price_unit: 'KG',
    quantity: 100,
    category: 'Hibiscus',
    main_image_url: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
    min_order_quantity: 5,
    lead_time: '10 days',
    origin: 'Nigeria',
    export_compliance: 'NOP Organic',
    packaging: 'Cartons',
    shelf_life: '18 months',
    product_status: 'active',
    producer: { id: 3, company_name: 'Hibiscus Farms', country: 'Nigeria', city: 'Kano' },
    images: [
      'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80'
    ],
    certifications: ['NOP Organic'],
    shipping_options: ['Sea', 'Air'],
    tags: ['Hibiscus', 'Flowers'],
    specifications: { Color: 'Red', Moisture: '<10%' },
    created_at: '2024-07-01T12:00:00Z',
  },
  {
    id: 4,
    name: 'Palm Oil',
    description: 'High-quality, locally produced palm oil for export.',
    price: 9000,
    price_unit: 'Litre',
    quantity: 500,
    category: 'Palm Oil',
    main_image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
    min_order_quantity: 20,
    lead_time: '1 week',
    origin: 'Nigeria',
    export_compliance: 'ISO 22000',
    packaging: 'Jerrycans',
    shelf_life: '12 months',
    product_status: 'active',
    producer: { id: 4, company_name: 'Palm Oil Co', country: 'Nigeria', city: 'Benin' },
    images: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80'
    ],
    certifications: ['ISO 22000'],
    shipping_options: ['Sea'],
    tags: ['Palm', 'Oil'],
    specifications: { Purity: '99%' },
    created_at: '2024-07-01T12:00:00Z',
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const product = mockProducts.find((p) => p.id === Number(params.id));
  const [showInquiry, setShowInquiry] = useState(false);

  if (!product) {
    return <div style={{ textAlign: 'center', padding: '4rem 0' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
        {/* Images Gallery */}
        <div style={{ flex: '1 1 340px', minWidth: 320, maxWidth: 420 }}>
          <div style={{ background: '#f3f4f6', borderRadius: 14, overflow: 'hidden', marginBottom: 18 }}>
            <img src={product.main_image_url || product.images[0] || '/placeholder-product.jpg'} alt={product.name} style={{ width: '100%', height: 320, objectFit: 'cover', borderRadius: 14 }} />
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {product.images.slice(1, 5).map((img, idx) => (
                <img key={idx} src={img} alt='' style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, background: '#e5e7eb' }} />
              ))}
            </div>
          )}
        </div>
        {/* Product Info */}
        <div style={{ flex: '2 1 400px', minWidth: 320 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>{product.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0070f3' }}>₦{product.price.toLocaleString()}</span>
            <span style={{ fontSize: '1.1rem', color: '#374151', fontWeight: 500 }}>/ {product.price_unit || 'unit'}</span>
            <span style={{ fontSize: '1rem', color: '#6b7280' }}>Qty: {product.quantity}</span>
            {product.producer?.country && (
              <span style={{ background: '#2563eb', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: 12, fontSize: '0.95rem', fontWeight: 600 }}>{product.producer.country}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {product.certifications.map(cert => (
              <span key={cert} style={{ background: '#10b981', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: 12, fontSize: '0.95rem', fontWeight: 600 }}>{cert}</span>
            ))}
            {product.tags && product.tags.map(tag => (
              <span key={tag} style={{ background: '#f3f4f6', color: '#374151', padding: '0.25rem 0.75rem', borderRadius: 12, fontSize: '0.95rem', fontWeight: 500 }}>{tag}</span>
            ))}
          </div>
          <p style={{ color: '#374151', fontSize: '1.1rem', marginBottom: 18 }}>{product.description}</p>
          {/* Specifications & Compliance */}
          <div style={{ marginBottom: 18 }}>
            {product.specifications && (
              <div style={{ marginBottom: 10 }}>
                <strong>Specifications:</strong>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <li key={key} style={{ color: '#4b5563', fontSize: '1rem' }}>{key}: {value}</li>
                  ))}
                </ul>
              </div>
            )}
            {product.export_compliance && (
              <div>
                <strong>Compliance:</strong> <span style={{ color: '#4b5563', fontSize: '1rem' }}>{product.export_compliance}</span>
              </div>
            )}
          </div>
          {/* Producer Info */}
          {product.producer && (
            <div style={{ marginBottom: 18, background: '#f9fafb', borderRadius: 10, padding: '1rem 1.5rem' }}>
              <strong>Producer:</strong> {product.producer.company_name}<br />
              <span style={{ color: '#6b7280', fontSize: '0.95rem' }}>{product.producer.country}</span>
            </div>
          )}
          {/* Inquiry & Cart */}
          <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
            <button onClick={() => setShowInquiry(true)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(37,99,235,0.08)' }}>Send Inquiry</button>
            <button style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '0.75rem 2rem', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(16,185,129,0.08)' }}>Add to Cart</button>
          </div>
        </div>
      </div>
      {/* Inquiry Modal */}
      {showInquiry && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', minWidth: 340, maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: 16 }}>Send Inquiry</h2>
            <textarea placeholder='Type your inquiry...' style={{ width: '100%', minHeight: 80, borderRadius: 8, border: '1px solid #d1d5db', marginBottom: 16, padding: 8 }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowInquiry(false)} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, padding: '0.5rem 1.5rem', fontWeight: 600 }}>Cancel</button>
              <button style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.5rem', fontWeight: 600 }}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 