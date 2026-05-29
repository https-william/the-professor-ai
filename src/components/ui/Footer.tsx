"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BrandLogo from "./BrandLogo";
import { AnimatePresence } from "framer-motion";
import { PrivacyPolicyModal, TermsOfUseModal } from "@/components/ui/LegalModals";
import StandardContainer from "./StandardContainer";

export default function Footer() {
  const [mounted, setMounted] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms]     = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show Footer on public marketing/informational routes
  const isPublicRoute = pathname === "/" || 
                        pathname.startsWith("/blog") || 
                        pathname.startsWith("/legal") ||
                        pathname.startsWith("/login") ||
                        pathname.startsWith("/signup") || 
                        pathname.startsWith("/forgot-password");

  if (!isPublicRoute) return null;

  if (!mounted) return <div className="w-full h-12" />; // Placeholder to prevent layout shift

  return (
    <>
      <footer
        className="w-full border-t relative z-[1]"
        style={{
          background: "var(--background-secondary)",
          borderColor: "var(--border)",
        }}
      >
        <StandardContainer className="py-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo size="xs" />
            <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
              AI study companion · Smart academic success
            </p>
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={() => setShowPrivacy(true)}
              className="text-xs font-bold transition-all hover:text-[var(--foreground)] underline cursor-pointer"
              style={{ color: "var(--foreground-secondary)" }}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setShowTerms(true)}
              className="text-xs font-bold transition-all hover:text-[var(--foreground)] underline cursor-pointer"
              style={{ color: "var(--foreground-secondary)" }}
            >
              Terms & Conditions
            </button>
            <p className="text-[11px]" style={{ color: "var(--foreground-muted)" }}>
              © {new Date().getFullYear()} The Professor
            </p>
          </div>
        </StandardContainer>
      </footer>


      <AnimatePresence>
        {showPrivacy && <PrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}
        {showTerms   && <TermsOfUseModal   onClose={() => setShowTerms(false)}   />}
      </AnimatePresence>
    </>
  );
}
