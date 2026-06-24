import React from "react";
import { motion } from "framer-motion";
import { Activity, Stethoscope, Search, Maximize2 } from "lucide-react";

export default function VisualAnatomy({ data }: { data: string }) {
    // A mock visual anatomy module for medical students
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 rounded-3xl p-6 md:p-10 shadow-2xl shadow-black/80 ring-1 ring-white/5 backdrop-blur-3xl"
        >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-xl md:text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
                        <Activity className="text-rose-400" size={28} />
                        Clinical Anatomy Lab
                    </h2>
                    <p className="text-sm font-medium text-white/50 mt-1 uppercase tracking-widest">
                        Interactive structural analysis
                    </p>
                </div>
                <button className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-black text-xs uppercase tracking-widest transition-all ring-1 ring-rose-500/30 flex items-center gap-2">
                    <Stethoscope size={14} className="fill-current" />
                    Start Diagnostics
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="relative h-[500px] rounded-2xl bg-zinc-900/50 ring-1 ring-white/5 overflow-hidden flex items-center justify-center">
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button className="p-2 rounded-lg bg-black/50 text-white/50 hover:text-white transition-colors">
                            <Search size={16} />
                        </button>
                        <button className="p-2 rounded-lg bg-black/50 text-white/50 hover:text-white transition-colors">
                            <Maximize2 size={16} />
                        </button>
                    </div>
                    {/* Placeholder for anatomical SVG/Model */}
                    <div className="flex flex-col items-center opacity-30">
                        <Activity size={120} className="text-rose-400 mb-4" />
                        <span className="font-mono text-xs uppercase tracking-widest">3D Model Rendering Offline</span>
                    </div>
                    
                    {/* Mock interactive hot-spots */}
                    <div className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,1)] animate-pulse" />
                    <div className="absolute top-1/2 right-1/3 w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,1)] animate-pulse" />
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl bg-zinc-950/50 ring-1 ring-white/5 p-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-4">Structural Analysis</h3>
                        <div className="prose prose-invert prose-sm text-white/70 max-h-[300px] overflow-y-auto pr-2">
                            {data ? (
                                <div dangerouslySetInnerHTML={{ __html: data }} />
                            ) : (
                                <p>Extracting terminology and physiological relationships from source document...</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl bg-zinc-900/50 p-4 border-l-2 border-rose-500">
                            <span className="text-[10px] text-white/40 font-bold uppercase">Pathology Risk</span>
                            <p className="text-lg font-black text-rose-400 mt-1">Elevated</p>
                        </div>
                        <div className="rounded-xl bg-zinc-900/50 p-4 border-l-2 border-emerald-500">
                            <span className="text-[10px] text-white/40 font-bold uppercase">System State</span>
                            <p className="text-lg font-black text-emerald-400 mt-1">Stable</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
