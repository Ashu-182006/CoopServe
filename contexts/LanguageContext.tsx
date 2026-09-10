"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import en from "@/locales/en.json";
import hi from "@/locales/hi.json";

type Lang = "en" | "hi";
type Translations = typeof en;

const translations: Record<Lang, Translations> = { en, hi };

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("cs-lang") as Lang | null;
    if (saved === "en" || saved === "hi") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("cs-lang", l);
  };

  const toggle = () => setLang(lang === "en" ? "hi" : "en");

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang], toggle }}>
      <div className={lang === "hi" ? "lang-hi" : undefined}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageCtx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

/** Interpolate {{variable}} placeholders in translation strings */
export function interpolate(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`));
}
