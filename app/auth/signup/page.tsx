"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const CATEGORIES = ["Plumbing", "Carpentry", "Cleaning", "Electrical", "Painting", "Appliance Repair", "Pest Control", "AC Service"];
const CATEGORY_HI: Record<string, string> = {
  "Plumbing": "प्लम्बिंग", "Carpentry": "बढ़ईगिरी", "Cleaning": "सफाई",
  "Electrical": "बिजली कार्य", "Painting": "पेंटिंग", "Appliance Repair": "उपकरण मरम्मत",
  "Pest Control": "कीट नियंत्रण", "AC Service": "एसी सर्विस",
};

function SignUpForm() {
  const { signIn } = useAuth();
  const { lang, toggle, t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const role = (params.get("role") ?? "customer") as "customer" | "worker";

  const [step, setStep] = useState(1); // 1=Personal, 2=Security
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    name: "", mobile: "", dob: "", address: "",
    category: "", certified: false,
    aadhaar: "", pan: "",
    password: "", confirmPassword: "", profileImageBase64: "",
  });

  const set = (key: string, val: string | boolean) => setForm(prev => ({ ...prev, [key]: val }));

  const roleLabel = role === "customer"
    ? (lang === "hi" ? "ग्राहक" : "Customer")
    : (lang === "hi" ? "कार्यकर्ता" : "Worker");

  const steps = [t.auth.steps.personal, "Security & Profile"];

  async function handleSubmit() {
    if (!/^\d{12}$/.test(form.aadhaar)) { setError(lang === "hi" ? "अमान्य आधार" : "Invalid Aadhaar number"); return; }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan)) { setError(lang === "hi" ? "अमान्य पैन" : "Invalid PAN number"); return; }
    if (form.password !== form.confirmPassword) { setError(lang === "hi" ? "पासवर्ड मेल नहीं खाते" : "Passwords do not match"); return; }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(form.password)) { 
      setError(lang === "hi" ? "पासवर्ड में कम से कम 1 बड़ा अक्षर, 1 विशेष वर्ण, 1 अंक और 8 अक्षर होने चाहिए" : "Password must have at least 1 capital letter, 1 special character, 1 digit, and 8 characters"); 
      return; 
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name:       form.name.trim(),
          mobile:     form.mobile.trim(),
          dob:        form.dob,
          address:    form.address.trim(),
          category:   form.category,
          certified:  form.certified,
          aadhaar:    form.aadhaar.trim(),
          pan:        form.pan.trim(),
          password:   form.password,
          photoUrl:   form.profileImageBase64 || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Sign up failed"); setLoading(false); return; }
      signIn(data.token, data.user);
      router.push(role === "customer" ? "/customer/home" : "/worker/home");
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  function nextStep() {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) { setError(lang === "hi" ? "नाम आवश्यक है" : "Name is required"); return; }
      if (!/^\d{10}$/.test(form.mobile)) { setError(lang === "hi" ? "10 अंकों का मोबाइल नंबर दर्ज करें" : "Enter a valid 10-digit mobile number"); return; }
      if (role === "worker") {
        if (!form.category) { setError(lang === "hi" ? "सेवा श्रेणी चुनें" : "Select a service category"); return; }
        if (form.dob) {
          const birthDate = new Date(form.dob);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          if (age < 18) {
            setError(lang === "hi" ? "कार्यकर्ता की आयु 18 वर्ष या उससे अधिक होनी चाहिए" : "Worker must be 18 years or older");
            return;
          }
        } else {
          setError(lang === "hi" ? "जन्म तिथि आवश्यक है" : "Date of birth is required");
          return;
        }
      }
    }
    setStep(s => s + 1);
  }

  return (
    <div className="page">
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.25rem 0", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <img src="/logo.png" alt="CoopServe Logo" style={{ height: 32, width: "auto", objectFit: "contain" }} />
        </Link>
        <button onClick={toggle} className="btn btn-ghost btn-sm" style={{ fontWeight: 700 }}>{lang === "en" ? "हिं" : "EN"}</button>
      </header>

      <main className="page-content" style={{ paddingTop: "1.5rem" }}>
        {/* Step indicator */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-primary-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
            {roleLabel} — {lang === "hi" ? `चरण ${step}/${steps.length}` : `Step ${step} of ${steps.length}`}
          </p>
          <h2 style={{ color: "var(--color-text-primary)", fontSize: "1.5rem", marginBottom: "0.75rem" }}>{steps[step - 1]}</h2>
          {/* Progress bar */}
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${(step / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="animate-fade-in" key={step}>
          {/* ── Step 1: Personal ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div className="form-group">
                <label className="label" htmlFor="name">{t.auth.fields.name}</label>
                <input id="name" className="input" type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder={lang === "hi" ? "आपका पूरा नाम" : "Your full name"} required />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="mobile">{t.auth.mobile}</label>
                <input id="mobile" className="input" type="tel" inputMode="numeric" maxLength={10} value={form.mobile} onChange={e => set("mobile", e.target.value.replace(/\D/g, ""))} placeholder={t.auth.mobilePlaceholder} required />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="dob">{t.auth.fields.dob}</label>
                <input id="dob" className="input" type="date" value={form.dob} onChange={e => set("dob", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="address">{t.auth.fields.address}</label>
                <input id="address" className="input" type="text" value={form.address} onChange={e => set("address", e.target.value)} placeholder={lang === "hi" ? "आपका पता" : "Your full address"} />
              </div>
              {role === "worker" && (
                <>
                  <div className="form-group">
                    <label className="label">{t.auth.fields.category}</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      {CATEGORIES.map(cat => (
                        <button key={cat} type="button"
                          onClick={() => set("category", cat)}
                          style={{
                            padding: "0.625rem 0.75rem", borderRadius: "var(--radius-md)", fontSize: "0.8125rem", fontWeight: 500, cursor: "pointer", textAlign: "left", transition: "all 150ms ease",
                            background: form.category === cat ? "rgba(43,66,175,0.25)" : "var(--color-surface-700)",
                            border: form.category === cat ? "1px solid var(--color-primary-400)" : "1px solid rgba(255,255,255,0.07)",
                            color: form.category === cat ? "var(--color-primary-300)" : "var(--color-text-secondary)",
                          }}>
                          {lang === "hi" ? CATEGORY_HI[cat] : cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                      <input type="checkbox" checked={form.certified} onChange={e => set("certified", e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: "var(--color-primary-400)" }} />
                      <span style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                        {lang === "hi" ? "मेरे पास PMKVY / NSC प्रमाणपत्र है" : "I have a PMKVY / NSC certification"}
                      </span>
                    </label>
                    {!form.certified && (
                      <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.375rem" }}>
                        {lang === "hi" ? "सुझाव: PMKVY प्रमाणन से आपकी रैंकिंग बेहतर होती है।" : "Tip: PMKVY certification improves your job-match ranking."}
                      </p>
                    )}
                    {form.certified && (
                      <div className="animate-slide-up" style={{ marginTop: "1rem", background: "var(--color-surface-700)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                        <label className="label" style={{ marginBottom: "0.5rem" }}>
                          {lang === "hi" ? "अपना प्रमाणपत्र अपलोड करें" : "Upload your certificate"}
                        </label>
                        <input type="file" accept="image/*,.pdf" className="input" style={{ background: "#ffffff", padding: "0.5rem" }} />
                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem", margin: 0 }}>
                          {lang === "hi" ? "केवल PDF, JPG या PNG (अधिकतम 5MB)" : "PDF, JPG, or PNG only (max 5MB)"}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 2: Security & Profile ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div className="form-group">
                <label className="label">{lang === "hi" ? "प्रोफ़ाइल चित्र (वैकल्पिक)" : "Profile Picture (Optional)"}</label>
                <input type="file" accept="image/*" className="input" style={{ background: "#ffffff", padding: "0.5rem" }} onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (file.size > 20 * 1024) {
                      setError(lang === "hi" ? "प्रोफ़ाइल चित्र 20KB से कम होना चाहिए" : "Profile picture must be less than 20KB");
                      e.target.value = "";
                      return;
                    }
                    setError("");
                    const img = new Image();
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      img.src = ev.target?.result as string;
                    };
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      const MAX_SIZE = 150; // Keep very small to stay < 20KB
                      let width = img.width;
                      let height = img.height;

                      if (width > height) {
                        if (width > MAX_SIZE) {
                          height *= MAX_SIZE / width;
                          width = MAX_SIZE;
                        }
                      } else {
                        if (height > MAX_SIZE) {
                          width *= MAX_SIZE / height;
                          height = MAX_SIZE;
                        }
                      }

                      canvas.width = width;
                      canvas.height = height;
                      const ctx = canvas.getContext("2d");
                      ctx?.drawImage(img, 0, 0, width, height);
                      
                      // 0.6 quality on a 150px image will easily be under 10-15KB
                      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
                      set("profileImageBase64", compressedBase64);
                    };
                    reader.readAsDataURL(file);
                  }
                }} />
                {form.profileImageBase64 && (
                  <p style={{ fontSize: "0.75rem", color: "var(--color-primary-500)", marginTop: "0.25rem", marginBottom: 0 }}>
                    {lang === "hi" ? "चित्र संलग्न किया गया" : "Image compressed and attached"}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="label" htmlFor="aadhaar">{lang === "hi" ? "आधार नंबर" : "Aadhaar Number"}</label>
                <input id="aadhaar" className="input" type="text" maxLength={12} value={form.aadhaar} onChange={e => set("aadhaar", e.target.value.replace(/\D/g, ""))} placeholder="1234 5678 9012" required />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="pan">{lang === "hi" ? "पैन नंबर" : "PAN Number"}</label>
                <input id="pan" className="input" type="text" maxLength={10} value={form.pan} onChange={e => set("pan", e.target.value.toUpperCase())} placeholder="ABCDE1234F" required />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="password">{t.auth.password}</label>
                <div style={{ position: "relative" }}>
                  <input id="password" className="input" type={showPassword ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} placeholder={t.auth.passwordPlaceholder} required style={{ width: "100%", paddingRight: "3rem" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>{showPassword ? "👁️‍🗨️" : "👁️"}</button>
                </div>
              </div>
              <div className="form-group">
                <label className="label" htmlFor="confirm">{lang === "hi" ? "पासवर्ड की पुष्टि करें" : "Confirm Password"}</label>
                <div style={{ position: "relative" }}>
                  <input id="confirm" className="input" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder={t.auth.passwordPlaceholder} required style={{ width: "100%", paddingRight: "3rem" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>{showPassword ? "👁️‍🗨️" : "👁️"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
              <p style={{ color: "var(--color-error)", fontSize: "0.875rem", margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            {step > 1 && (
              <button type="button" className="btn btn-ghost" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>
                {t.common.back}
              </button>
            )}
            {step < 2 ? (
              <button type="button" className="btn btn-primary" onClick={nextStep} style={{ flex: 2 }}>
                {t.common.next}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ flex: 2 }}>
                {loading ? <span className="spinner" style={{ width: "1.125rem", height: "1.125rem" }} /> : null}
                {loading ? (lang === "hi" ? "खाता बन रहा है..." : "Creating account...") : t.auth.signUp}
              </button>
            )}
          </div>
        </div>

        <div className="divider" />
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>
          {t.auth.haveAccount}{" "}
          <Link href={`/auth/signin?role=${role}`} style={{ color: "var(--color-primary-400)", fontWeight: 600, textDecoration: "none" }}>
            {t.auth.signIn}
          </Link>
        </p>
      </main>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}>
      <SignUpForm />
    </Suspense>
  );
}

