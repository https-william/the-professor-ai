"use client";

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

/**
 * BrandLogo: The Professor — Real Logo with Theme-Aware Switching
 * 
 * Uses the actual brand SVGs:
 * - /logo-dark.svg  → Shown in dark mode (light pen on dark bg)
 * - /logo-light.svg → Shown in light mode (dark pen on light bg)
 */
export const BrandLogo: React.FC<{ 
    className?: string; 
    size?: 'sm' | 'md' | 'lg' | 'xl'; 
    forceDark?: boolean;
    showBackground?: boolean;
}> = ({
    className = "",
    size = "md",
    forceDark = false,
    showBackground = false,
}) => {
    const { resolvedTheme } = useTheme();

    const sizes = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-16 h-16",
        xl: "w-24 h-24",
    };

    const isDark = forceDark || resolvedTheme === 'dark';

    return (
        <div className={`relative ${sizes[size]} ${className}`}>
             <img 
                src="/brand/professor-og-logo.svg" 
                alt="The Professor Logo"
                className="w-full h-full object-contain"
                loading="eager"
            />
        </div>
    );
};

export default BrandLogo;
