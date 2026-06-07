"use client";

import { useEffect } from "react";

type CapacitorAwareWindow = Window &
  typeof globalThis & {
    Capacitor?: unknown;
  };

export function PwaRegister() {
  useEffect(() => {
    const currentWindow = window as CapacitorAwareWindow;

    if (
      typeof window === "undefined" ||
      "Capacitor" in currentWindow ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
      console.warn("Service worker registration failed.", error);
    });
  }, []);

  return null;
}

export default PwaRegister;
