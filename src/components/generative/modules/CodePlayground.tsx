import React from "react";
import { motion } from "framer-motion";
import { Terminal, Play, Code2, Cpu } from "lucide-react";

export default function CodePlayground({ data }: { data: string }) {
    // A mock code execution playground for CS students
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 rounded-3xl p-6 md:p-10 shadow-2xl shadow-black/80 ring-1 ring-white/5 backdrop-blur-3xl"
        >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
                        <Code2 className="text-blue-400" size={28} />
                        Syntax Lab
                    </h2>
                    <p className="text-sm font-medium text-white/50 mt-1 uppercase tracking-widest">
                        Algorithm execution environment
                    </p>
                </div>
                <button className="px-5 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-black text-xs uppercase tracking-widest transition-all ring-1 ring-blue-500/30 flex items-center gap-2">
                    <Play size={14} className="fill-current" />
                    Test Logic
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-2 rounded-2xl bg-[#0d0d0d] ring-1 ring-white/10 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                        <span className="ml-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">main.ts</span>
                    </div>
                    <div className="p-4 text-sm font-mono text-blue-200/80 overflow-y-auto whitespace-pre-wrap max-h-[400px]">
                        {data || "// Upload code to begin execution analysis..."}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl bg-zinc-950/50 ring-1 ring-white/5 p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                            <Cpu size={12} /> Live Trace
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-white/40">Time Complexity</span>
                                <span className="text-amber-400 font-bold">O(N log N)</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-white/40">Space Complexity</span>
                                <span className="text-emerald-400 font-bold">O(1)</span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-white/40">Runtime</span>
                                <span className="text-white/80 font-bold">2.4ms</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-zinc-950/50 ring-1 ring-white/5 p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                            <Terminal size={12} /> Console Output
                        </h3>
                        <div className="p-3 bg-black/50 rounded-xl font-mono text-[10px] text-green-400">
                            &gt; Compilation successful.
                            <br/>&gt; Running test cases...
                            <br/>&gt; 5/5 Passed.
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
