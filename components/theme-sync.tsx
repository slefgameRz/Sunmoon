"use client";

import { useEffect } from "react";

export default function ThemeSync() {
  useEffect(() => {
    // Clean up any dynamically added attributes that might cause hydration issues
    const body = document.body;
    const root = document.documentElement;
    
    // Remove common browser extension attributes that cause hydration mismatches
    const attributesToClean = ['data-gptw', 'data-new-gr-c-s-check-loaded', 'data-gr-ext-installed'];
    
    attributesToClean.forEach(attr => {
      body.removeAttribute(attr);
      root.removeAttribute(attr);
    });

    // Handle theme synchronization
    const theme = localStorage.getItem("theme") || "system";
    
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
      root.classList.toggle("light", !prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
      root.classList.toggle("light", theme === "light");
    }
  }, []);

  return null;
}