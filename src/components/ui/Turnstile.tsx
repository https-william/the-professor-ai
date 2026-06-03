"use client";

import { forwardRef, useImperativeHandle } from "react";

export interface TurnstileHandle {
  /** Call this on form submit. Resolves immediately with undefined to skip/bypass captcha. */
  getToken: () => Promise<string | undefined>;
  /** Reset the widget (noop). */
  reset: () => void;
}

interface TurnstileProps {
  onVerify?: (token: string) => void;
}

const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  function Turnstile({ onVerify }, ref) {
    useImperativeHandle(ref, () => ({
      getToken: () => {
        return Promise.resolve(undefined);
      },
      reset: () => {},
    }));

    return null;
  }
);

export default Turnstile;
