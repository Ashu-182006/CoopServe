"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePolling } from "@/hooks/usePolling";
import { Booking } from "@/db/schema";

// ── Service category data ──────────────────────────────────────────────────
const CATEGORIES = [
  { id: "Plumbing",        en: "Plumbing",        hi: "प्लम्बिंग",    icon: "🔧", color: "#2b42af" },
  { id: "Carpentry",       en: "Carpentry",       hi: "बढ़ईगिरी",     icon: "🪚", color: "#7c3aed" },
  { id: "Cleaning",        en: "Cleaning",        hi: "सफाई",          icon: "🧹", color: "#0891b2" },
  { id: "Electrical",      en: "Electrical",      hi: "बिजली कार्य",  icon: "⚡", color: "#d97706" },
  { id: "Painting",        en: "Painting",        hi: "पेंटिंग",      icon: "🖌️", color: "#059669" },
  { id: "Appliance Repair",en: "Appliance Repair",hi: "उपकरण मरम्मत",icon: "🔨", color: "#dc2626" },
  { id: "Pest Control",    en: "Pest Control",    hi: "कीट नियंत्रण",icon: "🐜", color: "#92400e" },
  { id: "AC Service",      en: "AC Service",      hi: "एसी सर्विस",   icon: "❄️", color: "#1d4ed8" },
];

const STATUS_LABELS: Record<string, { en: string; hi: string; color: string }> = {
  pending:     { en: "Finding Worker",   hi: "कार्यकर्ता खोज रहे हैं", color: "#f4be29" },
  matched:     { en: "Worker Matched",   hi: "कार्यकर्ता मिला",        color: "#38bdf8" },
  quoted:      { en: "Quote Received",   hi: "कोटेशन मिला",            color: "#a78bfa" },
  accepted:    { en: "Quote Accepted",   hi: "कोटेशन स्वीकृत",         color: "#34d399" },
  paid:        { en: "Payment Held",     hi: "भुगतान होल्ड में",        color: "#22c55e" },
  in_progress: { en: "In Progress",      hi: "काम चल रहा है",          color: "#f97316" },
  completed:   { en: "Completed",        hi: "पूर्ण",                   color: "#22c55e" },
  rated:       { en: "Rated",            hi: "रेटिंग दी गई",           color: "#6b7280" },
  cancelled:   { en: "Cancelled",        hi: "रद्द",                    color: "#ef4444" },
};

export default function CustomerHomePage() {
  const { user, token, signOut } = useAuth();
  const { lang, toggle, t } = useLanguage();

  const { data: bookings } = usePolling<Booking[]>("/api/customer/bookings", {
    intervalMs: 5000,
    token,
    enabled: !!token,
  });

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="page" style={{ paddingBottom: "1rem" }}>
      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <header style={{
        background: "#ffffff",
        padding: "1.5rem 1rem 1.25rem",
        maxWidth: 1200, margin: "0 auto", width: "100%",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        boxShadow: "0 4px 20px -10px rgba(0,0,0,0.05)"
      }}>
        {/* Logo Section */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
          <img src="/logo.png" alt="CoopServe Logo" style={{ height: 48, width: "auto", objectFit: "contain" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Location</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
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

        {/* Search bar */}
        <div style={{ position: "relative", marginTop: "1.25rem" }}>
          <span style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem", color: "var(--color-text-muted)" }}>🔍</span>
          <input
            className="input"
            type="text"
            placeholder={t.home.searchPlaceholder || "Search for a service..."}
            style={{ 
              paddingLeft: "3rem", 
              background: "var(--color-surface-900)", 
              border: "1px solid rgba(0,0,0,0.05)",
              borderRadius: "var(--radius-full)",
              height: "3.5rem",
              fontSize: "1rem",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
            }}
            readOnly
            onClick={() => {/* TODO: search */}}
          />
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 1.25rem" }}>

        {/* ── Category Grid ─────────────────────────────────────────────── */}
        <section style={{ marginBottom: "2.5rem", marginTop: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
              {lang === "hi" ? `नमस्ते, ${firstName}! 👋` : `Namaste, ${firstName}! 👋`}
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/customer/book?category=${encodeURIComponent(cat.id)}`}
                style={{ textDecoration: "none" }}
                className={`animate-slide-up stagger-${Math.min(i + 1, 5)}`}
              >
                <div style={{
                  background: "#ffffff",
                  borderRadius: "var(--radius-xl)",
                  padding: "1rem 0.25rem",
                  textAlign: "center",
                  cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
                  border: "1px solid rgba(0,0,0,0.03)",
                  boxShadow: "0 4px 10px -2px rgba(0,0,0,0.05)",
                  transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 20px -5px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 10px -2px rgba(0,0,0,0.05)"; }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-surface-900)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem" }}>
                    {cat.icon}
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-primary)", lineHeight: 1.2 }}>
                    {lang === "hi" ? cat.hi : cat.en}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent Bookings ────────────────────────────────────────────── */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {t.home.recentBookings}
            </h2>
          </div>

          {!bookings || bookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📋</div>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{t.home.noBookings}</p>
              <Link href="/customer/book" className="btn btn-primary" style={{ marginTop: "1.25rem", display: "inline-flex" }}>
                {t.home.bookNow}
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {bookings.map(b => {
                const status = STATUS_LABELS[b.status] ?? STATUS_LABELS.pending;
                const feePaid = (b.quoteWage || 0) + (b.quotePartsCost || 0);
                return (
                  <Link key={b.id} href={`/customer/booking/${b.id}`} style={{ textDecoration: "none" }}>
                    <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1.25rem", border: "1px solid rgba(0,0,0,0.03)", transition: "transform 0.2s" }}
                         onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)"; }}
                         onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)"; }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                        background: "var(--color-surface-900)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem",
                      }}>
                        {CATEGORIES.find(c => c.id === b.category)?.icon ?? "🔧"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "0.95rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lang === "hi" ? CATEGORIES.find(c => c.id === b.category)?.hi : b.category}
                        </p>
                        <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", margin: "0.1rem 0 0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {b.description}
                        </p>
                        <span style={{
                          padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 600,
                          background: `${status.color}15`, color: status.color, border: `1px solid ${status.color}25`,
                          display: "inline-block"
                        }}>
                          {lang === "hi" ? status.hi : status.en}
                        </span>
                      </div>
                      
                      {feePaid > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                          <span style={{ fontWeight: 700, color: "var(--color-text-primary)", fontSize: "1.05rem" }}>
                            ₹{(feePaid / 100).toFixed(0)}
                          </span>
                          <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", fontWeight: 500 }}>
                            {lang === "hi" ? "शुल्क" : "Fee"}
                          </span>
                        </div>
                      )}

                      <div style={{ color: "var(--color-text-muted)", fontSize: "1.2rem", marginLeft: "0.5rem" }}>›</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>


      </div>
    </div>
  );
}
