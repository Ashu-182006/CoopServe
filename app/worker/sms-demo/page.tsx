"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SMSDemoScreen() {
  const { lang, toggle } = useLanguage();
  const [messages, setMessages] = useState([
    { sender: "system", text: "CoopServe: New Job! Plumber needed at MG Road, Bangalore. Reply ACCEPT 9422 to accept." }
  ]);
  const [reply, setReply] = useState("");

  const handleSend = () => {
    if (!reply.trim()) return;
    const userMsg = reply.trim().toUpperCase();
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setReply("");

    setTimeout(() => {
      if (userMsg.includes("ACCEPT") || userMsg.includes("9422")) {
        setMessages(prev => [...prev, { sender: "system", text: "CoopServe: Job accepted successfully! Customer Name: Rahul. Ph: 9876543210. OTP for completion will be provided by customer." }]);
      } else {
        setMessages(prev => [...prev, { sender: "system", text: "CoopServe: Invalid command. Reply ACCEPT 9422 to accept." }]);
      }
    }, 1500);
  };

  return (
    <div className="page" style={{ paddingBottom: "2rem", minHeight: "100vh", background: "#f0f2f5", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/worker/home" style={{ textDecoration: "none", color: "#333", fontSize: "1.25rem", fontWeight: 700 }}>
            ←
          </Link>
          <div>
            <h1 style={{ fontSize: "1.1rem", margin: 0, color: "#111" }}>
              {lang === "hi" ? "CoopServe SMS सेवा" : "CoopServe SMS Service"}
            </h1>

          </div>
        </div>
        <button onClick={toggle} className="btn btn-ghost btn-sm" style={{ fontWeight: 700, color: "#333" }}>
          {lang === "en" ? "हिं" : "EN"}
        </button>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", width: "100%", padding: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
        


        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.sender === "system" ? "flex-start" : "flex-end",
              background: msg.sender === "system" ? "#fff" : "#dcf8c6",
              color: "#111",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              borderBottomLeftRadius: msg.sender === "system" ? 0 : "12px",
              borderBottomRightRadius: msg.sender === "user" ? 0 : "12px",
              maxWidth: "85%",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              fontSize: "0.95rem",
              lineHeight: 1.4
            }}>
              {msg.text}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", background: "#fff", padding: "0.5rem", borderRadius: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Text message"
            style={{ flex: 1, border: "none", background: "transparent", padding: "0.5rem 1rem", outline: "none", color: "#111" }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button 
            onClick={handleSend}
            style={{ width: 40, height: 40, borderRadius: "50%", background: "#25D366", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            ➤
          </button>
        </div>
      </main>
    </div>
  );
}
