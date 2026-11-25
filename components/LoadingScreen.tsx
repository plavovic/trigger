"use client";

import { useEffect, useState } from "react";
import { ScrollHeartbeat } from "@/components/ScrollHeartbeat";
import { useLanguage } from "@/components/LanguageProvider";

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const { language } = useLanguage();
  const german = language === "de";

  useEffect(() => {
    const startedAt = Date.now();
    let loaded = document.readyState === "complete";
    let timer: number | undefined;

    const finish = () => {
      loaded = true;
      if (Date.now() - startedAt >= 5000) setVisible(false);
    };
    const minimumTimer = window.setTimeout(() => {
      timer = undefined;
      if (loaded) setVisible(false);
    }, 5000);

    if (!loaded) window.addEventListener("load", finish, { once: true });
    return () => {
      window.removeEventListener("load", finish);
      window.clearTimeout(minimumTimer);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;
  return (
    <div className="loading-screen" role="status" aria-live="polite" aria-label={german ? "Laden" : "Loading"}>
      <img src="/logo.png" alt="Trigger Baits" className="loading-logo" />
      <ScrollHeartbeat />
      <p className="loading-label">{german ? "LADEN" : "LOADING"}<span className="loading-dots"><i>.</i><i>.</i><i>.</i></span></p>
    </div>
  );
}
