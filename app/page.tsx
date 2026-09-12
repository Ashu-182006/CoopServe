"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";

const SERVICE_ICONS: { label: string; icon: string; hiLabel: string }[] = [
  { label: "Plumbing",        icon: "🔧", hiLabel: "प्लम्बिंग" },
  { label: "Carpentry",       icon: "🪚", hiLabel: "बढ़ईगिरी" },
  { label: "Cleaning",        icon: "🧹", hiLabel: "सफाई" },
  { label: "Electrical",      icon: "⚡", hiLabel: "बिजली" },
  { label: "Painting",        icon: "🖌️", hiLabel: "पेंटिंग" },
  { label: "Appliance Repair",icon: "🔨", hiLabel: "मरम्मत" },
];

const FAQS = [
  {
    enQ: "How do I sign in?",
    hiQ: "मैं साइन इन कैसे करूँ?",
    enA: "Choose 'Sign in as Customer' to book services, or 'Sign in as Worker' if you are a service provider. You will receive a simple OTP on your phone to log in securely.",
    hiA: "सेवाएं बुक करने के लिए 'ग्राहक के रूप में साइन इन करें' चुनें, या यदि आप एक सेवा प्रदाता हैं तो 'कार्यकर्ता के रूप में साइन इन करें'। सुरक्षित रूप से लॉग इन करने के लिए आपके फोन पर एक OTP भेजा जाएगा।"
  },
  {
    enQ: "How do I book a service?",
    hiQ: "मैं सेवा कैसे बुक करूँ?",
    enA: "Once signed in as a customer, click 'Book a Service', choose the category you need, provide a brief description, and we'll instantly match you with a verified worker nearby.",
    hiA: "ग्राहक के रूप में साइन इन करने के बाद, 'सेवा बुक करें' पर क्लिक करें, आवश्यक श्रेणी चुनें, विवरण दें, और हम आपको तुरंत पास के एक सत्यापित कार्यकर्ता से मिलाएंगे।"
  },
  {
    enQ: "How is the pricing decided?",
    hiQ: "मूल्य निर्धारण कैसे तय किया जाता है?",
    enA: "Workers provide a transparent quote before they start the job. The final payment is made securely through the app once the service is completed.",
    hiA: "कार्यकर्ता काम शुरू करने से पहले एक पारदर्शी कोटेशन प्रदान करते हैं। सेवा पूरी होने के बाद ऐप के माध्यम से अंतिम भुगतान सुरक्षित रूप से किया जाता है।"
  }
];

