"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

function AdminDashboardScreen() {
  const { lang } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: "", mobile: "", password: "" });

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/admin/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (id: string, action: "release" | "refund") => {
    if (!confirm(`Are you sure you want to ${action} this booking?`)) return;
    setActioning(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/${action}`, { method: "POST" });
      if (res.ok) {
        alert(`Successfully ${action}ed payment.`);
        fetchBookings(); // refresh
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error processing action.");
    } finally {
      setActioning(null);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminForm),
      });
      if (res.ok) {
        alert("Admin created successfully!");
        setShowAddAdmin(false);
        setAdminForm({ name: "", mobile: "", password: "" });
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || "Failed to create admin"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting form");
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <header style={{ padding: "1.25rem", maxWidth: 1000, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/" style={{ textDecoration: "none", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
            ←
          </Link>
          <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-primary)" }}>
            {lang === "hi" ? "व्यवस्थापक डैशबोर्ड" : "Admin Dashboard"}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/admin/dashboard" className="btn btn-sm" style={{ fontWeight: 800, background: "var(--color-primary-100)", border: "1px solid var(--color-primary-400)", color: "var(--color-primary-800)" }}>Dashboard</Link>
          <Link href="/admin/stats" className="btn btn-sm btn-ghost" style={{ fontWeight: 600, border: "1px solid var(--color-surface-600)" }}>Stats</Link>
          <Link href="/admin/users" className="btn btn-sm btn-ghost" style={{ fontWeight: 600, border: "1px solid var(--color-surface-600)" }}>Users</Link>
          <button onClick={() => setShowAddAdmin(true)} className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>+ Add Admin</button>
          <button 
            onClick={() => {
              fetch("/api/auth/signout", { method: "POST" }).then(() => {
                window.location.href = "/";
              });
            }}
            className="btn btn-ghost btn-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", width: "100%", padding: "0 1.25rem" }}>
        <div className="card" style={{ padding: "1.5rem", overflowX: "auto" }}>
          {bookings.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--color-text-muted)" }}>No active bookings found.</p>
          ) : (
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>Status</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>Worker</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>Customer</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>Automated Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", background: "rgba(255,255,255,0.1)", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)" }}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem" }}>{b.workerName || "None"}</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem" }}>{b.customerName}</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem" }}>
                      {(b.status === "paid" || b.status === "in_progress" || b.status === "accepted") && (
                        <span style={{ color: "var(--color-warning)", fontWeight: 600 }}>Awaiting OTP</span>
                      )}
                      {(b.status === "completed" || b.status === "rated") && (
                        <span style={{ color: "var(--color-success)", fontWeight: 600 }}>
                          Payment transferred to {b.workerName || "Worker"}
                        </span>
                      )}
                      {b.status === "cancelled" && (
                        <span style={{ color: "var(--color-error)", fontWeight: 600 }}>Refund Initiated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showAddAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div className="card animate-slide-up" style={{ width: "100%", maxWidth: 400, padding: "1.5rem" }}>
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.25rem" }}>Add New Admin</h2>
            <form onSubmit={handleAddAdmin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Name</label>
                <input required className="input" type="text" value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} placeholder="Admin Name" />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input required className="input" type="text" maxLength={10} value={adminForm.mobile} onChange={e => setAdminForm({...adminForm, mobile: e.target.value})} placeholder="10-digit mobile" />
              </div>
              <div>
                <label className="label">Password</label>
                <input required className="input" type="password" minLength={8} value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} placeholder="At least 8 characters" />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAddAdmin(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}>
      <AdminDashboardScreen />
    </Suspense>
  );
}
