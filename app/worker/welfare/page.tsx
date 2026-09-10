"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield } from "lucide-react";
import { usePolling } from "@/hooks/usePolling";

function WelfareWalletScreen() {
  const { token } = useAuth();
  const { lang } = useLanguage();

  const { data, loading, error } = usePolling<{ wallet: any }>(
    "/api/workers/welfare-wallet",
    { intervalMs: 10000, token, enabled: !!token }
  );

  if (loading && !data) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: "2rem", height: "2rem" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page" style={{ padding: "2rem", textAlign: "center" }}>
        <h2>{lang === "hi" ? "त्रुटि" : "Error"}</h2>
        <p>{lang === "hi" ? "वॉलेट डेटा नहीं मिला।" : "Failed to load wallet data."}</p>
        <Link href="/worker/home" className="btn btn-primary">{lang === "hi" ? "वापस जाएं" : "Go Back"}</Link>
      </div>
    );
  }

  const { wallet } = data;

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <header style={{ padding: "1.25rem", maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/worker/home" style={{ textDecoration: "none", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
          ←
        </Link>
        <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-primary)" }}>
          {lang === "hi" ? "कल्याण वॉलेट" : "Welfare Wallet"}
        </h1>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 1.25rem" }}>
        


        {/* PMSBY Card */}
        <div className="card animate-slide-up" style={{ padding: "1.5rem", marginBottom: "1rem", background: "linear-gradient(135deg, rgba(43,66,175,0.15), rgba(43,66,175,0.02))", border: "1px solid rgba(43,66,175,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.25rem", color: "var(--color-text-primary)" }}>PMSBY</h2>
              <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--color-text-secondary)" }}>Pradhan Mantri Suraksha Bima Yojana</p>
            </div>
            <Shield size={32} color="var(--color-primary-500)" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>{lang === "hi" ? "नामांकन स्थिति" : "Enrollment Status"}</span>
              <strong style={{ background: wallet.pmsbyEnrolled ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.1)", color: wallet.pmsbyEnrolled ? "#22c55e" : "var(--color-text-primary)", padding: "0.25rem 0.75rem", borderRadius: "var(--radius-full)", fontSize: "0.85rem" }}>
                {wallet.pmsbyEnrolled ? (lang === "hi" ? "सक्रिय" : "Active") : (lang === "hi" ? "लंबित" : "Pending")}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>{lang === "hi" ? "पॉलिसी वर्ष" : "Policy Year"}</span>
              <strong>{wallet.pmsbyPolicyYear}</strong>
            </div>
          </div>
        </div>

        {/* Contributions Summary */}
        <div className="card animate-slide-up" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "1.5rem", color: "var(--color-text-primary)" }}>
            {lang === "hi" ? "योगदान सारांश" : "Contributions Summary"}
          </h3>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>{lang === "hi" ? "कुल जमा (2.5% शुल्क)" : "Total Collected (2.5% fee)"}</span>
            <span style={{ fontWeight: 600 }}>₹{(wallet.contributionsTotal / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>{lang === "hi" ? "प्रीमियम भुगतान" : "Premium Paid"}</span>
            <span style={{ color: "var(--color-error)" }}>- ₹20.00</span>
          </div>
          
          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1rem 0" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 700 }}>
            <span>{lang === "hi" ? "अधिशेष शेष" : "Surplus Balance"}</span>
            <span style={{ color: "var(--color-primary-400)" }}>₹{(wallet.surplusBalance / 100).toFixed(2)}</span>
          </div>
        </div>
        
      </main>
    </div>
  );
}

export default function WorkerWelfarePage() {
  return (
    <Suspense fallback={<div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}>
      <WelfareWalletScreen />
    </Suspense>
  );
}
