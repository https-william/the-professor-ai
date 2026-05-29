"use client";

import { useEffect, useRef } from "react";

interface TurnstileProps {
  onVerify: (token: string) => void;
}

export default function Turnstile({ onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.warn("NEXT_PUBLIC_TURNSTILE_SITE_KEY environment variable is not defined.");
      return;
    }

    // Generate a unique global callback name
    const callbackName = "onTurnstileSuccess_" + Math.random().toString(36).substring(2, 11);
    (window as any)[callbackName] = (token: string) => {
      onVerify(token);
    };

    // Load Turnstile script if not already present
    let script = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (!script) {
      const scriptEl = document.createElement("script");
      scriptEl.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      scriptEl.async = true;
      scriptEl.defer = true;
      document.body.appendChild(scriptEl);
    }

    const renderWidget = () => {
      if ((window as any).turnstile && containerRef.current) {
        try {
          // If we already rendered, clean it up first
          if (widgetIdRef.current) {
            (window as any).turnstile.remove(widgetIdRef.current);
          }
          
          widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: callbackName,
            size: "invisible",
          });
        } catch (e) {
          console.error("Turnstile render error:", e);
        }
      } else {
        setTimeout(renderWidget, 100);
      }
    };

    renderWidget();

    return () => {
      // Clean up global callback
      delete (window as any)[callbackName];
      // Clean up widget instance if it exists
      if (widgetIdRef.current && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore cleanup errors during unmount
        }
      }
    };
  }, [onVerify]);

  return <div ref={containerRef} style={{ display: "none" }} />;
}
