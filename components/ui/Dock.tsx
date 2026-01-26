
import React from 'react';

interface DockItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

interface DockProps {
    items: DockItem[];
}

export const Dock: React.FC<DockProps> = ({ items }) => {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-end gap-2 px-4 py-3 bg-[#0A0A0C]/50 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/5 transition-all hover:bg-[#0A0A0C]/70">
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.onClick}
                        className="group relative flex flex-col items-center gap-1 transition-all duration-300 hover:-translate-y-2"
                    >
                        {/* Tooltip */}
                        <span className="absolute -top-10 bg-black/80 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                            {item.label}
                        </span>

                        {/* Icon Container */}
                        <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 shadow-lg
                        ${item.isActive
                                ? 'bg-white/10 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'
                            }
                    `}>
                            {item.icon}
                        </div>

                        {/* Active Dot */}
                        <div className={`w-1 h-1 rounded-full bg-white transition-opacity ${item.isActive ? 'opacity-100' : 'opacity-0'}`}></div>
                    </button>
                ))}
            </div>
        </div>
    );
};
