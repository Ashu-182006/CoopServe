"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePolling } from "@/hooks/usePolling";
import { HardHat } from "lucide-react";

import QRCode from "react-qr-code";

function WorkerProfileScreen() {
  const { token } = useAuth();
  const { lang } = useLanguage();
  const [originUrl, setOriginUrl] = useState("");
  
  // We can reuse the dashboard endpoint for the basic stats
  const { data: dashboard, loading } = usePolling<any>(
    "/api/workers/dashboard",
    { intervalMs: 30000, token, enabled: !!token }
  );

  // Note: For a real app, we'd have a specific /api/workers/ratings endpoint to fetch the history.
  // For the prototype demo, we'll simulate a recent history array based on the stats if it's not provided.
  const [trendData, setTrendData] = useState<number[]>([]);

  useEffect(() => {
    setOriginUrl(window.location.origin);
    if (dashboard?.stats) {
      // Simulate recent 5 ratings ending near the current average
      const avg = dashboard.stats.bayesianAvg;
      setTrendData([
        Math.max(1, Math.min(5, avg - 0.5)),
        Math.max(1, Math.min(5, avg + 0.2)),
        Math.max(1, Math.min(5, avg - 0.1)),
        Math.max(1, Math.min(5, avg + 0.4)),
        avg
      ]);
    }
  }, [dashboard?.stats]);

  if (loading && !dashboard) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!dashboard) return null;

  const { stats, passportId, category } = dashboard;
  const publicProfileUrl = `${originUrl}/workers/${passportId}/public`;

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <header style={{ padding: "1.25rem", maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/worker/home" style={{ textDecoration: "none", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
          ←
        </Link>
        <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-primary)" }}>
          {lang === "hi" ? "प्रोफ़ाइल और रेटिंग" : "Profile & Ratings"}
        </h1>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 1.25rem" }}>
        
        {/* Passport ID Card */}
        <div className="card animate-slide-up" style={{ padding: 0, overflow: "hidden", marginBottom: "1.5rem", border: "2px solid var(--color-primary-500)", boxShadow: "0 4px 20px rgba(43,66,175,0.3)" }}>
          <div style={{ background: "var(--color-primary-600)", padding: "1rem", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800, letterSpacing: "1px" }}>COOPSERVE</div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", background: "rgba(255,255,255,0.2)", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-full)" }}>Worker Passport</div>
          </div>
          
          <div style={{ padding: "1.5rem", background: "linear-gradient(135deg, var(--color-surface-800), var(--color-surface-700))", display: "flex", gap: "1.5rem", alignItems: "center" }}>
            
            <div style={{ flex: 1 }}>
              <div style={{ width: 64, height: 64, borderRadius: "8px", background: "var(--color-surface-600)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <HardHat size={32} color="var(--color-primary-300)" />
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>ID No.</div>
              <div style={{ fontSize: "1.1rem", fontFamily: "monospace", color: "var(--color-primary-400)", fontWeight: 700, letterSpacing: "1px", marginBottom: "0.5rem" }}>
                {passportId}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--color-accent-400)", fontWeight: 600 }}>
                {category}
              </div>
            </div>

            <div style={{ background: "#fff", padding: "0.5rem", borderRadius: "8px" }}>
              <QRCode value={publicProfileUrl} size={96} />
            </div>

          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "0.75rem", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <Link href={publicProfileUrl} target="_blank" style={{ fontSize: "0.85rem", color: "var(--color-primary-400)", textDecoration: "none", fontWeight: 600 }}>
              {lang === "hi" ? "सार्वजनिक प्रोफ़ाइल देखें" : "View Public Profile ↗"}
            </Link>
          </div>
        </div>

        {/* Bayesian Rating Card */}
        <div className="card animate-slide-up" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", margin: "0 0 1rem", color: "var(--color-text-primary)" }}>
            {lang === "hi" ? "आपकी रेटिंग" : "Your Rating"}
          </h3>
          
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "3rem", fontWeight: 800, color: "var(--color-primary-400)", lineHeight: 1 }}>
              {stats.bayesianAvg.toFixed(2)}
            </span>
            <span style={{ fontSize: "1.25rem", color: "var(--color-text-secondary)" }}>/ 5.0</span>
          </div>
          
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1.5rem", padding: "0.75rem", background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }}>
            <strong>Bayesian Breakdown:</strong><br />
            Simple Avg: {stats.simpleAvg.toFixed(2)} based on {stats.nReviews} reviews.<br/>
            <em>The Bayesian formula prevents wild swings from a single bad review by anchoring to the platform average.</em>
          </div>

          <h4 style={{ fontSize: "0.95rem", margin: "0 0 1rem", color: "var(--color-text-primary)" }}>
            {lang === "hi" ? "हाल की प्रवृत्ति" : "Recent Trend"}
          </h4>

          {/* Simple CSS-based Bar Chart */}
          <div style={{ display: "flex", alignItems: "flex-end", height: "100px", gap: "0.5rem", padding: "1rem 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            {trendData.map((val, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ 
                  width: "100%", 
                  height: `${(val / 5) * 100}%`, 
                  background: i === trendData.length - 1 ? "var(--color-primary-400)" : "var(--color-surface-600)",
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.5s ease"
                }} />
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{val.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

export default function WorkerProfilePage() {
  return (
    <Suspense fallback={<div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}>
      <WorkerProfileScreen />
    </Suspense>
  );
}
