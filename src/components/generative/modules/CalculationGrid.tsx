import React from "react";
import { Calculator, Variable } from "lucide-react";

export interface CalculationGridProps {
    data: any;
}

export default function CalculationGrid({ data }: CalculationGridProps) {
    // In a real scenario, the data would be parsed to find formulas.
    // We render a mockup table to demonstrate the generative UI.
    const mockParameters = [
        { name: "Principal (P)", val: "$10,000", type: "currency" },
        { name: "Interest Rate (r)", val: "0.05", type: "float" },
        { name: "Time (t)", val: "5 years", type: "integer" }
    ];

    return (
        <div className="scholar-card bg-zinc-950/45 border border-white/5 backdrop-blur-2xl p-6 rounded-[24px]">
            <div className="flex items-center gap-2 mb-6">
                <Calculator className="text-amber-400" size={18} />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Calculation Parameters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {mockParameters.map((param, i) => (
                    <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Variable size={12} className="text-violet-400" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">{param.name}</span>
                        </div>
                        <input 
                            type="text" 
                            defaultValue={param.val}
                            className="bg-transparent font-mono text-sm font-black text-amber-400 outline-none w-full border-b border-white/10 pb-1 focus:border-amber-400 transition-colors"
                        />
                    </div>
                ))}
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400/60 block mb-1">Live Output Calculation</span>
                    <span className="font-mono text-lg font-black text-emerald-400">A = P(1 + rt) = $12,500</span>
                </div>
                <button className="mt-4 sm:mt-0 px-4 py-2 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-wider rounded-lg cursor-pointer hover:bg-emerald-400 transition-colors">
                    Recalculate
                </button>
            </div>
        </div>
    );
}
