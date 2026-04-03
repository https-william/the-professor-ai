import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from "next/link";
import { Metadata } from 'next';

export const revalidate = 3600; // optionally cache the page for an hour

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    
    // Quick fetch for title
    const { data } = await supabaseAdmin
        .from("generations")
        .select("title")
        .eq("id", id)
        .single();
    
    if (!data) return { title: "Shared Summary - The Professor AI" };
    return {
        title: `${data.title} - The Professor AI`,
        description: "A comprehensive academic summary curated by The Professor AI.",
    };
}

export default async function SharedGenerationPage({ params }: Props) {
    const { id } = await params;
    
    const { data: generation, error } = await supabaseAdmin
        .from("generations")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !generation) {
        notFound();
    }

    if (generation.type !== "summary") {
        // Handle other types later if needed, right now we only focus on summary
        return (
            <div className="min-h-screen bg-[#06060B] flex items-center justify-center text-white p-6 text-center">
                <div>
                    <span className="material-symbols-outlined text-4xl text-[var(--accent)]/50 mb-4 block">lock</span>
                    <h1 className="text-xl font-bold mb-2">Unsupported Format</h1>
                    <p className="text-sm text-white/50">Only summaries can be shared right now.</p>
                </div>
            </div>
        );
    }

    const { summary, style } = generation.content;
    const textSections = typeof summary.data === "string" ? summary.data : typeof summary === "string" ? summary : null;
    const sectionsArray = Array.isArray(summary.data) ? summary.data : Array.isArray(summary) ? summary : [];

    return (
        <div className="min-h-screen bg-[#06060B] text-white selection:bg-[var(--accent)]/20 pb-24 font-sans">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute w-[800px] h-[800px] top-[-20%] right-[-10%] rounded-full bg-[var(--accent)]/5 blur-[120px]" />
                <div className="absolute w-[600px] h-[600px] bottom-[-20%] left-[-10%] rounded-full bg-[var(--secondary)]/5 blur-[100px]" />
            </div>

            {/* Public Header */}
            <header className="sticky top-0 z-50 w-full h-16 border-b border-white/5 bg-[#06060B]/80 backdrop-blur-xl px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--secondary)] flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <span className="material-symbols-outlined text-lg font-black text-[#06060B]">school</span>
                    </div>
                    <div>
                        <h1 className="text-[13px] font-bold text-white/90">Mastered by The Professor</h1>
                        <p className="text-[9px] text-[#F59E0B]/50 uppercase tracking-[0.3em] font-black">Office of Academic Excellence</p>
                    </div>
                </div>
                <div>
                    <Link href="/" className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-black uppercase tracking-widest transition-all hidden sm:block">
                        Join The Class
                    </Link>
                </div>
            </header>

            {/* Document Content */}
            <main className="max-w-3xl mx-auto px-5 py-12">
                <div className="mb-12 flex flex-col items-center text-center">
                    <div className="px-3 py-1 mb-8 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)] text-[10px] font-black tracking-[0.4em] uppercase">
                        Verified {generation.type}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 tracking-tight font-heading leading-tight mb-4">
                        {generation.title}
                    </h2>
                    <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] font-bold">
                        Archived on {new Date(generation.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                <div className="space-y-6">
                    {textSections ? (
                        <div className="p-8 md:p-12 rounded-[40px] bg-[#0A0A0F]/80 border border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
                           {/* Decorative watermark corner */}
                           <div className="absolute top-0 right-0 p-8 opacity-[0.02] select-none pointer-events-none">
                               <span className="material-symbols-outlined text-[100px]">verified</span>
                           </div>
                           
                           <article className="max-w-none text-white/70 leading-relaxed font-serif prose prose-invert">
                               <ReactMarkdown 
                                   remarkPlugins={[remarkGfm]}
                                   components={{
                                       h1: ({node, ...props}) => <h1 className="text-2xl font-black text-white mb-6 mt-8 tracking-tight font-sans" {...props} />,
                                       h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mb-6 mt-10 flex items-center gap-3 border-b border-white/10 pb-3 font-sans" {...props} />,
                                       h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mb-4 mt-8 font-sans" {...props} />,
                                       p: ({node, ...props}) => <p className="mb-5 text-[15px]" {...props} />,
                                       ul: ({node, ...props}) => <ul className="mb-6 space-y-3 list-none pl-2" {...props} />,
                                       li: ({node, ...props}) => (
                                           <li className="flex gap-4 items-start" {...props}>
                                               <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2.5 flex-shrink-0 shadow-[0_0_8px_var(--accent)]" />
                                               <span className="flex-1">{props.children}</span>
                                           </li>
                                       ),
                                       strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                                       blockquote: ({node, ...props}) => (
                                           <blockquote className="border-l-[3px] border-[var(--accent)]/40 pl-6 py-2 my-8 italic text-white/40 bg-white/[0.02] rounded-r-2xl" {...props} />
                                       ),
                                   }}
                               >
                                   {textSections}
                               </ReactMarkdown>
                           </article>

                           {/* Bottom Proof */}
                           <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center opacity-30">
                               <p className="text-[9px] font-black uppercase tracking-[0.5em]">The Professor — Master Your Material</p>
                           </div>
                        </div>
                    ) : (
                        sectionsArray.map((section: any, idx: number) => (
                            <div 
                                key={idx} 
                                className="group p-8 md:p-10 rounded-[32px] bg-[#0A0A0F]/80 border border-white/5 hover:border-[var(--accent)]/20 transition-all duration-500 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                {section.heading && (
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-4 font-sans tracking-tight">
                                        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[var(--accent)] to-[var(--secondary)]" />
                                        {section.heading}
                                    </h3>
                                )}
                                
                                <div className="max-w-none text-white/70 leading-relaxed font-serif text-[15px]">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({node, ...props}) => <p className="mb-4" {...props} />,
                                            ul: ({node, ...props}) => <ul className="space-y-3 list-none pl-2" {...props} />,
                                            li: ({node, ...props}) => (
                                                <li className="flex gap-4 items-start" {...props}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2.5 flex-shrink-0" />
                                                    <span className="flex-1">{props.children}</span>
                                                </li>
                                            ),
                                            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                                        }}
                                    >
                                        {section.content || section.text || JSON.stringify(section)}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
