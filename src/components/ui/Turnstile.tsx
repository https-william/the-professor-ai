"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";

export interface TurnstileHandle {
  /** Call this on form submit. Resolves with a fresh token or rejects on timeout. */
  getToken: () => Promise<string>;
  /** Reset the widget (call after a failed auth attempt so a fresh token can be issued). */
  reset: () => void;
}

interface TurnstileProps {
  onVerify?: (token: string) => void;
}

const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  function Turnstile({ onVerify }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const pendingResolveRef = useRef<((token: string) => void) | null>(null);
    const pendingRejectRef = useRef<((reason?: unknown) => void) | null>(null);
    const latestTokenRef = useRef<string | null>(null);
    const callbackNameRef = useRef<string>(
      "onTurnstileSuccess_" + Math.random().toString(36).substring(2, 11)
    );

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    // Global success callback
    const handleSuccess = useCallback(
      (token: string) => {
        latestTokenRef.current = token;
        onVerify?.(token);
        if (pendingResolveRef.current) {
          pendingResolveRef.current(token);
          pendingResolveRef.current = null;
          pendingRejectRef.current = null;
        }
      },
      [onVerify]
    );

    useEffect(() => {
      if (!siteKey) {
        console.warn("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not defined.");
        return;
      }

      (window as any)[callbackNameRef.current] = handleSuccess;

      // Load script if needed
      if (!document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
        const script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }

      const renderWidget = () => {
        if ((window as any).turnstile && containerRef.current) {
          try {
            if (widgetIdRef.current) {
              (window as any).turnstile.remove(widgetIdRef.current);
            }
            widgetIdRef.current = (window as any).turnstile.render(containerRef.current, {
              sitekey: siteKey,
              callback: callbackNameRef.current,
              size: "invisible",
              // "managed" execution — we call execute() ourselves on submit
              execution: "execute",
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
        delete (window as any)[callbackNameRef.current];
        if (widgetIdRef.current && (window as any).turnstile) {
          try {
            (window as any).turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore cleanup errors
          }
        }
      };
    }, [siteKey, handleSuccess]);

    useImperativeHandle(ref, () => ({
      getToken: () => {
        // If we already have a fresh token, return it immediately
        if (latestTokenRef.current) {
          const t = latestTokenRef.current;
          latestTokenRef.current = null; // consume it so it's not reused
          return Promise.resolve(t);
        }

        return new Promise<string>((resolve, reject) => {
          pendingResolveRef.current = resolve;
          pendingRejectRef.current = reject;

          // Execute the invisible challenge
          if (widgetIdRef.current && (window as any).turnstile) {
            (window as any).turnstile.execute(widgetIdRef.current);
          } else {
            // If widget not ready, resolve without captcha (graceful degradation)
            // Supabase will reject if captcha is strictly required
            console.warn("Turnstile widget not ready, proceeding without token.");
            resolve("");
          }

          // Timeout after 15s so the form never hangs forever
          setTimeout(() => {
            if (pendingRejectRef.current) {
              pendingRejectRef.current(new Error("Captcha timed out. Please try again."));
              pendingResolveRef.current = null;
              pendingRejectRef.current = null;
            }
          }, 15000);
        });
      },

      reset: () => {
        latestTokenRef.current = null;
        if (widgetIdRef.current && (window as any).turnstile) {
          try {
            (window as any).turnstile.reset(widgetIdRef.current);
          } catch {
            // ignore
          }
        }
      },
    }));

    return <div ref={containerRef} style={{ display: "none" }} />;
  }
);

export default Turnstile;
