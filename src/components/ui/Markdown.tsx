import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const mdComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-2xl font-black text-[var(--foreground)] mb-6 mt-2 tracking-tight" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-lg font-bold text-[var(--foreground)] mb-4 mt-8 flex items-center gap-3 border-b border-[var(--border)] pb-2" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-base font-bold text-[var(--foreground)] mb-3 mt-6" {...props} />,
    h4: ({node, ...props}: any) => <h4 className="text-sm font-bold text-[var(--foreground)] mb-2 mt-4 uppercase tracking-wider" {...props} />,
    p: ({node, ...props}: any) => <p className="mb-4 leading-relaxed text-base text-[var(--foreground-secondary)]" {...props} />,
    ul: ({node, ...props}: any) => <ul className="mb-6 space-y-2 list-none" {...props} />,
    ol: ({node, ...props}: any) => <ol className="mb-6 space-y-3 list-decimal pl-5" {...props} />,
    li: ({node, ...props}: any) => (
        <li className="flex gap-3 text-base text-[var(--foreground-secondary)] items-start" {...props}>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2.5 flex-shrink-0" />
            <span>{props.children}</span>
        </li>
    ),
    strong: ({node, ...props}: any) => <strong className="font-black text-[var(--foreground)]" {...props} />,
    code: ({node, ...props}: any) => <code className="px-1.5 py-0.5 rounded bg-[var(--foreground)]/5 font-mono text-[12px] text-[var(--accent)]" {...props} />,
    blockquote: ({node, ...props}: any) => (
        <blockquote className="border-l-2 border-[var(--accent)]/50 pl-4 py-2 my-6 italic text-[var(--foreground-muted)] bg-[var(--accent)]/5 rounded-r-xl" {...props} />
    ),
    history_edu: ({node, ...props}: any) => <>{props.children}</>,
};

export default function Markdown({ children }: { children: string }) {
    return (
        <div className="!font-tiempos">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {children}
            </ReactMarkdown>
            
            {/* EU AI Act Transparency Watermark */}
            <div className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-[var(--foreground-muted)] opacity-50 select-none">
                <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                <p className="leading-tight">
                    AI-generated content. May contain inaccuracies.
                </p>
            </div>
        </div>
    );
}
