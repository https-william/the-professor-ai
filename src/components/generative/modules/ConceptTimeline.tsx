import React, { useState } from "react";
import { Clock, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ConceptTimelineProps {
    data: any;
}

export default function ConceptTimeline({ data }: ConceptTimelineProps) {
    // Mock timeline data to demonstrate Generative UI layout logic
    const timelineNodes = [
        { 
            period: "Foundation Phase", 
            title: "Initial Formation", 
            desc: "The beginning of the subject's development.",
            glossary: [{ term: "Formation", definition: "The act of assembling parts into a unified whole." }]
        },
        { 
            period: "Expansion Phase", 
            title: "Rapid Growth & Adoption", 
            desc: "The core principles expanded into wider usage.",
            glossary: [{ term: "Adoption", definition: "Taking up and making one's own." }]
        },
        { 
            period: "Modern Synthesis", 
            title: "Contemporary Applications", 
            desc: "How these historical facts apply to modern problems.",
            glossary: []
        }
    ];

    const [expandedNode, setExpandedNode] = useState<number | null>(0);

    return (
        <div className="scholar-card bg-zinc-950/45 border border-white/5 backdrop-blur-2xl p-6 rounded-[24px]">
            <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
                <Clock className="text-violet-400" size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Interactive Concept Timeline</h3>
            </div>

            <div className="relative border-l-2 border-white/10 ml-3 pl-6 space-y-6">
                {timelineNodes.map((node, idx) => {
                    const isExpanded = expandedNode === idx;
                    return (
                        <div key={idx} className="relative">
                            {/* Timeline Node Dot */}
                            <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-zinc-900 border-2 border-violet-500 shadow-[0_0_8px_rgba(150,115,245,0.4)]" />

                            <div 
                                className="cursor-pointer group"
                                onClick={() => setExpandedNode(isExpanded ? null : idx)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-400">{node.period}</span>
                                    {isExpanded ? <ChevronDown size={12} className="text-white/40" /> : <ChevronRight size={12} className="text-white/40" />}
                                </div>
                                <h4 className="text-base font-black text-white group-hover:text-amber-400 transition-colors mt-1">{node.title}</h4>
                            </div>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-sm text-white/60 font-bold leading-relaxed mt-3">{node.desc}</p>
                                        
                                        {node.glossary.length > 0 && (
                                            <div className="mt-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <BookOpen size={10} className="text-amber-400" />
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Inline Glossary</span>
                                                </div>
                                                {node.glossary.map((g, i) => (
                                                    <div key={i} className="text-xs">
                                                        <span className="font-black text-white">{g.term}: </span>
                                                        <span className="text-white/50">{g.definition}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
