import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";

export const metadata = {
  title: "Terms of Use | The Professor",
  description: "Terms and conditions for using The Professor.",
};

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground-secondary)] pb-24">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/legal/privacy" className="text-sm hover:text-[var(--foreground)] transition-colors">Privacy Policy</Link>
            <ThemeToggle variant="minimal" />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 pt-32 prose-professor">
        <h1 className="font-heading text-4xl font-black text-[var(--foreground)] mb-2">Terms of Use</h1>
        <p className="text-sm text-[var(--foreground-muted)] mb-12">Last Updated: April 2026</p>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using The Professor, you agree to be bound by these Terms of Use. You must be at least 13 years of age to create an account and use this service, in accordance with the Children's Online Privacy Protection Act (COPPA).
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-4">2. Intellectual Property & Ownership</h2>
          <p>
            <strong>You retain full ownership of all documents, text, and materials you upload to The Professor.</strong> We claim no copyright or ownership over your private study materials. 
          </p>
          <p className="mt-4">
            Furthermore, we guarantee that <strong>our AI models DO NOT train on your private data</strong>. Your uploaded documents and generated study materials are strictly segregated and are not used to improve or fine-tune foundational language models.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-4">3. AI-Generated Content & Transparency</h2>
          <p>
            In compliance with the <strong>EU AI Act</strong>, you acknowledge that the flashcards, quizzes, and summaries provided by The Professor are generated entirely by Artificial Intelligence. While we strive for high accuracy, the system may occasionally produce incorrect or incomplete information. Human review is highly recommended, especially for high-stakes decisions or professional certifications.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-4">4. Non-Accreditation Notice</h2>
          <p>
            The Professor is an educational utility and an advanced AI study companion. We are <strong>not an accredited degree-granting institution</strong>. Any scores, progress metrics, or "levels" achieved within the platform are for personal motivation and study tracking only, and hold no official academic weight.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-4">5. User Conduct</h2>
          <p>
            You agree not to upload materials that violate the intellectual property rights of others, contain malicious code, or violate local laws. We reserve the right to terminate accounts that engage in abusive or illegal activities.
          </p>
        </section>
      </main>
    </div>
  );
}
