"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const CATEGORIES = [
  { id: "Plumbing",        en: "Plumbing",        hi: "प्लम्बिंग",    icon: "🔧" },
  { id: "Carpentry",       en: "Carpentry",       hi: "बढ़ईगिरी",     icon: "🪚" },
  { id: "Cleaning",        en: "Cleaning",        hi: "सफाई",          icon: "🧹" },
  { id: "Electrical",      en: "Electrical",      hi: "बिजली कार्य",  icon: "⚡" },
  { id: "Painting",        en: "Painting",        hi: "पेंटिंग",      icon: "🖌️" },
  { id: "Appliance Repair",en: "Appliance Repair",hi: "उपकरण मरम्मत",icon: "🔨" },
  { id: "Pest Control",    en: "Pest Control",    hi: "कीट नियंत्रण",icon: "🐜" },
  { id: "AC Service",      en: "AC Service",      hi: "एसी सर्विस",   icon: "❄️" },
];

function BookForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { lang } = useLanguage();

  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [description, setDescription] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) setPhotoBase64(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !description) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          description,
          beforeImageUrl: photoBase64,
          // Hardcoded Bengaluru demo coordinates
          customerLat: 12.9716,
          customerLng: 77.5946,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");

      router.push(`/customer/booking/${data.booking.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <header style={{ padding: "1.25rem", maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/customer/home" style={{ textDecoration: "none", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
          ←
        </Link>
        <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-primary)" }}>
          {lang === "hi" ? "नई बुकिंग" : "New Booking"}
        </h1>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 1.25rem" }} className="animate-slide-up">
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
            <p style={{ color: "var(--color-error)", fontSize: "0.875rem", margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group">
            <label className="label">{lang === "hi" ? "सेवा श्रेणी" : "Service Category"}</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled>{lang === "hi" ? "श्रेणी चुनें" : "Select Category"}</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {lang === "hi" ? c.hi : c.en}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label">{lang === "hi" ? "समस्या का विवरण" : "Describe the problem"}</label>
            <textarea
              className="input"
              rows={4}
              placeholder={lang === "hi" ? "समस्या के बारे में संक्षेप में बताएं..." : "Briefly describe the issue..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">{lang === "hi" ? "फोटो (वैकल्पिक)" : "Photo (Optional)"}</label>
            <div style={{
              border: "2px dashed rgba(255,255,255,0.1)",
              borderRadius: "var(--radius-lg)",
              padding: "2rem",
              textAlign: "center",
              position: "relative",
              cursor: "pointer",
            }}>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ opacity: 0, position: "absolute", inset: 0, cursor: "pointer" }}
              />
              {photoBase64 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <img src={photoBase64} alt="Preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "var(--radius-md)" }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{lang === "hi" ? "फोटो संलग्न" : "Photo attached"}</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "2rem" }}>📷</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                    {lang === "hi" ? "फोटो अपलोड करने के लिए टैप करें" : "Tap to upload photo"}
                  </span>
                </div>
              )}
            </div>
          </div>



          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: "1rem" }}>
            {loading ? <span className="spinner" style={{ width: "1.125rem", height: "1.125rem" }} /> : null}
            {loading ? (lang === "hi" ? "कार्यकर्ता खोज रहे हैं..." : "Finding Workers...") : (lang === "hi" ? "बुकिंग करें" : "Confirm Booking")}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}>
      <BookForm />
    </Suspense>
  );
}
