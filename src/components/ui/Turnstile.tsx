"use client";

import { forwardRef, useImperativeHandle, useEffect, useRef, useState } from "react";
import { useAppPlatform } from "@/hooks/useAppPlatform";

export interface TurnstileHandle {
  getToken: () => Promise<string | undefined>;
  reset: () => void;
}

interface TurnstileProps {
  onVerify?: (token: string) => void;
}

declare global {
  interface Window {
    onloadTurnstileCallback?: () => void;
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: (error: any) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  function Turnstile({ onVerify }, ref) {
    const { isNative } = useAppPlatform();
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADYVfoa21ZGWG7ds";

    useImperativeHandle(ref, () => ({
      getToken: async () => {
        if (isNative) return undefined;
        // Wait up to 3 seconds for token if not already loaded, but return what we have
        if (token) return token;
        
        // If no token yet, let's wait a brief moment for it to solve
        return new Promise<string | undefined>((resolve) => {
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (window.turnstile && widgetIdRef.current) {
              const currentToken = window.turnstile.getResponse(widgetIdRef.current);
              if (currentToken) {
                resolve(currentToken);
                clearInterval(interval);
                return;
              }
            }
            if (attempts > 30) { // 3 seconds timeout
              resolve(undefined);
              clearInterval(interval);
            }
          }, 100);
        });
      },
      reset: () => {
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
          setToken(null);
        }
      },
    }));

    useEffect(() => {
      if (isNative) return;

      // Load Turnstile script if not already present
      const scriptId = "cloudflare-turnstile-script";
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      
      const initializeWidget = () => {
        if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;
        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme: "dark",
            callback: (solvedToken) => {
              setToken(solvedToken);
              if (onVerify) onVerify(solvedToken);
            },
            "error-callback": (err) => {
              console.error("Turnstile error:", err);
            },
            "expired-callback": () => {
              setToken(null);
            }
          });
          widgetIdRef.current = id;
        } catch (e) {
          console.error("Failed to render Turnstile:", e);
        }
      };

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        script.onload = () => {
          const checkInterval = setInterval(() => {
            if (window.turnstile) {
              clearInterval(checkInterval);
              initializeWidget();
            }
          }, 50);
        };
      } else {
        if (window.turnstile) {
          initializeWidget();
        }
      }

      return () => {
        if (window.turnstile && widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {
            // ignore
          }
          widgetIdRef.current = null;
        }
      };
    }, [isNative, siteKey, onVerify]);

    if (isNative) return null;

    return (
      <div className="flex justify-center my-3 min-h-[65px]">
        <div ref={containerRef} />
      </div>
    );
  }
);

export default Turnstile;
