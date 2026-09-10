"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WorkerPublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang, toggle } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/workers/${id}/public`)
      .then(r => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(d => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <h2>{lang === "hi" ? "प्रोफ़ाइल नहीं मिली" : "Profile Not Found"}</h2>
        <p>{lang === "hi" ? "यह कार्यकर्ता आईडी अमान्य है।" : "This worker ID is invalid."}</p>
        <Link href="/" className="btn btn-ghost mt-4">Go Home</Link>
      </div>
    );
  }

  const joinDate = new Date(data.createdAt).toLocaleDateString();

  return (
    <div className="page" style={{ paddingBottom: "2rem", minHeight: "100vh", background: "var(--color-bg)" }}>
      <header style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "var(--color-surface-800)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src="/logo.png" alt="CoopServe Logo" style={{ height: 32, width: "auto", objectFit: "contain" }} />
        </div>
        <button onClick={toggle} className="btn btn-ghost btn-sm" style={{ fontWeight: 700 }}>
          {lang === "en" ? "हिं" : "EN"}
        </button>
      </header>

      <main style={{ maxWidth: 1200, margin: "2rem auto", padding: "0 1.25rem" }}>
        <div className="card animate-slide-up" style={{ padding: "2rem", textAlign: "center", border: "2px solid var(--color-primary-500)", boxShadow: "0 0 30px rgba(43,66,175,0.2)" }}>
          
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--color-surface-700)", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", border: "4px solid var(--color-surface-800)" }}>
            (Worker)
          </div>

          <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
            {data.name}
          </h1>

          <div style={{ display: "inline-block", background: "rgba(244,190,41,0.15)", color: "var(--color-accent-400)", padding: "0.25rem 0.75rem", borderRadius: "var(--radius-full)", fontSize: "0.85rem", fontWeight: 700, marginBottom: "1rem" }}>
            {data.category}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Rating</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary-400)" }}>★ {data.stats?.bayesianAvg?.toFixed(1) || "New"}</div>
            </div>
            
            {data.certificationStatus && (
              <div style={{ background: "rgba(34,197,94,0.1)", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div style={{ fontSize: "0.75rem", color: "#22c55e", textTransform: "uppercase" }}>Verified</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#22c55e" }}>✓ Yes</div>
              </div>
            )}
          </div>

          <div style={{ textAlign: "left", background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "var(--radius-md)" }}>
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ margin: "0 0 0.25rem", color: "var(--color-text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>{lang === "hi" ? "मेरे बारे में" : "About Me"}</p>
              <p style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "0.95rem", lineHeight: 1.5 }}>{data.bio}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <p style={{ margin: "0 0 0.25rem", color: "var(--color-text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>{lang === "hi" ? "संपर्क" : "Contact"}</p>
                <p style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "0.95rem" }}>{data.mobile}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem", color: "var(--color-text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>{lang === "hi" ? "कुल कार्य" : "Total Jobs"}</p>
                <p style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "0.95rem" }}>{data.totalJobs}+</p>
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem", color: "var(--color-text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>{lang === "hi" ? "भाषाएँ" : "Languages"}</p>
                <p style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "0.95rem" }}>{data.languages?.join(", ")}</p>
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem", color: "var(--color-text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>{lang === "hi" ? "पता" : "Location"}</p>
                <p style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "0.95rem" }}>{data.address}</p>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1rem 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: "0 0 0.25rem", color: "var(--color-text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>{lang === "hi" ? "पासपोर्ट आईडी" : "Passport ID"}</p>
                <p style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "1rem", fontFamily: "monospace", letterSpacing: "1px" }}>{data.passportId}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 0.25rem", color: "var(--color-text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>{lang === "hi" ? "शामिल होने की तिथि" : "Joined"}</p>
                <p style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "0.95rem" }}>{joinDate}</p>
              </div>
            </div>
          </div>
          
        </div>
        
        <div style={{ textAlign: "center", marginTop: "2rem", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
          <p>Verified by CoopServe Platform</p>
        </div>
      </main>
    </div>
  );
}
