"use client";

import { useState } from "react";
import BrandLogo from "./BrandLogo";
import { AnimatePresence } from "framer-motion";
import { PrivacyPolicyModal, TermsOfUseModal } from "@/components/ui/LegalModals";

export default function Footer() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms]     = useState(false);

  return (
    <>
      <footer
        className="w-full border-t mt-auto"
        style={{
          background: "var(--background-secondary)",
          borderColor: "var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
              AI study companion · Not an accredited institution
            </p>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={() => setShowPrivacy(true)}
              className="text-[11px] font-medium transition-colors hover:text-[var(--foreground)]"
              style={{ color: "var(--foreground-muted)" }}
            >
              Privacy
            </button>
            <button
              onClick={() => setShowTerms(true)}
              className="text-[11px] font-medium transition-colors hover:text-[var(--foreground)]"
              style={{ color: "var(--foreground-muted)" }}
            >
              Terms
            </button>
            <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
              © {new Date().getFullYear()} The Professor
            </p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
        {showTerms   && <TermsOfUseModal   onClose={() => setShowTerms(false)}   />}
      </AnimatePresence>
    </>
  );
}
