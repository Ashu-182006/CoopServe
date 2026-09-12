"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

function AdminStatsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
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
          <Link href="/admin/dashboard" style={{ textDecoration: "none", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
            ←
          </Link>
          <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-primary)" }}>
            Platform Statistics
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/admin/dashboard" className="btn btn-sm btn-ghost" style={{ fontWeight: 600, border: "1px solid var(--color-surface-600)" }}>Dashboard</Link>
          <Link href="/admin/stats" className="btn btn-sm" style={{ fontWeight: 800, background: "var(--color-primary-100)", border: "1px solid var(--color-primary-400)", color: "var(--color-primary-800)" }}>Stats</Link>
          <Link href="/admin/users" className="btn btn-sm btn-ghost" style={{ fontWeight: 600, border: "1px solid var(--color-surface-600)" }}>Users</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", width: "100%", padding: "0 1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        
        <div className="card" style={{ padding: "2rem", textAlign: "center", background: "linear-gradient(135deg, #FFF4E0 0%, #FFDDA1 100%)", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" }}>
          <h2 style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>Total Bookings</h2>
          <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{stats.totalBookings}</div>
        </div>

        <div className="card" style={{ padding: "2rem", textAlign: "center", background: "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" }}>
          <h2 style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>Total Money Transferred</h2>
          <div style={{ fontSize: "3rem", fontWeight: 800, color: "#118C4F" }}>₹{(stats.totalTransfers / 100).toFixed(2)}</div>
        </div>

        <div className="card" style={{ padding: "2rem", textAlign: "center", background: "linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" }}>
          <h2 style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>Total Welfare Fund</h2>
          <div style={{ fontSize: "3rem", fontWeight: 800, color: "#1E3A8A" }}>₹{(stats.totalWelfare / 100).toFixed(2)}</div>
        </div>

        <div className="card" style={{ padding: "2rem", textAlign: "center", background: "linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" }}>
          <h2 style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem" }}>Total Refunds</h2>
          <div style={{ fontSize: "3rem", fontWeight: 800, color: "#991B1B" }}>₹{(stats.totalRefunds / 100).toFixed(2)}</div>
        </div>

      </main>
    </div>
  );
}

export default function AdminStatsPage() {
  return (
    <Suspense fallback={<div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}>
      <AdminStatsScreen />
    </Suspense>
  );
}
