"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePolling } from "@/hooks/usePolling";

export default function RatingPage() {
  const { lang } = useLanguage();
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);

  const { data: dashboard } = usePolling<any>("/api/workers/dashboard", { intervalMs: 10000, token, enabled: !!token });

  useEffect(() => {
    // Mock data for the demo
    const timer = setTimeout(() => {
      setData({
        currentRating: 4.8,
        totalReviews: 24,
        history: [
          { job: 1, rating: 4.0 },
          { job: 5, rating: 4.2 },
          { job: 10, rating: 4.5 },
          { job: 15, rating: 4.6 },
          { job: 20, rating: 4.7 },
          { job: 24, rating: 4.8 },
        ],
        reviews: [
          { id: 1, name: "Priya S.", score: 5, text: "Excellent work, very professional!", date: "2026-09-08" },
          { id: 2, name: "Rahul M.", score: 4, text: "Good job but arrived slightly late.", date: "2026-09-05" },
          { id: 3, name: "Ananya K.", score: 5, text: "Fixed the issue quickly. Highly recommend.", date: "2026-09-01" },
        ]
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!data || !dashboard) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  const realRating = dashboard.stats.bayesianAvg;
  data.currentRating = realRating;
  data.history[data.history.length - 1].rating = realRating;

  // Simple SVG Line Chart generator
  const maxJobs = Math.max(...data.history.map((d: any) => d.job));
  const minRating = 3.0; // Chart bottom
  const maxRating = 5.0; // Chart top
  
  const width = 300;
  const height = 150;
  
  const points = data.history.map((d: any, i: number) => {
    const x = (d.job / maxJobs) * width;
    const y = height - ((d.rating - minRating) / (maxRating - minRating)) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <header style={{ padding: "1.25rem", maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: "1rem", borderBottom: "1px solid var(--color-surface-600)", background: "#ffffff" }}>
        <Link href="/worker/home" style={{ textDecoration: "none", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
          ←
        </Link>
        <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-primary)" }}>
          {lang === "hi" ? "रेटिंग प्रोग्रेस" : "Rating Progress"}
        </h1>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "1.5rem 1.25rem" }}>
        <div className="card animate-slide-up" style={{ padding: "1.5rem", textAlign: "center", marginBottom: "2rem", background: "linear-gradient(135deg, #FEF9C3 0%, #FDE047 100%)", border: "1px solid rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: "0.9rem", color: "#64748B", marginBottom: "0.5rem", textTransform: "uppercase", fontWeight: 700 }}>
            {lang === "hi" ? "वर्तमान रेटिंग" : "Current Rating"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-warning)", margin: 0, textShadow: "0px 1px 3px rgba(0,0,0,0.3)" }}>
              ★
            </span>
            <span style={{ fontSize: "2.5rem", fontWeight: 800, color: "#1E293B", margin: 0 }}>
              {data.currentRating.toFixed(1)}
            </span>
          </div>

        </div>

        <div className="card animate-slide-up" style={{ padding: "1.5rem", marginBottom: "2rem", overflowX: "auto" }}>
          <h3 style={{ fontSize: "1rem", margin: "0 0 1rem", color: "var(--color-text-primary)" }}>
            {lang === "hi" ? "प्रोग्रेस ग्राफ" : "Progression Graph"}
          </h3>
          <div style={{ position: "relative", width: "100%", height: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Y-Axis Labels */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-text-muted)", paddingRight: "0.5rem", borderRight: "1px solid var(--color-surface-600)" }}>
              <span>5.0</span>
              <span>4.0</span>
              <span>3.0</span>
            </div>
            
            <svg viewBox={`0 -10 ${width} ${height + 20}`} style={{ width: "100%", height: "100%", marginLeft: "2rem", overflow: "visible" }}>
              <polyline
                fill="none"
                stroke="var(--color-warning)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {data.history.map((d: any, i: number) => {
                const x = (d.job / maxJobs) * width;
                const y = height - ((d.rating - minRating) / (maxRating - minRating)) * height;
                return (
                  <circle key={i} cx={x} cy={y} r="6" fill="#ffffff" stroke="var(--color-warning)" strokeWidth="3" />
                );
              })}
            </svg>
          </div>
          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>
            Number of Jobs →
          </p>
        </div>


      </main>
    </div>
  );
}
