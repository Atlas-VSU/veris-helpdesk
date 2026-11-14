"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";
import { TURNSTILE_ACTION } from "@/features/submit-ticket/turnstile-constants";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  onError: (message: string) => void;
  onTokenChange: (token: string) => void;
  resetKey: number;
};

export function TurnstileWidget({ onError, onTokenChange, resetKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onError, onTokenChange });
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    callbacksRef.current = { onError, onTokenChange };
  }, [onError, onTokenChange]);

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action: TURNSTILE_ACTION,
      "response-field": false,
      callback: (token: string) => callbacksRef.current.onTokenChange(token),
      "error-callback": () => callbacksRef.current.onError("Spam protection could not load. Please refresh the page and try again."),
      "expired-callback": () => {
        callbacksRef.current.onTokenChange("");
        callbacksRef.current.onError("Spam protection expired. Please complete it again.");
      },
    });
  }, [siteKey]);

  useEffect(() => () => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      callbacksRef.current.onTokenChange("");
    }
  }, [resetKey]);

  if (!siteKey) {
    return <p className="text-sm text-red-700" role="alert">Spam protection is unavailable. Please try again later.</p>;
  }

  return (
    <div>
      <Script
        id="cloudflare-turnstile"
        onError={() => callbacksRef.current.onError("Spam protection could not load. Please refresh the page and try again.")}
        onReady={renderWidget}
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div aria-label="Spam protection" ref={containerRef} />
    </div>
  );
}
