"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

function AdminDashboardScreen() {
  const { lang } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <header style={{ padding: "1.25rem", maxWidth: 800, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/" style={{ textDecoration: "none", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
            ←
          </Link>
          <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-primary)" }}>
            {lang === "hi" ? "व्यवस्थापक डैशबोर्ड (एस्क्रो सुरक्षा)" : "Admin Dashboard (Escrow Safety-Net)"}
          </h1>
        </div>
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
      </header>

      <main style={{ maxWidth: 800, margin: "0 auto", width: "100%", padding: "0 1.25rem" }}>
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
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>Actions</th>
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
                    <td style={{ padding: "0.75rem 0.5rem", display: "flex", gap: "0.5rem" }}>
                      {(b.status === "paid" || b.status === "in_progress" || b.status === "accepted") && (
                        <>
                          <button 
                            className="btn btn-sm" 
                            style={{ background: "#22c55e", color: "#fff", padding: "0.3rem 0.6rem" }}
                            onClick={() => handleAction(b.id, "release")}
                            disabled={actioning === b.id}
                          >
                            Release
                          </button>
                          <button 
                            className="btn btn-sm" 
                            style={{ background: "var(--color-error)", color: "#fff", padding: "0.3rem 0.6rem" }}
                            onClick={() => handleAction(b.id, "refund")}
                            disabled={actioning === b.id}
                          >
                            Refund
                          </button>
                        </>
                      )}
                      {(b.status === "completed" || b.status === "rated" || b.status === "cancelled") && (
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Actioned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
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
