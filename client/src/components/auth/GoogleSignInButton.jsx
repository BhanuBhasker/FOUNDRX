import { useEffect, useRef } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Renders Google's official Sign-In button using Google Identity Services
 * (loaded globally via the <script> tag in index.html). On success it
 * hands the raw ID token credential to `onCredential`, which the caller
 * exchanges with POST /api/auth/google.
 */
export function GoogleSignInButton({ onCredential, onError }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return undefined;

    let cancelled = false;

    function initialize() {
      if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response?.credential) onCredential(response.credential);
          else onError?.(new Error('Google did not return a credential'));
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    }

    if (window.google?.accounts?.id) {
      initialize();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initialize();
        }
      }, 200);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [onCredential, onError]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 px-4 py-2 text-center text-xs text-slate-400">
        Google sign-in is not configured (set VITE_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  return <div ref={buttonRef} className="flex justify-center" />;
}
