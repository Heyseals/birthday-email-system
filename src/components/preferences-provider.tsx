"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type AppLang = "th" | "en";
export type AppTheme = "light" | "dark";

interface PreferencesContextValue {
  lang: AppLang;
  theme: AppTheme;
  toggleLang: () => void;
  toggleTheme: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  lang: "th",
  theme: "light",
  toggleLang: () => {},
  toggleTheme: () => {},
});

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<AppLang>(() => {
    if (typeof window === "undefined") return "th";
    const saved = window.localStorage.getItem("app_lang");
    return saved === "th" || saved === "en" ? saved : "th";
  });
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("app_theme");
    return saved === "light" || saved === "dark" ? saved : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === "th" ? "en" : "th";
      window.localStorage.setItem("app_lang", next);
      return next;
    });
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      window.localStorage.setItem("app_theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  };

  return (
    <PreferencesContext.Provider
      value={{ lang, theme, toggleLang, toggleTheme }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
