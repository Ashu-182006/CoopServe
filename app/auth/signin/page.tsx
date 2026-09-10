"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

function SignInForm() {
  const { signIn } = useAuth();
  const { lang, toggle, t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const role = (params.get("role") ?? "customer") as "customer" | "worker" | "admin";

  const [mobile, setMobile]     = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const roleLabel = { customer: lang === "hi" ? "ग्राहक" : "Customer", worker: lang === "hi" ? "कार्यकर्ता" : "Worker", admin: "Admin" }[role];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Sign in failed"); return; }

      signIn(data.token, data.user);
      if (data.user.role === "customer") router.push("/customer/home");
      else if (data.user.role === "worker") router.push("/worker/home");
      else router.push("/admin/dashboard");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.25rem 0", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <img src="/logo.png" alt="CoopServe Logo" style={{ height: 32, width: "auto", objectFit: "contain" }} />
        </Link>
        <button onClick={toggle} className="btn btn-ghost btn-sm" style={{ fontWeight: 700 }}>
          {lang === "en" ? "हिं" : "EN"}
        </button>
      </header>

      <main className="page-content animate-slide-up" style={{ paddingTop: "2rem", maxWidth: "480px" }}>
        {/* Title */}
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-primary-500)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {roleLabel}
          </p>
          <h1 style={{ color: "var(--color-text-primary)", fontSize: "2rem", fontWeight: 800 }}>
            {t.auth.signIn}
          </h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "0.5rem", fontSize: "1rem" }}>
            {lang === "hi" ? "नमस्ते! वापस आने पर स्वागत है।" : "Namaste! Welcome back."}
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="mobile">{t.auth.mobile}</label>
              <input
                id="mobile"
                className="input"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder={t.auth.mobilePlaceholder}
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label" htmlFor="password">{t.auth.password}</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ width: "100%", paddingRight: "3rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-muted)"
                  }}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                <p style={{ color: "var(--color-error)", fontSize: "0.875rem", margin: 0, fontWeight: 500 }}>{error}</p>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: "1rem" }}>
              {loading ? <span className="spinner" style={{ width: "1.125rem", height: "1.125rem", borderTopColor: "#0f1b2a", borderRightColor: "#0f1b2a", borderBottomColor: "#0f1b2a" }} /> : null}
              {loading ? (lang === "hi" ? "जाँच हो रही है..." : "Signing in...") : t.auth.signIn}
            </button>
          </form>
        </div>

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>
            {t.auth.noAccount}{" "}
            <Link href={`/auth/signup?role=${role}`} style={{ color: "var(--color-primary-600)", fontWeight: 700, textDecoration: "none" }}>
              {t.auth.signUp}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}>
      <SignInForm />
    </Suspense>
  );
}
