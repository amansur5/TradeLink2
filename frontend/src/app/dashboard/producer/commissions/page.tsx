"use client";
import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { FaDollarSign, FaSearch, FaFilter, FaDownload, FaEye, FaCheck, FaClock, FaTimes, FaUniversity, FaChartLine } from "react-icons/fa";

export default function ProducerCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      const commissionsData = await apiService.getProducerCommissions();
      setCommissions(commissionsData);
    } catch (error) {
      console.error("Error loading commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return { background: '#d1fae5', color: '#065f46' };
      case 'pending':
        return { background: '#fef3c7', color: '#92400e' };
      case 'processing':
        return { background: '#dbeafe', color: '#1e40af' };
      case 'failed':
        return { background: '#fee2e2', color: '#dc2626' };
      default:
        return { background: '#f3f4f6', color: '#374151' };
    }
  };

  const filteredCommissions = commissions.filter(commission => {
    const matchesSearch = commission.id.toString().includes(searchTerm) ||
                         commission.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || commission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getTotalStats = () => {
    const totalCommissions = commissions.length;
    const totalCommissionAmount = commissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
    const pendingCommissions = commissions.filter(c => c.status === 'pending');
    const pendingAmount = pendingCommissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
    const paidCommissions = commissions.filter(c => c.status === 'paid');
    const paidAmount = paidCommissions.reduce((sum, c) => sum + Number(c.commission_amount || 0), 0);
    
    return {
      totalCommissions,
      totalCommissionAmount,
      pendingAmount,
      paidAmount
    };
  };

  const exportCommissions = () => {
    // TODO: Implement export functionality
    alert("Export functionality will be implemented here");
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div>Loading commissions...</div>
      </div>
    );
  }

  const stats = getTotalStats();

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937", marginBottom: "0.5rem" }}>
            Commission History
          </h1>
          <p style={{ color: "#6b7280", fontSize: "1rem" }}>
            Track platform commissions deducted from your sales
          </p>
        </div>
        <button
          onClick={exportCommissions}
          style={{
            padding: "0.75rem 1.5rem",
            background: "#10b981",
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
          <FaDownload style={{ fontSize: "0.875rem" }} />
          Export Commissions
        </button>
      </div>

      {/* Stats Cards */}
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
            <FaDollarSign style={{ fontSize: "1.5rem", color: "#dc2626" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                ₦{Number(stats.totalCommissionAmount).toFixed(2)}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Total Commissions</div>
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
            <FaClock style={{ fontSize: "1.5rem", color: "#f59e0b" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                ₦{Number(stats.pendingAmount).toFixed(2)}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Pending Commissions</div>
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
            <FaCheck style={{ fontSize: "1.5rem", color: "#3b82f6" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                ₦{Number(stats.paidAmount).toFixed(2)}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Paid Commissions</div>
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
            <FaChartLine style={{ fontSize: "1.5rem", color: "#8b5cf6" }} />
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937" }}>
                {stats.totalCommissions}
              </div>
              <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>Total Transactions</div>
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
              placeholder="Search by commission ID or product..."
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: "0.875rem",
              background: "#fff"
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Commissions Table */}
      <div style={{ 
        background: "#fff", 
        borderRadius: 8, 
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        overflow: "hidden"
      }}>
        <div style={{ 
          padding: "1.5rem", 
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb"
        }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1f2937" }}>
            Commission Transactions
          </h2>
        </div>

        {filteredCommissions.length > 0 ? (
          <div>
            {filteredCommissions.map((commission) => (
              <div key={commission.id} style={{ 
                padding: "1.5rem", 
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem"
              }}>
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                    <div style={{ 
                      width: "50px", 
                      height: "50px", 
                      background: "#f3f4f6", 
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <FaDollarSign style={{ fontSize: "1rem", color: "#dc2626" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "0.25rem" }}>
                        Commission #{commission.id} • {commission.product_name}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        Order #{commission.order_id} • {new Date(commission.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                        Payment Method: {commission.payment_method === 'credit_card' ? 'Credit Card' : 'Bank Transfer'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "center", minWidth: "120px" }}>
                  <div style={{ fontWeight: 600, color: "#dc2626", marginBottom: "0.25rem" }}>
                    -₦{Number(commission.commission_amount).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    {commission.commission_percentage}% of ₦{Number(commission.order_amount).toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 500 }}>
                    Net: ₦{Number(commission.producer_amount).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: "center", minWidth: "120px" }}>
                  <div style={{ 
                    padding: "0.25rem 0.75rem", 
                    borderRadius: 20, 
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    display: "inline-block",
                    marginBottom: "0.5rem",
                    ...getStatusColor(commission.status)
                  }}>
                    {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    Platform Fee
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    style={{
                      padding: "0.5rem",
                      background: "#f3f4f6",
                      color: "#374151",
                      border: "none",
                      borderRadius: 6,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}
                  >
                    <FaEye style={{ fontSize: "0.75rem" }} />
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem", 
            color: "#6b7280" 
          }}>
            <FaDollarSign style={{ fontSize: "3rem", color: "#d1d5db", marginBottom: "1rem" }} />
            <div style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              No commissions found
            </div>
            <div style={{ fontSize: "1rem" }}>
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your filters" 
                : "Commission transactions will appear here when you make sales"
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 