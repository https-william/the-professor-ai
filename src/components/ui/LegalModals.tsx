"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export function LegalModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      {/* Modal */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)"
        }}
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--background-secondary)]">
          <h2 className="text-xl font-bold font-heading text-[var(--foreground)]">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--foreground)]/5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
  return (
    <LegalModal title="Privacy Policy" onClose={onClose}>
      <div className="space-y-4 text-sm text-[var(--foreground-secondary)]">
        <p>Your privacy is important to us. "The Professor" is designed with a privacy-first architecture to ensure your data remains secure and under your control.</p>
        <h3 className="text-base font-bold text-[var(--foreground)] mt-6">1. Data Storage & Local Priority</h3>
        <p>Uploaded documents (PDFs, slides, etc.) are processed locally in your browser memory whenever possible. We only transmit data to our servers when complex AI generation is required.</p>
        <h3 className="text-base font-bold text-[var(--foreground)] mt-6">2. Zero Training Policy</h3>
        <p>We do not use your personal study materials, generated quizzes, or session histories to train our foundational AI models.</p>
        <h3 className="text-base font-bold text-[var(--foreground)] mt-6">3. Deletion Rights (GDPR/CCPA)</h3>
        <p>You maintain full control. You can permanently delete your account and all associated data directly from your Profile settings at any time.</p>
        <h3 className="text-base font-bold text-[var(--foreground)] mt-6">4. Security & Turnstile Bot Protection</h3>
        <p>We use Cloudflare Turnstile to protect login and registration from automated bot traffic. Turnstile processes minimal client-side signals in a privacy-first manner to distinguish humans from bots, without tracking or profiling you.</p>
      </div>
    </LegalModal>
  );
}

export function TermsOfUseModal({ onClose }: { onClose: () => void }) {
  return (
    <LegalModal title="Terms of Use" onClose={onClose}>
      <div className="space-y-4 text-sm text-[var(--foreground-secondary)]">
        <p>Welcome to "The Professor". By using our services, you agree to these terms.</p>
        <h3 className="text-base font-bold text-[var(--foreground)] mt-6">1. Academic Integrity</h3>
        <p>The Professor is an AI-powered study companion designed to accelerate learning, not replace it. You agree not to use the platform to cheat on exams, plagiarize, or violate your institution's academic honesty policies.</p>
        <h3 className="text-base font-bold text-[var(--foreground)] mt-6">2. Not an Accredited Institution</h3>
        <p>We are a software platform, not a university. The Professor does not grant degrees, diplomas, or accredited certifications.</p>
        <h3 className="text-base font-bold text-[var(--foreground)] mt-6">3. Content Ownership</h3>
        <p>You retain full ownership of the intellectual property rights to the materials you upload. We claim no ownership over your study guides, personal notes, or proprietary documents.</p>
      </div>
    </LegalModal>
  );
}
