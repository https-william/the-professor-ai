
import React, { ReactNode } from 'react';

interface GlassWindowProps {
    title: string;
    children: ReactNode;
    onClose?: () => void;
    onMinimize?: () => void;
    isActive?: boolean;
    className?: string;
    icon?: ReactNode;
    isMaximized?: boolean;
}

export const GlassWindow: React.FC<GlassWindowProps> = ({
    title,
    children,
    onClose,
    onMinimize,
    isActive = true,
    className = '',
    icon
}) => {
    return (
        <div className={`glass-window flex flex-col transition-all duration-300 ${isActive ? 'ring-1 ring-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] scale-100 opacity-100' : 'opacity-95 scale-[0.99] blur-[0.5px] grayscale-[20%]'} ${className}`}>

            {/* Title Bar (Mac Style) */}
            <div className="h-9 min-h-[36px] bg-white/[0.03] border-b border-white/5 flex items-center justify-between px-4 select-none cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2 group">
                    <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-400/80 hover:bg-red-500 transition-colors flex items-center justify-center shadow-inner"></button>
                    <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-amber-400/80 hover:bg-amber-500 transition-colors flex items-center justify-center shadow-inner"></button>
                    <div className="w-3 h-3 rounded-full bg-emerald-400/80 hover:bg-emerald-500 transition-colors shadow-inner"></div>
                </div>

                <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2 opacity-80">
                    {icon && <span className="text-white/70 w-3 h-3">{icon}</span>}
                    <span className="text-xs font-medium text-white/90">{title}</span>
                </div>

                <div className="w-12"></div>
            </div>

            {/* Content Area */}
            <div className="flex-grow flex flex-col overflow-hidden relative custom-scrollbar">
                {children}
            </div>
        </div>
    );
};
