"use client";

import { useEffect, useState, Suspense, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePolling } from "@/hooks/usePolling";
import dynamic from "next/dynamic";
import { simulateWorkerQuote, acceptQuoteAndPay, simulateWorkerCompletion } from "./actions";


export default function BookingStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, user } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();

  const { data, error } = usePolling<{ booking: any; worker: any; payment: any; workerLocation?: any }>(
    `/api/bookings/${id}/status`,
    { intervalMs: 3000, token, enabled: !!token }
  );

  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);

  useEffect(() => {
    if (data?.booking?.status === "matched" && data?.booking?.pingExpiresAt) {
      const interval = setInterval(() => {
        const diff = new Date(data.booking.pingExpiresAt).getTime() - Date.now();
        if (diff > 0) {
          setTimeLeft(Math.ceil(diff / 1000));
        } else {
          setTimeLeft(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [data?.booking?.status, data?.booking?.pingExpiresAt]);

  if (!data && !error) {
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
        <p>{lang === "hi" ? "बुकिंग नहीं मिली।" : "Booking not found."}</p>
        <Link href="/customer/home" className="btn btn-primary">{lang === "hi" ? "वापस जाएं" : "Go Back"}</Link>
      </div>
    );
  }

  const { booking, worker } = data;

  const handleAcceptQuote = async () => {
    setShowPaymentModal(false);
    
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (e) {
      console.error("Confetti error", e);
    }

    await acceptQuoteAndPay(booking.id);
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 3000);
  };

  const handleCancelService = async () => {
    setShowCancelPopup(true);
    try {
      await fetch(`/api/bookings/${booking.id}/cancel`, { 
        method: "POST", 
        headers: { Authorization: `Bearer ${token}` } 
      });
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      setShowCancelPopup(false);
      router.push("/customer/home");
    }, 2500);
  };

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bounceIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .btn-danger-hover {
          transition: all 0.2s ease;
        }
        .btn-danger-hover:hover, .btn-danger-hover:active {
          background-color: #EF4444 !important;
          color: #ffffff !important;
          border-color: #EF4444 !important;
        }
      `}</style>
      <header style={{ padding: "1.25rem", maxWidth: 1200, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/customer/home" style={{ textDecoration: "none", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
          ←
        </Link>
        <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-primary)" }}>
          {lang === "hi" ? "बुकिंग स्थिति" : "Booking Status"}
        </h1>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 1.25rem" }}>
        
        {/* Status Header */}
        {!["matched", "quoted"].includes(booking.status) && (
          <div style={{ textAlign: "center", marginBottom: "2rem", padding: "1.5rem", background: "linear-gradient(135deg, #FFF4E0 0%, #FFDDA1 100%)", borderRadius: "var(--radius-xl)", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E293B", marginBottom: "0.5rem" }}>
              {booking.status === "pending" && (lang === "hi" ? "खोज रहे हैं..." : "Finding Match...")}
              {booking.status === "quoted" && (lang === "hi" ? "कोटेशन प्राप्त हुआ" : "Quote Received")}
              {booking.status === "accepted" && (lang === "hi" ? "भुगतान की प्रतीक्षा" : "Awaiting Payment")}
              {booking.status === "paid" && (lang === "hi" ? "भुगतान पूर्ण, कार्यकर्ता आ रहा है" : "Paid & En Route")}
              {booking.status === "in_progress" && (lang === "hi" ? "काम चल रहा है" : "Work in Progress")}
              {booking.status === "completed" && (lang === "hi" ? "काम पूरा हुआ" : "Completed")}
            </h2>
            <p style={{ color: "#64748B", fontSize: "0.95rem", margin: 0, fontWeight: 500 }}>
              {booking.category} • {booking.description}
            </p>
          </div>
        )}

        {/* Worker Matched State (Task 4.6) */}
        {booking.status === "matched" && worker && (
          <div className="card animate-slide-up" style={{ position: "relative", overflow: "hidden", padding: "2rem", textAlign: "center", background: "linear-gradient(135deg, #FFF4E0 0%, #FFDDA1 100%)", borderRadius: "var(--radius-xl)", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)" }}>
            {/* Background decorative circles */}
            <div style={{ position: "absolute", top: "-50px", left: "-50px", width: "250px", height: "250px", borderRadius: "50%", background: "linear-gradient(135deg, #FFC75F, #FF9671)", opacity: 0.3 }}></div>
            <div style={{ position: "absolute", bottom: "-100px", right: "-80px", width: "350px", height: "350px", borderRadius: "50%", background: "linear-gradient(135deg, #FFC75F, #FF9671)", opacity: 0.5 }}></div>
            <div style={{ position: "absolute", bottom: "40px", right: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "linear-gradient(135deg, #FF9671, #FFC75F)", opacity: 0.4 }}></div>

            <div style={{ position: "relative", zIndex: 1 }}>
              {/* Avatar and title row */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#ffffff", overflow: "hidden", flexShrink: 0, boxShadow: "0 4px 10px rgba(245, 158, 11, 0.3)" }}>
                  {worker.photoUrl ? <img src={worker.photoUrl} alt="Worker" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>{worker.name?.charAt(0).toUpperCase()}</span>}
                </div>
                <div style={{ textAlign: "left" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E293B", margin: "0 0 0.25rem" }}>
                    {lang === "hi" ? "कार्यकर्ता मिला!" : "Worker Matched!"}
                  </h2>
                  <p style={{ color: "#64748B", fontSize: "0.95rem", margin: 0, fontWeight: 500 }}>
                    {booking.category} • {booking.description}
                  </p>
                </div>
              </div>

              {/* Worker name and rating */}
              <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem", color: "#1E293B", fontWeight: 700 }}>{worker.name}</h3>
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
                <span style={{ fontSize: "1rem", color: "#F59E0B", fontWeight: 700 }}>★ {worker.bayesianAvg?.toFixed(1) ?? "4.0"}</span>
                {worker.certificationStatus && (
                  <span style={{ fontSize: "0.9rem", background: "#6EE7B7", color: "#064E3B", padding: "0.15rem 0.75rem", borderRadius: "var(--radius-full)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#064E3B" }}></span> Available
                  </span>
                )}
              </div>
              
              {/* Timer section */}
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "1.5rem", position: "relative" }}>
                <p style={{ fontSize: "0.95rem", color: "#64748B", marginBottom: "0.5rem", fontWeight: 500 }}>
                  {lang === "hi" ? "कार्यकर्ता की प्रतिक्रिया की प्रतीक्षा कर रहे हैं..." : "Waiting for worker to accept..."}
                </p>
                <div style={{ fontSize: "3rem", fontWeight: 900, fontFamily: "monospace", color: "#0F1B2A", textShadow: "none" }}>
                  {Math.floor(timeLeft / 60).toString().padStart(2, "0")}:{(timeLeft % 60).toString().padStart(2, "0")}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quote Received State */}
        {booking.status === "quoted" && worker && (
          <>
          <div className="card animate-slide-up" style={{ padding: "1.5rem", textAlign: "center", background: "linear-gradient(135deg, #FFF4E0 0%, #FFDDA1 100%)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "var(--radius-xl)", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1E293B", marginBottom: "1rem" }}>
              {lang === "hi" ? "कोट प्राप्त हुआ!" : "Quote Received!"}
            </h2>
            <div style={{
              width: 64, height: 64, borderRadius: "var(--radius-full)", background: "#F59E0B",
              margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#ffffff", overflow: "hidden", boxShadow: "0 4px 10px rgba(245, 158, 11, 0.3)"
            }}>
              {worker.photoUrl ? <img src={worker.photoUrl} alt="Worker" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>{worker.name?.charAt(0).toUpperCase()}</span>}
            </div>
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.25rem", color: "#1E293B", fontWeight: 700 }}>{worker.name}</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0 0 0.5rem", fontWeight: 600 }}>{worker.passportId}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
              <span style={{ fontSize: "0.9rem", color: "var(--color-warning)", fontWeight: 600 }}>★ {worker.bayesianAvg?.toFixed(1) ?? "New"}</span>
              {worker.certificationStatus && (
                <span style={{ fontSize: "0.85rem", background: "rgba(34,197,94,0.15)", color: "#22c55e", padding: "0.1rem 0.5rem", borderRadius: "var(--radius-full)" }}>
                  ✓ Certified
                </span>
              )}
            </div>
          </div>
          <div className="card animate-slide-up" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{lang === "hi" ? "कोटेशन विवरण" : "Quote Details"}</h3>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>{lang === "hi" ? "मजदूरी" : "Labour Wage"}</span>
              <span style={{ fontWeight: 600 }}>₹{(booking.quoteWage / 100).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>{lang === "hi" ? "पार्ट्स (अनुमानित)" : "Parts (Est.)"}</span>
              <span style={{ fontWeight: 600 }}>₹{(booking.quotePartsCost / 100).toFixed(2)}</span>
            </div>
            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1rem 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", fontSize: "1.2rem", fontWeight: 700 }}>
              <span>{lang === "hi" ? "कुल" : "Total"}</span>
              <span style={{ color: "var(--color-primary-400)" }}>₹{((booking.quoteWage + booking.quotePartsCost) / 100).toFixed(2)}</span>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button 
                onClick={async () => {
                  setRejecting(true);
                  try {
                    await fetch(`/api/bookings/${booking.id}/reject-quote`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
                  } finally {
                    setRejecting(false);
                  }
                }} 
                disabled={rejecting}
                className="btn btn-ghost btn-lg btn-danger-hover" 
                style={{ flex: 1, border: "1px solid var(--color-surface-600)" }}
              >
                {rejecting ? "..." : (lang === "hi" ? "अस्वीकार" : "Reject")}
              </button>
              <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary btn-lg" style={{ flex: 1 }}>
                {lang === "hi" ? "स्वीकार करें और भुगतान करें" : "Accept & Pay"}
              </button>
            </div>
          </div>
          </>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
            <div className="card animate-slide-up" style={{ width: "100%", maxWidth: 400, padding: "1.5rem", background: "#ffffff" }}>
              <h3 style={{ fontSize: "1.25rem", margin: "0 0 1rem", color: "var(--color-text-primary)" }}>{lang === "hi" ? "भुगतान विधि चुनें" : "Select Payment Method"}</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ justifyContent: "flex-start", padding: "1rem", border: "1px solid var(--color-surface-600)", borderRadius: "var(--radius-md)" }}>
                  <p style={{ margin: "0 0 0.75rem", fontWeight: 600 }}>UPI (Unified Payments Interface)</p>
                  <div className="animate-slide-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", padding: "0.5rem", background: "var(--color-surface-700)", borderRadius: "var(--radius-md)" }}>
                    <button className="btn btn-sm btn-ghost" style={{ background: "#ffffff", border: "1px solid var(--color-surface-600)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }} onClick={handleAcceptQuote}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" style={{ height: "16px", objectFit: "contain" }} />
                      Google Pay
                    </button>
                    <button className="btn btn-sm btn-ghost" style={{ background: "#ffffff", border: "1px solid var(--color-surface-600)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }} onClick={handleAcceptQuote}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="BHIM" style={{ height: "14px", objectFit: "contain" }} />
                      BHIM
                    </button>
                    <button className="btn btn-sm btn-ghost" style={{ background: "#ffffff", border: "1px solid var(--color-surface-600)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }} onClick={handleAcceptQuote}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" style={{ height: "18px", objectFit: "contain" }} />
                      PhonePe
                    </button>
                    <button className="btn btn-sm btn-ghost" style={{ background: "#ffffff", border: "1px solid var(--color-surface-600)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }} onClick={handleAcceptQuote}>
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" alt="Paytm" style={{ height: "12px", objectFit: "contain" }} />
                      Paytm
                    </button>
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "1rem" }}>
                <button onClick={() => setShowPaymentModal(false)} className="btn btn-ghost btn-danger-hover" style={{ flex: 1 }}>{lang === "hi" ? "रद्द करें" : "Cancel"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Success Popup */}
        {showSuccessPopup && (
          <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <div style={{ padding: "2.5rem 2rem", textAlign: "center", background: "linear-gradient(135deg, #FFF4E0 0%, #FFDDA1 100%)", borderRadius: "var(--radius-xl)", border: "2px solid #14B8A6", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.3)", animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1.5rem", color: "#14B8A6", animation: "bounceIcon 1.5s infinite" }}>✓</div>
              <h2 style={{ color: "#1E293B", margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>
                {lang === "hi" ? "भुगतान सफल!" : "Payment Successful!"}
              </h2>
              <p style={{ color: "#64748B", margin: 0, fontSize: "1.05rem", fontWeight: 500 }}>
                {lang === "hi" ? "आपका कार्यकर्ता रास्ते में है।" : "Your worker is on the way."}
              </p>
            </div>
          </div>
        )}

        {/* Cancel Popup */}
        {showCancelPopup && (
          <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <div style={{ padding: "2.5rem 2rem", textAlign: "center", background: "linear-gradient(135deg, #FFF4E0 0%, #FFDDA1 100%)", borderRadius: "var(--radius-xl)", border: "2px solid #EF4444", boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.3)", animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
              <h2 style={{ color: "#1E293B", margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>
                {lang === "hi" ? "सेवा रद्द की गई!" : "Service Cancelled!"}
              </h2>
              <p style={{ color: "#64748B", margin: 0, fontSize: "1.05rem", fontWeight: 500 }}>
                {lang === "hi" ? "वापस डैशबोर्ड पर जा रहे हैं..." : "Going back to dashboard..."}
              </p>
            </div>
          </div>
        )}

        {/* Paid / In Progress Tracking State */}
        {(booking.status === "paid" || booking.status === "in_progress") && (
          <div className="card animate-slide-up" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{lang === "hi" ? "कार्यकर्ता को ट्रैक करें" : "Track Worker"}</h3>
            {(() => {
              const R = 6371; // Earth radius km
              let distanceKm = null;
              if (booking.customerLat && booking.customerLng && data.workerLocation?.lat && data.workerLocation?.lng) {
                const dLat = ((data.workerLocation.lat - booking.customerLat) * Math.PI) / 180;
                const dLng = ((data.workerLocation.lng - booking.customerLng) * Math.PI) / 180;
                const a = Math.sin(dLat / 2) ** 2 + Math.cos((booking.customerLat * Math.PI) / 180) * Math.cos((data.workerLocation.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
                distanceKm = 2 * R * Math.asin(Math.sqrt(a));
              }

              return (
                <div style={{ marginBottom: "1.5rem" }}>
                  {/* Visual Strip */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", padding: "0 0.5rem" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#0F1B2A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", boxShadow: "0 4px 10px rgba(15,27,42,0.2)", zIndex: 2 }}>🏠</div>
                    <div style={{ flex: 1, height: 3, background: "repeating-linear-gradient(to right, #cbd5e1, #cbd5e1 8px, transparent 8px, transparent 16px)", margin: "0 1rem", position: "relative" }}>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 14, height: 14, borderRadius: "50%", background: "#14B8A6", border: "2px solid #ffffff", boxShadow: "0 0 10px rgba(20, 184, 166, 0.5)", animation: "pulse 2s infinite" }}></div>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#14B8A6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", boxShadow: "0 4px 10px rgba(20,184,166,0.2)", zIndex: 2 }}>👷</div>
                  </div>

                  {/* Status Line */}
                  <div style={{ textAlign: "center", marginBottom: "1.5rem", padding: "1rem", background: "rgba(20, 184, 166, 0.05)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(20, 184, 166, 0.1)" }}>
                    <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                      {worker?.name || "Worker"} {lang === "hi" ? "रास्ते में है" : "is on the way"}
                      {distanceKm !== null ? ` — ${distanceKm.toFixed(1)} km away` : ""}
                    </p>
                  </div>

                  {/* Worker Info & Contact */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "#f8fafc", borderRadius: "var(--radius-lg)", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span style={{ fontWeight: 800, color: "var(--color-text-primary)", fontSize: "1.1rem" }}>{worker?.name || "Worker"}</span>
                      <span style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>{booking.category}</span>
                    </div>
                    <a href={`tel:${worker?.phone || "1234567890"}`} className="btn btn-outline btn-sm" style={{ borderColor: "#0F1B2A", color: "#0F1B2A", fontWeight: 700, borderRadius: "var(--radius-full)" }}>
                      {lang === "hi" ? "संपर्क करें" : "Contact"}
                    </a>
                  </div>
                </div>
              );
            })()}
            {booking.status === "paid" && booking.otp && (
              <div style={{ textAlign: "center", padding: "1.5rem", background: "linear-gradient(135deg, #FFF4E0 0%, #FFDDA1 100%)", borderRadius: "var(--radius-xl)", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)", marginTop: "1.5rem" }}>
                <p style={{ fontSize: "0.95rem", color: "#64748B", marginBottom: "0.75rem", fontWeight: 500 }}>
                  {lang === "hi" ? "काम पूरा होने पर यह OTP दें" : "Provide this OTP on completion"}
                </p>
                <div style={{ fontSize: "3rem", letterSpacing: "0.75rem", fontWeight: 900, color: "#000000", fontFamily: "monospace", textShadow: "none" }}>
                  {booking.otp}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <button 
                onClick={handleCancelService}
                className="btn btn-outline btn-danger-hover" 
                style={{ width: "100%", borderColor: "#EF4444", color: "#EF4444" }}
              >
                {lang === "hi" ? "सेवा रद्द करें" : "Cancel Service"}
              </button>
            </div>
          </div>
        )}

        {/* Rating State */}
        {booking.status === "completed" && (
          <div className="card animate-slide-up" style={{ padding: "1.5rem", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="var(--color-success)" opacity="0.15" />
                <circle cx="12" cy="12" r="9" fill="var(--color-success)" />
                <path d="M8.5 12L11 14.5L15.5 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 1rem", color: "var(--color-text-primary)" }}>
              {lang === "hi" ? "काम पूरा हुआ!" : "Job Completed!"}
            </h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              {lang === "hi" ? "कृपया कार्यकर्ता को रेट करें" : "Please rate the worker's service"}
            </p>
            <RatingForm bookingId={booking.id} token={token} lang={lang} onSuccess={() => router.push("/customer/home")} />
          </div>
        )}

        {/* Demo Controls for Jury Presentation */}
        <div style={{ marginTop: "3rem", padding: "1rem", border: "1px dashed var(--color-surface-600)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Demo Controls</p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            {booking.status === "matched" && (
              <button onClick={async () => { await simulateWorkerQuote(booking.id); }} className="btn btn-sm" style={{ background: "transparent", color: "#F59E0B", border: "1px solid #F59E0B", borderRadius: "var(--radius-md)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem" }}>
                <span style={{ fontSize: "0.8rem" }}>▶</span> Simulate Worker Quote
              </button>
            )}
            {(booking.status === "paid" || booking.status === "in_progress") && (
              <button onClick={async () => { await simulateWorkerCompletion(booking.id); }} className="btn btn-sm btn-ghost">Simulate Job Complete</button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function RatingForm({ bookingId, token, lang, onSuccess }: { bookingId: string; token: string | null; lang: string; onSuccess: () => void }) {
  const [score, setScore] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 3 && !feedback.trim()) {
      alert(lang === "hi" ? "कम रेटिंग के लिए प्रतिक्रिया आवश्यक है।" : "Feedback is compulsory for low ratings.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score, feedbackText: feedback }),
      });
      if (!res.ok) throw new Error("Failed to submit rating");
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(lang === "hi" ? "रेटिंग सबमिट करने में विफल" : "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem", fontSize: "2rem", cursor: "pointer" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} onClick={() => setScore(star)} style={{ color: star <= score ? "var(--color-warning)" : "var(--color-surface-600)", transition: "color 0.2s" }}>
            ★
          </span>
        ))}
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder={lang === "hi" ? "प्रतिक्रिया" + (score >= 3 ? " (वैकल्पिक)" : " (आवश्यक)") : "Feedback" + (score >= 3 ? " (Optional)" : " (Required)")}
        required={score < 3}
        className="input"
        style={{ width: "100%", minHeight: "80px", marginBottom: "1rem", resize: "none" }}
      />
      <div style={{ marginBottom: "1.5rem", textAlign: "left" }}>
        <label className="label" style={{ fontSize: "0.85rem" }}>
          {lang === "hi" ? "फोटो अपलोड करें (वैकल्पिक)" : "Upload Photo (Optional)"}
        </label>
        <input type="file" accept="image/*" className="input" style={{ padding: "0.5rem" }} onChange={e => {
          if (e.target.files && e.target.files[0]) {
            setPhoto(e.target.files[0]);
          }
        }} />
      </div>
      <button type="submit" disabled={submitting} className="btn btn-primary btn-lg btn-full">
        {submitting ? "..." : (lang === "hi" ? "सबमिट करें" : "Submit Rating")}
      </button>
    </form>
  );
}
