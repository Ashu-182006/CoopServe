"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePolling } from "@/hooks/usePolling";

function JobPingPopup({ job, onRespond }: { job: any; onRespond: (id: string, action: "accept" | "decline") => void }) {
  const { lang } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(job.pingExpiresAt).getTime() - Date.now();
      if (diff > 0) {
        setTimeLeft(Math.ceil(diff / 1000));
      } else {
        onRespond(job.id, "decline");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [job.pingExpiresAt, job.id, onRespond]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem"
    }}>
      <div className="card animate-slide-up" style={{
        width: "100%", maxWidth: 360, padding: "1.5rem",
        border: "1px solid var(--color-surface-600)", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", background: "#ffffff"
      }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "3rem", animation: "pulse 1.5s infinite" }}>(Alert)</div>
          <h2 style={{ fontSize: "1.25rem", color: "var(--color-primary-400)", margin: "0.5rem 0" }}>
            {lang === "hi" ? "नई नौकरी उपलब्ध!" : "New Job Available!"}
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
            {job.category} • {job.customerName}
          </p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.5 }}>"{job.description}"</p>
        </div>

        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "2rem", fontWeight: 800, color: timeLeft <= 10 ? "var(--color-error)" : "var(--color-text-primary)" }}>
            00:{timeLeft.toString().padStart(2, "0")}
          </span>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={() => onRespond(job.id, "decline")} className="btn btn-ghost" style={{ flex: 1, border: "1px solid var(--color-surface-600)" }}>
            {lang === "hi" ? "अस्वीकार" : "Decline"}
          </button>
          <button onClick={() => onRespond(job.id, "accept")} className="btn btn-primary" style={{ flex: 1 }}>
            {lang === "hi" ? "स्वीकार करें" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkerHome() {
  const { user, token, signOut } = useAuth();
  const { lang, toggle, t } = useLanguage();
  const router = useRouter();

  const { data: dashboard, refetch: refetchDashboard } = usePolling<any>("/api/workers/dashboard", { intervalMs: 10000, token, enabled: !!token });
  const { data: pendingJobs } = usePolling<any[]>("/api/workers/pending-jobs", { intervalMs: 3000, token, enabled: !!token && dashboard?.isOnline });

  const firstName = user?.name?.split(" ")[0] ?? "";
  const [toggling, setToggling] = useState(false);

  const handleToggleOnline = async () => {
    if (!dashboard) return;
    setToggling(true);
    try {
      await fetch("/api/workers/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isOnline: !dashboard.isOnline }),
      });
      await refetchDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  // Simulate worker location updates
  useEffect(() => {
    if (!dashboard?.isOnline || !token) return;

    // Default to some coords (e.g. Bengaluru)
    let lat = dashboard.locationLat || 12.9716;
    let lng = dashboard.locationLng || 77.5946;

    const interval = setInterval(() => {
      // Small random walk to simulate movement
      lat += (Math.random() - 0.5) * 0.001;
      lng += (Math.random() - 0.5) * 0.001;

      fetch("/api/workers/location", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lat, lng, isOnline: true })
      }).catch(console.error);
    }, 5000);

    return () => clearInterval(interval);
  }, [dashboard?.isOnline, token, dashboard?.locationLat, dashboard?.locationLng]);

  const handleRespond = async (jobId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch(`/api/bookings/${jobId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed to respond");
      
      if (action === "accept") {
        router.push(`/worker/job/${jobId}/quote`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!dashboard) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  const job = pendingJobs?.[0]; // Show first pending job

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      {job && <JobPingPopup job={job} onRespond={handleRespond} />}

      <header style={{
        background: "#ffffff",
        padding: "1rem",
        paddingBottom: "1.25rem",
        maxWidth: 1200, margin: "0 auto", width: "100%",
        borderBottom: "1px solid var(--color-surface-600)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Current Location</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                {user?.address || (lang === "hi" ? "बेंगलुरु, कर्नाटक" : "Bengaluru, Karnataka")}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--color-primary-500)" }}>▼</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
            <button onClick={toggle} className="btn btn-ghost btn-sm" style={{ fontWeight: 700, padding: "0.375rem 0.75rem" }}>
              {lang === "en" ? "हिं" : "EN"}
            </button>
            <button onClick={signOut} className="btn btn-sm" style={{ padding: "0.375rem 0.75rem", background: "var(--color-surface-800)", border: "1px solid var(--color-surface-600)", color: "var(--color-error)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "1rem" }}>🚪</span> {lang === "hi" ? "लॉग आउट" : "Logout"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", color: "var(--color-text-primary)", margin: "0.25rem 0" }}>
              {lang === "hi" ? `नमस्ते, ${firstName}! 👋` : `Namaste, ${firstName}! 👋`}
            </h1>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "var(--color-surface-900)", color: "var(--color-text-primary)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-full)", border: "1px solid var(--color-surface-600)", display: "inline-block" }}>
              {dashboard.category}
            </span>
          </div>
          
          <button
            onClick={handleToggleOnline}
            disabled={toggling}
            className={`btn ${dashboard.isOnline ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: "var(--radius-full)", padding: "0.5rem 1.5rem", transition: "all 0.3s" }}
          >
            {dashboard.isOnline ? (lang === "hi" ? "ऑनलाइन" : "Online") : (lang === "hi" ? "ऑफ़लाइन" : "Offline")}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        
        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Link href="/worker/earnings" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "1.25rem", textAlign: "center", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                {lang === "hi" ? "कमाई" : "Earnings"}
              </p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-accent-400)", margin: 0 }}>
                ₹{(dashboard.totalEarnings / 100).toFixed(0)}
              </p>
            </div>
          </Link>
          <Link href="/worker/rating" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "1.25rem", textAlign: "center", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                {lang === "hi" ? "रेटिंग" : "Rating"}
              </p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary-400)", margin: 0 }}>
                ★ {dashboard.stats.bayesianAvg.toFixed(1)}
              </p>
            </div>
          </Link>
        </div>

        {/* Welfare Wallet Summary */}
        <Link href="/worker/welfare" style={{ textDecoration: "none" }}>
          <div className="card" style={{ padding: "1.25rem", background: "#ffffff", border: "1px solid var(--color-surface-600)", boxShadow: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", margin: 0, color: "var(--color-text-primary)" }}>{lang === "hi" ? "कल्याण वॉलेट" : "Welfare Wallet"}</h3>
              <span style={{ fontSize: "1.25rem" }}>🛡️</span>
            </div>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              {lang === "hi" ? "PMSBY स्थिति:" : "PMSBY Status:"} <strong style={{ color: dashboard.wallet.pmsbyEnrolled ? "var(--color-success)" : "var(--color-text-primary)" }}>
                {dashboard.wallet.pmsbyEnrolled ? (lang === "hi" ? "सक्रिय" : "Active") : (lang === "hi" ? "लंबित" : "Pending")}
              </strong>
            </p>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
              {lang === "hi" ? "सुरक्षित राशि:" : "Secured Amount:"} <strong>₹{(dashboard.wallet.contributionsTotal / 100).toFixed(2)}</strong>
            </p>
          </div>
        </Link>

        {/* Passport / Profile */}
        <Link href="/worker/profile" style={{ textDecoration: "none" }}>
          <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--color-surface-600)", boxShadow: "none" }}>
            <div>
              <p style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.25rem", color: "var(--color-text-primary)" }}>
                {lang === "hi" ? "पासपोर्ट आईडी" : "Passport ID"}
              </p>
              <p style={{ fontSize: "0.85rem", margin: 0, color: "var(--color-text-muted)" }}>
                {dashboard.passportId}
              </p>
            </div>
            <span style={{ color: "var(--color-text-muted)" }}>›</span>
          </div>
        </Link>
      </main>


    </div>
  );
}

export default function WorkerHomePage() {
  return (
    <Suspense fallback={<div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}>
      <WorkerHome />
    </Suspense>
  );
}
