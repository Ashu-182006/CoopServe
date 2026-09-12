"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

function AdminUsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBlock = async (id: string, isBlocked: boolean) => {
    if (!confirm(`Are you sure you want to ${isBlocked ? "unblock" : "block"} this user?`)) return;
    setActioning(id);
    try {
      const res = await fetch(`/api/admin/users/${id}/block`, { method: "POST" });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(`Failed: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error processing action.");
    } finally {
      setActioning(null);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  const workers = users.filter((u) => u.role === "worker");
  const customers = users.filter((u) => u.role === "customer");

  return (
    <div className="page" style={{ paddingBottom: "2rem" }}>
      <header style={{ padding: "1.25rem", maxWidth: 1000, margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/admin/dashboard" style={{ textDecoration: "none", color: "var(--color-text-primary)", fontSize: "1.25rem", fontWeight: 700 }}>
            ←
          </Link>
          <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-primary)" }}>
            Users Management
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/admin/dashboard" className="btn btn-sm btn-ghost" style={{ fontWeight: 600, border: "1px solid var(--color-surface-600)" }}>Dashboard</Link>
          <Link href="/admin/stats" className="btn btn-sm btn-ghost" style={{ fontWeight: 600, border: "1px solid var(--color-surface-600)" }}>Stats</Link>
          <Link href="/admin/users" className="btn btn-sm" style={{ fontWeight: 800, background: "var(--color-primary-100)", border: "1px solid var(--color-primary-400)", color: "var(--color-primary-800)" }}>Users</Link>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", width: "100%", padding: "0 1.25rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        <div className="card" style={{ padding: "1.5rem", overflowX: "auto" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "var(--color-text-primary)" }}>Workers</h2>
          {workers.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--color-text-muted)" }}>No workers found.</p>
          ) : (
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>ID / Name</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>Mobile</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>Status</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: w.isBlocked ? 0.6 : 1 }}>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <div style={{ fontWeight: 600 }}>{w.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{w.id}</div>
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem" }}>{w.mobile}</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem" }}>
                      {w.isBlocked ? (
                        <span style={{ color: "var(--color-error)", fontWeight: 600 }}>Blocked</span>
                      ) : (
                        <span style={{ color: "var(--color-success)", fontWeight: 600 }}>Active</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <button 
                        className="btn btn-sm" 
                        style={{ background: w.isBlocked ? "#22c55e" : "var(--color-error)", color: "#fff", padding: "0.3rem 0.6rem" }}
                        onClick={() => toggleBlock(w.id, w.isBlocked)}
                        disabled={actioning === w.id}
                      >
                        {w.isBlocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ padding: "1.5rem", overflowX: "auto" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "var(--color-text-primary)" }}>Customers</h2>
          {customers.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--color-text-muted)" }}>No customers found.</p>
          ) : (
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>ID / Name</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>Mobile</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>Status</th>
                  <th style={{ padding: "0.75rem 0.5rem", color: "var(--color-text-secondary)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: c.isBlocked ? 0.6 : 1 }}>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{c.id}</div>
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem" }}>{c.mobile}</td>
                    <td style={{ padding: "0.75rem 0.5rem", fontSize: "0.9rem" }}>
                      {c.isBlocked ? (
                        <span style={{ color: "var(--color-error)", fontWeight: 600 }}>Blocked</span>
                      ) : (
                        <span style={{ color: "var(--color-success)", fontWeight: 600 }}>Active</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <button 
                        className="btn btn-sm" 
                        style={{ background: c.isBlocked ? "#22c55e" : "var(--color-error)", color: "#fff", padding: "0.3rem 0.6rem" }}
                        onClick={() => toggleBlock(c.id, c.isBlocked)}
                        disabled={actioning === c.id}
                      >
                        {c.isBlocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" /></div>}>
      <AdminUsersScreen />
    </Suspense>
  );
}
