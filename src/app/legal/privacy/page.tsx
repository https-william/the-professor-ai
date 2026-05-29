import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";

export const metadata = {
  title: "Privacy Policy | The Professor",
  description: "How we process and protect your scholarly data.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground-secondary)] pb-24">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/legal/terms" className="text-sm hover:text-[var(--foreground)] transition-colors">Terms of Use</Link>
            <ThemeToggle variant="minimal" />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 pt-32 prose-professor">
        <h1 className="font-heading text-4xl font-black text-[var(--foreground)] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--foreground-muted)] mb-12">Last Updated: April 2026</p>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-4">1. Introduction & Compliance</h2>
          <p>
            Welcome to The Professor. We are committed to protecting your privacy and ensuring global compliance with data protection regulations, including the <strong>General Data Protection Regulation (GDPR)</strong> and the <strong>California Consumer Privacy Act (CCPA)</strong>. This policy explains how we collect, process, and protect your information.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-4">2. Document Processing & Storage</h2>
          <p>
            When you upload academic documents (PDFs, Word documents, Excel sheets) to The Professor for analysis, the following protocols apply:
          </p>
          <ul className="list-disc pl-5 mt-4 space-y-2">
            <li><strong>Processing:</strong> Documents are securely parsed in memory to generate study materials (flashcards, quizzes, summaries).</li>
            <li><strong>Encryption:</strong> All uploads and certificate links are transmitted over HTTPS. Documents stored on our servers are secured using <strong>AES-256 encryption at rest</strong>.</li>
            <li><strong>Retention:</strong> Uploaded source documents are retained only as long as necessary to provide the service. Users maintain the right to delete their documents and entire account history at any time via the Profile settings.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-4">3. Data Processing Agreement (DPA)</h2>
          <p>
            For institutional users and users within the EU/EEA, this Privacy Policy incorporates our standard Data Processing Agreement. We process user-provided data solely for the purpose of delivering the requested AI study tools. We do not sell your personal data to third parties.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-4">4. Your Data Rights (GDPR & CCPA)</h2>
          <p>
            You have the right to access, correct, export, or permanently delete your data. Our platform provides a direct <strong>"Delete My Account"</strong> mechanism that permanently wipes all your uploaded PDFs, AI-generated results, and account metadata from our servers.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-4">5. Third-Party AI Sub-Processors</h2>
          <p>
            To generate study materials, your document text is transmitted to highly secure, enterprise-tier AI providers. We have explicit agreements ensuring that <strong>your data is NOT used to train their models</strong>. Your intellectual property remains yours.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="font-heading text-2xl font-bold text-[var(--foreground)] mb-4">6. Security & Bot Protection (Cloudflare Turnstile)</h2>
          <p>
            To secure our platform, prevent spam, and protect user accounts from automated bot attacks, we use <strong>Cloudflare Turnstile</strong> on our login and registration pages. Turnstile operates as a privacy-friendly security tool. It analyzes minimal client-side Signals (such as TLS Fingerprints, IP addresses, User-Agent Headers, and site metadata) to distinguish human actions from bots. Cloudflare does not profile, target, or track individuals, and collects only what is strictly necessary to secure the service. For more details, you can consult the <strong>Cloudflare Turnstile Privacy Addendum</strong>.
          </p>
        </section>
      </main>
    </div>
  );
}
