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
    const [isClosing, setIsClosing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 150); // Match animation duration
    };

    const handleSelect = (option: string) => {
        onChange(option);
        handleClose();
    };

    const handleToggle = () => {
        if (disabled) return;
        if (isOpen) {
            handleClose();
        } else {
            setIsOpen(true);
        }
    };

    // Safe string handling
    const safeValue = String(value || "");
    const displayValue = safeValue.includes('(Locked)')
        ? safeValue.replace(' (Locked)', '')
        : safeValue;

    return (
        <div
            ref={containerRef}
            className={`liquid-drop ${isOpen ? 'liquid' : ''} ${isClosing ? 'closing' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleToggle}
        >
            {/* Label/Trigger */}
            <div className="drop-label">
                <span className="text-[10px] text-white/50 uppercase tracking-wider mr-1">{label}:</span>
                <span className="font-semibold">{displayValue}</span>
            </div>

            {/* Options Panel */}
            <div className="drop-options">
                {Array.isArray(options) && options.map((option) => {
                    const safeOption = String(option || "");
                    const isLocked = safeOption.includes('(Locked)');
                    const displayOption = isLocked
                        ? safeOption.replace(' (Locked)', '')
                        : safeOption;
                    const isActive = safeValue === safeOption || safeValue === displayOption;

                    return (
                        <div
                            key={safeOption}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isLocked) handleSelect(safeOption);
                            }}
                            className={`drop-item ${isActive ? 'active' : ''} ${isLocked ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            {displayOption}
                            {isLocked && (
                                <span className="ml-2 text-amber-500">🔒</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