export default function LandingPage() {
  const { lang, toggle, t } = useLanguage();
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Already signed in — redirect to correct dashboard
      if (user.role === "customer") router.push("/customer/home");
      else if (user.role === "worker")   router.push("/worker/home");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page" style={{ background: "var(--color-surface-900)" }}>
      {/* Header / Nav Bar */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem 1.25rem",
        maxWidth: 1200,
        margin: "0 auto",
        width: "100%",
      }}>
        {/* Logo left */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Home size={32} color="var(--color-primary-500)" />
          <span style={{ fontWeight: 800, fontSize: "1.25rem", marginLeft: "0.5rem", color: "var(--color-text-primary)" }}>CoopServe</span>
        </div>

        {/* Links & Lang toggle right */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <nav style={{ display: "flex", gap: "1.5rem", alignItems: "center" }} className="hide-on-mobile">
            <a href="#how-it-works" style={{ textDecoration: "none", color: "var(--color-text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>{lang === "hi" ? "यह कैसे काम करता है" : "How it works"}</a>
            <a href="#for-workers" style={{ textDecoration: "none", color: "var(--color-text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>{lang === "hi" ? "श्रमिकों के लिए" : "For workers"}</a>
          </nav>
          <button
            onClick={toggle}
            className="btn btn-ghost btn-sm"
            style={{ fontWeight: 700, letterSpacing: "0.04em", background: "rgba(0,0,0,0.05)", borderRadius: "var(--radius-full)" }}
          >
            {lang === "en" ? "हिं" : "EN"}
          </button>
        </div>
      </header>

      <main className="page-content animate-fade-in" style={{ paddingTop: "3rem", display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          {/* Logo mark - Fixed white background with mixBlendMode */}
          <img src="/logo.png" alt="CoopServe Logo" style={{ height: 160, width: "auto", objectFit: "contain", margin: "0 auto 1.5rem", display: "block", mixBlendMode: "darken" }} />

          <h1 style={{ color: "var(--color-text-primary)", marginBottom: "0.75rem", fontSize: "2.5rem", lineHeight: 1.2 }}>
            {lang === "hi" ? "उचित सेवाएं," : "Fair Services,"}<br />
            <span style={{
              background: "linear-gradient(135deg, var(--color-accent-400), var(--color-accent-500))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {lang === "hi" ? "साथ मिलकर" : "Together"}
            </span>
          </h1>

          <p style={{ color: "var(--color-text-secondary)", fontSize: "1.05rem", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
            {lang === "hi"
              ? "घर की सेवाओं के लिए कुशल कारीगरों से जुड़ें — उचित मिलान, पारदर्शी मूल्य।"
              : "Connect with skilled workers for home services — fair matching, transparent pricing."}
          </p>

          {/* Stats/Trust Bar */}
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "0.6rem", 
            background: "#ffffff", 
            padding: "0.5rem 1rem", 
            borderRadius: "var(--radius-full)", 
            marginTop: "1.75rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid rgba(0,0,0,0.02)"
          }}>
            <div style={{ position: "relative", width: 8, height: 8 }}>
              <div style={{ position: "absolute", width: "100%", height: "100%", background: "var(--color-accent-500)", borderRadius: "50%", opacity: 0.5, transform: "scale(1.5)" }}></div>
              <div style={{ position: "absolute", width: "100%", height: "100%", background: "var(--color-accent-500)", borderRadius: "50%" }}></div>
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {lang === "hi" ? "पूरे भारत में कार्यकर्ता-मालिक" : "Worker-owners across India"}
            </span>
          </div>
        </div>





        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Link href="/auth/signin?role=customer" className="btn btn-primary btn-lg btn-full">
            {lang === "hi" ? "ग्राहक के रूप में साइन इन करें" : "Sign in as Customer"}
          </Link>
          <Link href="/auth/signin?role=worker" className="btn btn-primary btn-lg btn-full">
            {lang === "hi" ? "कार्यकर्ता के रूप में साइन इन करें" : "Sign in as Worker"}
          </Link>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link
            href="/auth/signin?role=admin"
            style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", textDecoration: "none" }}
          >
            {lang === "hi" ? "एडमिन लॉगिन" : "Admin Login"}
          </Link>
        </div>

        {/* Help Desk / FAQ */}
        <section id="how-it-works" style={{ marginTop: "4rem", padding: "3rem 1.25rem", background: "rgba(20, 184, 166, 0.03)", margin: "4rem -1.25rem -2rem", borderTop: "1px solid rgba(20, 184, 166, 0.1)" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "1.5rem", textAlign: "center" }}>
            {lang === "hi" ? "सहायता केंद्र (सामान्य प्रश्न)" : "Help Desk (FAQ)"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 800, margin: "0 auto" }}>
            {FAQS.map((faq, idx) => (
              <div key={idx} className="card" style={{ padding: "1.25rem", background: "#ffffff", borderRadius: "var(--radius-lg)", border: "1px solid rgba(0,0,0,0.03)", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 0.5rem" }}>
                  {lang === "hi" ? faq.hiQ : faq.enQ}
                </h3>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                  {lang === "hi" ? faq.hiA : faq.enA}
                </p>
              </div>
            ))}
          </div>
        </section>


      </main>
    </div>
  );
}
