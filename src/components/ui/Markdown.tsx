import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles } from 'lucide-react';

const mdComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-2xl font-black text-[var(--foreground)] mb-6 mt-2 tracking-tight" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 mt-10 flex items-center gap-3 border-b border-[var(--border)] pb-2" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-base font-bold text-[var(--foreground)] mb-3 mt-8" {...props} />,
    h4: ({node, ...props}: any) => <h4 className="text-sm font-bold text-[var(--foreground)] mb-2 mt-6 uppercase tracking-wider" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-6 leading-relaxed text-base text-[var(--foreground-secondary)] opacity-90" {...props} />,
    ul: ({node, ...props}: any) => <ul className="mb-8 space-y-3 list-none" {...props} />,
    ol: ({node, ...props}: any) => <ol className="mb-8 space-y-4 list-decimal pl-5" {...props} />,
    li: ({node, ...props}: any) => (
        <li className="flex gap-3 text-base text-[var(--foreground-secondary)] items-start" {...props}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] mt-2.5 flex-shrink-0 opacity-40" />
            <span className="opacity-90">{props.children}</span>
        </li>
    ),
    strong: ({node, ...props}: any) => <strong className="font-black text-[var(--foreground)]" {...props} />,
    code: ({node, ...props}: any) => <code className="px-1.5 py-0.5 rounded bg-[var(--foreground)]/5 font-mono text-[12px] text-[var(--blue)]" {...props} />,
    blockquote: ({node, ...props}: any) => (
        <blockquote className="border-l-2 border-[var(--blue)]/50 pl-4 py-2 my-8 italic text-[var(--foreground-muted)] bg-[var(--blue)]/5 rounded-r-xl" {...props} />
    ),
};

export default function Markdown({ children }: { children: string }) {
    return (
        <div className="!font-tiempos">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {children}
            </ReactMarkdown>
            
            {/* AI Transparency Watermark */}
            <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center gap-2 text-[10px] text-[var(--foreground-muted)] opacity-40 select-none">
                <Sparkles size={12} className="text-[var(--blue)]" />
                <p className="leading-tight font-black uppercase tracking-widest">
                    AI-generated Synthesis • Verify critical facts
                </p>
            </div>
        </div>
    );
}
