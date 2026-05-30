import React from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/ui/BrandLogo';

export const PackHeader: React.FC<{ title: string; description?: string }> = ({ title, description }) => {
  const router = useRouter();
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        // Using existing toast system
        // @ts-ignore
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Link copied!', type: 'success' } }));
      });
    }
  };

  return (
    <section className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md rounded-xl shadow-lg mb-6">
      <div className="flex items-center space-x-4">
        <BrandLogo className="w-12 h-12 text-[var(--foreground)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
          {description && <p className="text-sm text-[var(--text-3)]">{description}</p>}
        </div>
      </div>
      <button
        onClick={handleShare}
        className="px-4 py-2 bg-[var(--blue)] text-white rounded-full hover:opacity-90 transition-opacity"
      >
        Share
      </button>
    </section>
  );
};
