"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiService } from "@/services/api";
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaPhone, FaGlobe, FaMapMarkerAlt } from 'react-icons/fa';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    user_type: "buyer" as "buyer" | "producer",
    first_name: "",
    last_name: "",
    company_name: "",
    phone: "",
    address: "",
    country: "",
    city: "",
    postal_code: "",
    // Bank details (required for producers)
    bank_name: "",
    account_name: "",
    account_number: "",
    bank_code: "",
    swift_code: "",
    routing_number: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [inlineErrors, setInlineErrors] = useState<{ [key: string]: string }>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // Validate bank details for producers
    if (formData.user_type === 'producer') {
      if (!formData.bank_name || !formData.account_name || !formData.account_number) {
        setError("Bank name, account name, and account number are required for producers");
        return;
      }
      
      if (formData.account_number.length < 10) {
        setError("Account number must be at least 10 digits");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await apiService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        user_type: formData.user_type,
        first_name: formData.first_name,
        last_name: formData.last_name,
        company_name: formData.company_name || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        country: formData.country || undefined,
        city: formData.city || undefined,
        postal_code: formData.postal_code || undefined,
        // Bank details (required for producers)
        bank_name: formData.user_type === 'producer' ? formData.bank_name : undefined,
        account_name: formData.user_type === 'producer' ? formData.account_name : undefined,
        account_number: formData.user_type === 'producer' ? formData.account_number : undefined,
        bank_code: formData.user_type === 'producer' ? formData.bank_code : undefined,
        swift_code: formData.user_type === 'producer' ? formData.swift_code : undefined,
        routing_number: formData.user_type === 'producer' ? formData.routing_number : undefined
      });
      
      // Store user info in localStorage for UI state
      localStorage.setItem('user', JSON.stringify({
        id: response.user.id,
        name: `${response.user.first_name} ${response.user.last_name}`,
        type: response.user.user_type,
        email: response.user.email,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        company_name: response.user.company_name,
        phone: response.user.phone,
        address: response.user.address,
        city: response.user.city,
        state: response.user.state,
        postal_code: response.user.postal_code,
        country: response.user.country
      }));
      
      // Redirect based on user type
      if (response.user.user_type === 'producer') {
        router.push('/dashboard/producer');
      } else {
        router.push('/dashboard/buyer');
      }
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('already exists')) {
        setError('Username or email already exists. Please use a different one.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setInlineErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'password') {
      // Simple password strength: 0-4
      let score = 0;
      if (value.length >= 6) score++;
      if (/[A-Z]/.test(value)) score++;
      if (/[0-9]/.test(value)) score++;
      if (/[^A-Za-z0-9]/.test(value)) score++;
      setPasswordStrength(score);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1rem' }}>
      <div style={{ background: '#fff', padding: '2rem', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>Create Account</h1>
          <p style={{ color: '#6b7280' }}>Join TradeLink to connect with global markets</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Account Info Section */}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Account Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label htmlFor="username" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Username *
              </label>
              <div style={{ position: 'relative' }}>
                <FaUser style={{ position: 'absolute', left: 10, top: 14, color: '#9ca3af' }} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: 6,
                    border: inlineErrors.username ? '1.5px solid #dc2626' : '1px solid #d1d5db',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Choose a username"
                  aria-invalid={!!inlineErrors.username}
                />
              </div>
              {inlineErrors.username && <div style={{ color: '#dc2626', fontSize: '0.95rem', marginTop: 2 }}>{inlineErrors.username}</div>}
            </div>
            <div>
              <label htmlFor="user_type" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Account Type *
              </label>
              <select
                id="user_type"
                name="user_type"
                required
                value={formData.user_type}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              >
                <option value="buyer">International Buyer</option>
                <option value="producer">Nigerian Producer</option>
              </select>
            </div>
          </div>
          {/* Personal Info Section */}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Personal Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label htmlFor="first_name" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                First Name *
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                value={formData.first_name}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 6,
                  border: inlineErrors.first_name ? '1.5px solid #dc2626' : '1px solid #d1d5db',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter first name"
                aria-invalid={!!inlineErrors.first_name}
              />
              {inlineErrors.first_name && <div style={{ color: '#dc2626', fontSize: '0.95rem', marginTop: 2 }}>{inlineErrors.first_name}</div>}
            </div>
            <div>
              <label htmlFor="last_name" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Last Name *
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                value={formData.last_name}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 6,
                  border: inlineErrors.last_name ? '1.5px solid #dc2626' : '1px solid #d1d5db',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter last name"
                aria-invalid={!!inlineErrors.last_name}
              />
              {inlineErrors.last_name && <div style={{ color: '#dc2626', fontSize: '0.95rem', marginTop: 2 }}>{inlineErrors.last_name}</div>}
            </div>
          </div>
          {/* Contact Info Section (show for both types) */}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Contact Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope style={{ position: 'absolute', left: 10, top: 14, color: '#9ca3af' }} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: 6,
                    border: inlineErrors.email ? '1.5px solid #dc2626' : '1px solid #d1d5db',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter your email"
                  aria-invalid={!!inlineErrors.email}
                />
              </div>
              {inlineErrors.email && <div style={{ color: '#dc2626', fontSize: '0.95rem', marginTop: 2 }}>{inlineErrors.email}</div>}
            </div>
            <div>
              <label htmlFor="phone" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Phone
              </label>
              <div style={{ position: 'relative' }}>
                <FaPhone style={{ position: 'absolute', left: 10, top: 14, color: '#9ca3af' }} />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>
          {/* Password Section */}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Set Password</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label htmlFor="password" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{ position: 'absolute', left: 10, top: 14, color: '#9ca3af' }} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: 6,
                    border: inlineErrors.password ? '1.5px solid #dc2626' : '1px solid #d1d5db',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Create a password"
                  aria-invalid={!!inlineErrors.password}
                />
              </div>
              {/* Password strength meter */}
              <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, marginTop: 6, marginBottom: 2 }}>
                <div style={{ width: `${(passwordStrength / 4) * 100}%`, height: '100%', background: passwordStrength < 2 ? '#f87171' : passwordStrength < 3 ? '#fbbf24' : '#10b981', borderRadius: 3, transition: 'width 0.2s' }} />
              </div>
              <div style={{ fontSize: '0.92rem', color: passwordStrength < 2 ? '#f87171' : passwordStrength < 3 ? '#fbbf24' : '#10b981' }}>
                {passwordStrength < 2 ? 'Weak' : passwordStrength < 3 ? 'Medium' : 'Strong'}
              </div>
              {inlineErrors.password && <div style={{ color: '#dc2626', fontSize: '0.95rem', marginTop: 2 }}>{inlineErrors.password}</div>}
            </div>
            <div>
              <label htmlFor="confirmPassword" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 6,
                  border: inlineErrors.confirmPassword ? '1.5px solid #dc2626' : '1px solid #d1d5db',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Re-enter password"
                aria-invalid={!!inlineErrors.confirmPassword}
              />
              {inlineErrors.confirmPassword && <div style={{ color: '#dc2626', fontSize: '0.95rem', marginTop: 2 }}>{inlineErrors.confirmPassword}</div>}
            </div>
          </div>
          {/* Company Info Section (only for producers) */}
          {formData.user_type === 'producer' && (
            <>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Company Information</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label htmlFor="company_name" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Company Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FaBuilding style={{ position: 'absolute', left: 10, top: 14, color: '#9ca3af' }} />
                    <input
                      id="company_name"
                      name="company_name"
                      type="text"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        fontSize: '1rem',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Enter company name"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Bank Details Section (only for producers) */}
          {formData.user_type === 'producer' && (
            <>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Bank Details <span style={{ color: '#dc2626' }}>*</span></h2>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
                Bank details are required for receiving payments from buyers
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label htmlFor="bank_name" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Bank Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="bank_name"
                    name="bank_name"
                    type="text"
                    required={formData.user_type === 'producer'}
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 6,
                      border: inlineErrors.bank_name ? '1.5px solid #dc2626' : '1px solid #d1d5db',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., First Bank, GT Bank, Zenith Bank"
                    aria-invalid={!!inlineErrors.bank_name}
                  />
                  {inlineErrors.bank_name && <div style={{ color: '#dc2626', fontSize: '0.95rem', marginTop: 2 }}>{inlineErrors.bank_name}</div>}
                </div>
                <div>
                  <label htmlFor="account_name" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Account Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="account_name"
                    name="account_name"
                    type="text"
                    required={formData.user_type === 'producer'}
                    value={formData.account_name}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 6,
                      border: inlineErrors.account_name ? '1.5px solid #dc2626' : '1px solid #d1d5db',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Name on bank account"
                    aria-invalid={!!inlineErrors.account_name}
                  />
                  {inlineErrors.account_name && <div style={{ color: '#dc2626', fontSize: '0.95rem', marginTop: 2 }}>{inlineErrors.account_name}</div>}
                </div>
                <div>
                  <label htmlFor="account_number" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Account Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    id="account_number"
                    name="account_number"
                    type="text"
                    required={formData.user_type === 'producer'}
                    value={formData.account_number}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 6,
                      border: inlineErrors.account_number ? '1.5px solid #dc2626' : '1px solid #d1d5db',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="10-digit account number"
                    aria-invalid={!!inlineErrors.account_number}
                  />
                  {inlineErrors.account_number && <div style={{ color: '#dc2626', fontSize: '0.95rem', marginTop: 2 }}>{inlineErrors.account_number}</div>}
                </div>
                <div>
                  <label htmlFor="bank_code" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Bank Code
                  </label>
                  <input
                    id="bank_code"
                    name="bank_code"
                    type="text"
                    value={formData.bank_code}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., 011, 044, 057"
                  />
                </div>
                <div>
                  <label htmlFor="swift_code" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    SWIFT Code
                  </label>
                  <input
                    id="swift_code"
                    name="swift_code"
                    type="text"
                    value={formData.swift_code}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="e.g., FBNINGL, GTBINGL"
                  />
                </div>
                <div>
                  <label htmlFor="routing_number" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Routing Number
                  </label>
                  <input
                    id="routing_number"
                    name="routing_number"
                    type="text"
                    value={formData.routing_number}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Bank routing number"
                  />
                </div>
              </div>
            </>
          )}
          {/* Address Section */}
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>Address</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div>
              <label htmlFor="country" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Country
              </label>
              <div style={{ position: 'relative' }}>
                <FaGlobe style={{ position: 'absolute', left: 10, top: 14, color: '#9ca3af' }} />
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter country"
                />
              </div>
            </div>
            <div>
              <label htmlFor="city" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                City
              </label>
              <div style={{ position: 'relative' }}>
                <FaMapMarkerAlt style={{ position: 'absolute', left: 10, top: 14, color: '#9ca3af' }} />
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter city"
                />
              </div>
            </div>
            <div>
              <label htmlFor="address" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter address"
              />
            </div>
            <div>
              <label htmlFor="postal_code" style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                Postal Code
              </label>
              <input
                id="postal_code"
                name="postal_code"
                type="text"
                value={formData.postal_code}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter postal code"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#2563eb',
              color: '#fff',
              padding: '0.9rem',
              borderRadius: 8,
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 12,
              boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10
            }}
            aria-busy={loading}
          >
            {loading && <span className="spinner" style={{ width: 18, height: 18, border: '2.5px solid #fff', borderTop: '2.5px solid #2563eb', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: '#6b7280' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 