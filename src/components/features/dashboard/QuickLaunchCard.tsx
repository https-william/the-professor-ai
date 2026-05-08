"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, Swords, PlusCircle, HelpCircle, Library } from "lucide-react";

interface QuickLaunchCardProps {
    title: string;
    desc: string;
    icon: string;
    href: string;
    color: string;
}

export default function QuickLaunchCard({ title, desc, icon, href, color }: QuickLaunchCardProps) {
    return (
        <Link href={href} className="group relative">
            <div className="p-6 md:p-7 h-full flex flex-col justify-between transition-all duration-500 group-hover:-translate-y-1 bg-[var(--bg-2)]/50 backdrop-blur-xl border border-[var(--border)] rounded-[28px] overflow-hidden">
                <div className="font-sans">
                    <div
                        className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-5"
                        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, boxShadow: `0 4px 16px color-mix(in srgb, ${color} 10%, transparent)` }}
                    >
                        {(() => {
                            const IconMap: Record<string, any> = {
                                forum: MessageCircle,
                                swords: Swords,
                                add_circle: PlusCircle,
                                library_books: Library,
                                arrow_forward: ArrowRight
                            };
                            const IconComp = IconMap[icon] || HelpCircle;
                            return <IconComp size={20} strokeWidth={2} style={{ color }} />;
                        })()}
                    </div>
                    <h3 className="text-lg font-black text-[var(--text)] mb-1 tracking-tight">{title}</h3>
                    <p className="text-[12px] text-[var(--text-3)] leading-relaxed font-bold">{desc}</p>
                </div>
                <div className="mt-6 flex justify-end">
                    <div className="w-8 h-8 rounded-full bg-[var(--text)]/5 group-hover:bg-[var(--text)] flex items-center justify-center transition-all duration-300">
                        <ArrowRight size={14} strokeWidth={3} className="text-[var(--text-3)] group-hover:text-[var(--bg)]" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
