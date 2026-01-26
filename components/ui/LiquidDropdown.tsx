import React, { useState, useRef, useEffect } from 'react';

interface LiquidDropdownProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const LiquidDropdown: React.FC<LiquidDropdownProps> = ({
    label,
    value = "",
    options = [],
    onChange,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };

    const handleToggle = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
    };

    // Safe string handling
    const safeValue = String(value || "");
    const displayValue = safeValue.replace(' (Locked)', '');

    return (
        <div
            ref={containerRef}
            className={`relative min-w-[120px] font-mono select-none ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={handleToggle}
        >
            {/* Main Trigger */}
            <div className={`
                flex flex-col px-4 py-2 rounded border transition-all duration-300
                ${isOpen
                    ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-300'
                }
            `}>
                <span className="text-[9px] uppercase tracking-widest opacity-50 mb-1">{label}</span>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold tracking-wider truncate">{displayValue}</span>
                    <span className={`text-[10px] transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-400' : 'text-gray-500'}`}>▼</span>
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-[#0A0A0C] border border-cyan-500/30 rounded shadow-2xl z-50 overflow-hidden animate-slide-up-fade">
                    {Array.isArray(options) && options.map((option) => {
                        const safeOption = String(option || "");
                        const isLocked = safeOption.includes('(Locked)');
                        const displayOption = safeOption.replace(' (Locked)', '');
                        const isActive = safeValue === safeOption || safeValue === displayOption;

                        return (
                            <div
                                key={safeOption}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isLocked) handleSelect(safeOption);
                                }}
                                className={`
                                    px-4 py-3 text-xs tracking-wide border-b border-white/5 last:border-0 transition-colors
                                    ${isActive ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                                    ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                            >
                                <div className="flex justify-between items-center">
                                    <span>{displayOption}</span>
                                    {isLocked && <span className="text-[10px]">🔒</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
