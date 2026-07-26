import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Public sitekey — safe to ship to the browser. The matching secret lives only
// on the backend as TURNSTILE_SECRET.
export const TURNSTILE_SITEKEY =
  import.meta.env.VITE_TURNSTILE_SITEKEY || "0x4AAAAAAD-U6cwDw5T3S0k4";

// Name the backend reads the token from (config/turnstile.py TOKEN_FIELD).
export const TURNSTILE_FIELD = "cf-turnstile-response";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise = null;

// Explicit render rather than auto-render: most of these forms live in modals
// that mount long after the initial page load.
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Cloudflare Turnstile"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Renders the Turnstile challenge and hands the resulting token to `onVerify`.
 * Tokens are single-use, so call `ref.current.reset()` after a failed submit.
 */
const TurnstileWidget = forwardRef(function TurnstileWidget(
  { onVerify, className = "" },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const pendingRef = useRef(null);

  // Keep the latest callback without re-running the render effect.
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  const emitToken = (token) => {
    onVerifyRef.current?.(token);
    if (token && pendingRef.current) {
      pendingRef.current(token);
      pendingRef.current = null;
    }
  };

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      pendingRef.current = null;
      onVerifyRef.current?.("");
    },

    /**
     * Resets and resolves with the *next* token. Needed when one user action
     * hits two gated endpoints (signup then auto-login), since a token is
     * only good for a single siteverify call. Resolves "" if it times out.
     */
    refresh(timeoutMs = 15000) {
      if (widgetIdRef.current === null || !window.turnstile) {
        return Promise.resolve("");
      }
      window.turnstile.reset(widgetIdRef.current);
      onVerifyRef.current?.("");

      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          pendingRef.current = null;
          resolve("");
        }, timeoutMs);
        pendingRef.current = (token) => {
          clearTimeout(timer);
          resolve(token);
        };
      });
    },
  }));

  useEffect(() => {
    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current || widgetIdRef.current !== null) {
          return;
        }
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITEKEY,
          action: "turnstile-spin-v2",
          callback: (token) => emitToken(token),
          "expired-callback": () => onVerifyRef.current?.(""),
          "error-callback": () => onVerifyRef.current?.(""),
        });
      })
      .catch(() => {
        onVerifyRef.current?.("");
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`cf-turnstile ${className}`}
      data-action="turnstile-spin-v2"
    />
  );
});

export default TurnstileWidget;
