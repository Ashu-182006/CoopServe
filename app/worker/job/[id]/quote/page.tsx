"use client";

import { useState, Suspense, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

function QuoteForm({ id }: { id: string }) {
  const router = useRouter();
  const { token } = useAuth();
  const { lang, t } = useLanguage();

  const [wage, setWage] = useState("");
  const [partsCost, setPartsCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingData, setBookingData] = useState<any>(null);


  useEffect(() => {
    if (!token) return;
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${id}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBookingData(data);
        } else {
          const errData = await res.json();
          setBookingData({ error: errData.error || "API error" });
        }
      } catch (err: any) {
        console.error("Failed to load booking details");
        setBookingData({ error: err.message });
      }
    };
    fetchBooking();
  }, [id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wage) {
      setError("Wage is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${id}/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          wage: Number(wage),
          partsCost: Number(partsCost) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit quote");

      // Redirect to worker home after quote is submitted successfully
      router.push("/worker/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const total = (Number(wage) || 0) + (Number(partsCost) || 0);

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <header style={{ padding: "1.25rem", maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/worker/home" style={{ textDecoration: "none", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
          ←
        </Link>
        <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-primary)" }}>
          {lang === "hi" ? "कोटेशन भेजें" : "Send Quote"}
        </h1>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 1.25rem" }} className="animate-slide-up">
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
            <p style={{ color: "var(--color-error)", fontSize: "0.875rem", margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div className="card" style={{ padding: "1.5rem", background: "var(--color-surface-50)", border: "1px solid var(--color-surface-200)" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-text-primary)" }}>
              {lang === "hi" ? "ग्राहक का विवरण" : "Customer Details"}
            </h2>
            {!bookingData ? (
              <div style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Loading customer details...</div>
            ) : bookingData.error ? (
              <div style={{ color: "var(--color-error)", fontSize: "0.9rem" }}>Error: {bookingData.error}</div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                  <p style={{ margin: 0 }}><strong>{lang === "hi" ? "नाम:" : "Name:"}</strong> {bookingData.customer?.name || "Customer"}</p>
                  <p style={{ margin: 0 }}><strong>{lang === "hi" ? "पता:" : "Address:"}</strong> {bookingData.customer?.address || "N/A"}</p>
                  <p style={{ margin: 0 }}><strong>{lang === "hi" ? "कार्य का विवरण:" : "Work Description:"}</strong> {bookingData.booking?.description || "Fake job for demo ping"}</p>
                </div>
                {bookingData.booking?.beforeImageUrl && (
                  <div>
                    <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>{lang === "hi" ? "छवि:" : "Image:"}</h3>
                    <img 
                      src={bookingData.booking.beforeImageUrl} 
                      alt="Work issue" 
                      style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "var(--radius-md)" }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="label">{lang === "hi" ? "मजदूरी (₹)" : "Labour Wage (₹)"}</label>
              <input
                className="input"
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={wage}
                onChange={(e) => setWage(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label className="label">{lang === "hi" ? "पार्ट्स (अनुमानित) (₹)" : "Parts Estimate (₹)"}</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="e.g. 250"
                value={partsCost}
                onChange={(e) => setPartsCost(e.target.value)}
              />
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                {lang === "hi" ? "यदि कोई पार्ट्स नहीं चाहिए तो 0 छोड़ दें।" : "Leave 0 if no parts are needed."}
              </p>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1.5rem 0 1rem" }} />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 600 }}>{lang === "hi" ? "कुल अनुमान" : "Total Estimate"}</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary-400)" }}>₹{total}</span>
            </div>
          </div>

          <div style={{ background: "rgba(244,190,41,0.05)", border: "1px solid rgba(244,190,41,0.15)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-secondary)", display: "flex", gap: "0.5rem" }}>
              <span>⏱️</span>
              {lang === "hi" ? "आपके पास कोटेशन सबमिट करने के लिए 2 मिनट हैं।" : "You have 2 minutes to submit this quote."}
            </p>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: "1rem" }}>
            {loading ? <span className="spinner" style={{ width: "1.125rem", height: "1.125rem" }} /> : null}
            {loading ? (lang === "hi" ? "भेज रहे हैं..." : "Sending...") : (lang === "hi" ? "कोटेशन भेजें" : "Submit Quote")}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}>
      <QuoteForm id={id} />
    </Suspense>
  );
}
