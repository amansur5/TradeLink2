"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiService } from "@/services/api";
import { FaUniversity, FaEdit, FaTrash, FaCheck, FaPlus, FaTimes } from "react-icons/fa";
import React from "react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    password: "",
    confirmPassword: ""
  });
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [bankDetails, setBankDetails] = useState<any[]>([]);
  const [editingBank, setEditingBank] = useState<number | null>(null);
  const [newBankForm, setNewBankForm] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    bank_code: "",
    swift_code: "",
    routing_number: ""
  });
  const [showNewBankForm, setShowNewBankForm] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankModalContent, setBankModalContent] = useState({ success: false, message: "" });
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setForm(f => ({
        ...f,
        first_name: userData.first_name || "",
        last_name: userData.last_name || ""
      }));
      
      // Load bank details if user is a producer
      if (userData.type === 'producer' || userData.user_type === 'producer') {
        loadBankDetails();
      }
    }
  }, []);

  const loadBankDetails = async () => {
    try {
      const response = await apiService.getProducerBankDetails();
      setBankDetails(response.detailed_bank_details || []);
    } catch (err) {
      console.error('Failed to load bank details:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleBankFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewBankForm(f => ({ ...f, [name]: value }));
  };

  const handleAddBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankForm.bank_name || !newBankForm.account_name || !newBankForm.account_number) {
      setBankModalContent({ success: false, message: "Bank name, account name, and account number are required" });
      setShowBankModal(true);
      return;
    }

    try {
      await apiService.addProducerBankDetails(newBankForm);
      setBankModalContent({ success: true, message: "Bank details added successfully!" });
      setShowBankModal(true);
      setNewBankForm({
        bank_name: "",
        account_name: "",
        account_number: "",
        bank_code: "",
        swift_code: "",
        routing_number: ""
      });
      setShowNewBankForm(false);
      loadBankDetails();
    } catch (err: any) {
      setBankModalContent({ success: false, message: err.message || "Failed to add bank details" });
      setShowBankModal(true);
    }
  };

  const handleUpdateBankDetails = async (bankId: number, bankData: any) => {
    try {
      await apiService.updateProducerBankDetails(bankId, bankData);
      setSuccess("Bank details updated successfully!");
      setEditingBank(null);
      loadBankDetails();
    } catch (err: any) {
      setError(err.message || "Failed to update bank details");
    }
  };

  const handleDeleteBankDetails = async (bankId: number) => {
    if (!confirm("Are you sure you want to delete this bank account?")) return;
    
    try {
      await apiService.deleteProducerBankDetails(bankId);
      setSuccess("Bank details deleted successfully!");
      loadBankDetails();
    } catch (err: any) {
      setError(err.message || "Failed to delete bank details");
    }
  };

  const handleSetPrimaryBank = async (bankId: number) => {
    try {
      await apiService.setPrimaryBankDetails(bankId);
      setSuccess("Primary bank account updated successfully!");
      loadBankDetails();
    } catch (err: any) {
      setError(err.message || "Failed to set primary bank account");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password && form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload: any = {};
      if (form.first_name) payload.first_name = form.first_name;
      if (form.last_name) payload.last_name = form.last_name;
      if (form.password) payload.password = form.password;
      const res = await fetch("/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setSuccess("Profile updated successfully!");
      setEditing(false);
      setUser((u: any) => ({ ...u, first_name: form.first_name, last_name: form.last_name }));
      localStorage.setItem("user", JSON.stringify({ ...user, first_name: form.first_name, last_name: form.last_name }));
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    }
  };

  if (!user) {
    return <div style={{ padding: 32 }}>You must be logged in to view your profile.</div>;
  }

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", background: "#fff", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>Profile Settings</h1>
      <div style={{ color: "#6b7280", marginBottom: 24 }}>Manage your account information</div>
      {success && <div style={{ background: "#d1fae5", color: "#065f46", padding: 12, borderRadius: 6, marginBottom: 16 }}>{success}</div>}
      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: 6, marginBottom: 16 }}>{error}</div>}
      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ color: "#374151", fontWeight: 500 }}>First Name</label>
          <input
            name="first_name"
            type="text"
            value={form.first_name}
            onChange={handleChange}
            disabled={!editing}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ color: "#374151", fontWeight: 500 }}>Last Name</label>
          <input
            name="last_name"
            type="text"
            value={form.last_name}
            onChange={handleChange}
            disabled={!editing}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ color: "#374151", fontWeight: 500 }}>Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4, background: "#f3f4f6" }}
          />
        </div>
        <div>
          <label style={{ color: "#374151", fontWeight: 500 }}>Account Type</label>
          <input
            type="text"
            value={user.type}
            disabled
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4, background: "#f3f4f6" }}
          />
        </div>
        {editing && (
          <>
            <div>
              <label style={{ color: "#374151", fontWeight: 500 }}>New Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }}
              />
            </div>
            <div>
              <label style={{ color: "#374151", fontWeight: 500 }}>Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }}
              />
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          {editing ? (
            <>
              <button type="submit" style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "10px 24px", fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}>Save</button>
              <button type="button" onClick={() => { setEditing(false); setForm(f => ({ ...f, password: "", confirmPassword: "" })); setError(""); }} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "10px 24px", fontWeight: 500, fontSize: "1rem", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={() => router.push(user.type === 'admin' || user.user_type === 'admin' ? "/dashboard/admin" : "/dashboard")} style={{ background: "#e5e7eb", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "10px 24px", fontWeight: 500, fontSize: "1rem", cursor: "pointer" }}>Exit Profile</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "10px 24px", fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}>Edit Profile</button>
              <button type="button" onClick={() => router.push(user.type === 'admin' || user.user_type === 'admin' ? "/dashboard/admin" : "/dashboard")} style={{ background: "#e5e7eb", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "10px 24px", fontWeight: 500, fontSize: "1rem", cursor: "pointer" }}>Exit Profile</button>
            </>
          )}
        </div>
      </form>

      {/* Bank Details Section for Producers */}
      {(user?.type === 'producer' || user?.user_type === 'producer') && (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1f2937' }}>
              <FaUniversity style={{ marginRight: '0.5rem', color: '#2563eb' }} />
              Bank Details
            </h2>
            <button
              type="button"
              onClick={() => setShowNewBankForm(!showNewBankForm)}
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '0.5rem 1rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaPlus style={{ fontSize: '0.875rem' }} />
              Add Bank Account
            </button>
          </div>

          {/* Add New Bank Form */}
          {showNewBankForm && (
            <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: 8, marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Bank Account</h3>
              <form onSubmit={handleAddBankDetails} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Bank Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    name="bank_name"
                    type="text"
                    required
                    value={newBankForm.bank_name}
                    onChange={handleBankFormChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #d1d5db' }}
                    placeholder="e.g., First Bank"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Account Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    name="account_name"
                    type="text"
                    required
                    value={newBankForm.account_name}
                    onChange={handleBankFormChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #d1d5db' }}
                    placeholder="Name on account"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Account Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    name="account_number"
                    type="text"
                    required
                    value={newBankForm.account_number}
                    onChange={handleBankFormChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #d1d5db' }}
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Bank Code
                  </label>
                  <input
                    name="bank_code"
                    type="text"
                    value={newBankForm.bank_code}
                    onChange={handleBankFormChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #d1d5db' }}
                    placeholder="e.g., 011"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    SWIFT Code
                  </label>
                  <input
                    name="swift_code"
                    type="text"
                    value={newBankForm.swift_code}
                    onChange={handleBankFormChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #d1d5db' }}
                    placeholder="e.g., FBNINGL"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                    Routing Number
                  </label>
                  <input
                    name="routing_number"
                    type="text"
                    value={newBankForm.routing_number}
                    onChange={handleBankFormChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid #d1d5db' }}
                    placeholder="Routing number"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    style={{
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '0.75rem 1.5rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Add Bank Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewBankForm(false)}
                    style={{
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      padding: '0.75rem 1.5rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bank Details List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bankDetails.length > 0 ? (
              bankDetails.map((bank) => (
                <div
                  key={bank.id}
                  style={{
                    background: bank.is_active ? '#f0f9ff' : '#fff',
                    border: bank.is_active ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '1rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <FaUniversity style={{ color: '#2563eb' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1f2937' }}>
                          {bank.bank_name}
                          {bank.is_active && (
                            <span style={{ background: '#10b981', color: '#fff', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: 4, marginLeft: '0.5rem' }}>
                              Primary
                            </span>
                          )}
                        </h3>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                        <div>Account Name: {bank.account_name}</div>
                        <div>Account Number: {bank.account_number}</div>
                        {bank.bank_code && <div>Bank Code: {bank.bank_code}</div>}
                        {bank.swift_code && <div>SWIFT Code: {bank.swift_code}</div>}
                        {bank.routing_number && <div>Routing Number: {bank.routing_number}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!bank.is_active && (
                        <button
                          onClick={() => handleSetPrimaryBank(bank.id)}
                          style={{
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            padding: '0.5rem',
                            cursor: 'pointer'
                          }}
                          title="Set as Primary"
                        >
                          <FaCheck style={{ fontSize: '0.75rem' }} />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingBank(editingBank === bank.id ? null : bank.id)}
                        style={{
                          background: '#fbbf24',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '0.5rem',
                          cursor: 'pointer'
                        }}
                        title="Edit"
                      >
                        <FaEdit style={{ fontSize: '0.75rem' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteBankDetails(bank.id)}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '0.5rem',
                          cursor: 'pointer'
                        }}
                        title="Delete"
                      >
                        <FaTrash style={{ fontSize: '0.75rem' }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <FaUniversity style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
                <div>No bank accounts added yet</div>
                <div style={{ fontSize: '0.9rem' }}>Add your first bank account to receive payments</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for bank submission feedback */}
      {showBankModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 32,
            minWidth: 320,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            textAlign: "center"
          }}>
            {bankModalContent.success ? (
              <>
                <FaCheck style={{ color: "#10b981", fontSize: 48, marginBottom: 16 }} />
                <div style={{ fontSize: 20, fontWeight: 600, color: "#065f46", marginBottom: 8 }}>Success</div>
              </>
            ) : (
              <>
                <FaTimes style={{ color: "#dc2626", fontSize: 48, marginBottom: 16 }} />
                <div style={{ fontSize: 20, fontWeight: 600, color: "#dc2626", marginBottom: 8 }}>Error</div>
              </>
            )}
            <div style={{ fontSize: 16, color: "#374151", marginBottom: 24 }}>{bankModalContent.message}</div>
            <button
              onClick={() => setShowBankModal(false)}
              style={{
                padding: "0.75rem 1.5rem",
                background: bankModalContent.success ? "#10b981" : "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 