"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  role: "customer" | "worker" | "admin";
  address?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("cs-token");
    const savedUser  = localStorage.getItem("cs-user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("cs-token");
        localStorage.removeItem("cs-user");
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("cs-token", newToken);
    localStorage.setItem("cs-user", JSON.stringify(newUser));
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("cs-token");
    localStorage.removeItem("cs-user");
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
