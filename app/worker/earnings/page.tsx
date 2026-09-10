"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePolling } from "@/hooks/usePolling";

export default function EarningsPage() {
  const { lang } = useLanguage();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);

  const { data: dashboard } = usePolling<any>("/api/workers/dashboard", { intervalMs: 10000, token, enabled: !!token });

  useEffect(() => {
    // Simulate loading state for realism
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !dashboard) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  const realTotal = dashboard.totalEarnings / 100;
  
  let displayEarnings: any[] = [];
  if (realTotal > 0) {
    displayEarnings = [
      { id: 1, date: new Date().toISOString(), category: dashboard.category || "Service", status: "completed", amount: realTotal }
    ];
  }

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <header style={{ padding: "1.25rem", maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: "1rem", borderBottom: "1px solid var(--color-surface-600)", background: "#ffffff" }}>
        <Link href="/worker/home" style={{ textDecoration: "none", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
          ←
        </Link>
        <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-primary)" }}>
          {lang === "hi" ? "कमाई का इतिहास" : "Earnings History"}
        </h1>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "1.5rem 1.25rem" }}>
        <div className="card animate-slide-up" style={{ padding: "1.5rem", textAlign: "center", marginBottom: "2rem", border: "1px solid var(--color-primary-500)", background: "var(--color-surface-800)" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
            {lang === "hi" ? "कुल कमाई (इस महीने)" : "Total Earnings (This Month)"}
          </p>
          <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-accent-400)", margin: 0 }}>
            ₹{realTotal.toFixed(0)}
          </p>
        </div>

        <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-text-primary)" }}>
          {lang === "hi" ? "हाल की बुकिंग" : "Recent Bookings"}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {displayEarnings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
              {lang === "hi" ? "अभी तक कोई कमाई नहीं हुई" : "No earnings yet"}
            </div>
          ) : (
            displayEarnings.map((item, i) => (
              <div key={item.id} className={`card animate-slide-up stagger-${Math.min(i + 1, 5)}`} style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--color-surface-600)", boxShadow: "none" }}>
              <div>
                <p style={{ fontWeight: 700, margin: "0 0 0.25rem", color: "var(--color-text-primary)" }}>{item.category}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0 }}>{new Date(item.date).toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 800, color: "var(--color-accent-400)", margin: "0 0 0.25rem", fontSize: "1.1rem" }}>+₹{item.amount}</p>
                <span style={{ padding: "0.15rem 0.4rem", borderRadius: "4px", fontSize: "0.65rem", fontWeight: 700, background: "rgba(34,197,94,0.1)", color: "#22c55e", textTransform: "uppercase" }}>
                  {item.status}
                </span>
              </div>
            </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
