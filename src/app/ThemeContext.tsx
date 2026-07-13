import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppTheme = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: AppTheme;
  /** The actually-applied theme after resolving "system" → dark|light */
  effectiveTheme: "dark" | "light";
  setTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  effectiveTheme: "dark",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("dark");

  const getEffective = (t: AppTheme): "dark" | "light" => {
    if (t === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return t;
  };

  const [effectiveTheme, setEffectiveTheme] = useState<"dark" | "light">(() => getEffective("dark"));

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
    setEffectiveTheme(getEffective(t));
  };

  // Listen for OS-level changes when theme is "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setEffectiveTheme(mq.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
