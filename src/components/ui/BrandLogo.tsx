"use client";

import React from 'react';

/**
 * BrandLogo — The Professor pen-nib SVG mark.
 * Monochrome: uses CSS currentColor so it inherits text colour.
 * On dark backgrounds it renders white; on light it renders black.
 */
export const BrandLogo: React.FC<{
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Force a specific colour instead of inheriting */
    color?: string;
}> = ({ className = "", size = "md", color }) => {
    const sizeMap = {
        xs: 16,
        sm: 24,
        md: 32,
        lg: 48,
        xl: 80,
    };
    const px = sizeMap[size];

    return (
        <svg
            width={px}
            height={px}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={color ? { color } : undefined}
            aria-label="The Professor"
        >
            {/*
              Pen-nib / mortarboard hybrid mark.
              A clean, minimal nib shape with a serif serif cap — academic yet sharp.
            */}
            {/* Nib body — wide flat top, tapering to point */}
            <path
                d="M20 36 L8 14 L12 10 L20 24 L28 10 L32 14 Z"
                fill="currentColor"
                opacity="0.95"
            />
            {/* Nib slit — gives it the pen character */}
            <path
                d="M20 36 L20 22"
                stroke="var(--background, #08080E)"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            {/* Nib cap / ferrule — the flat band at top */}
            <rect
                x="8"
                y="8"
                width="24"
                height="5"
                rx="2.5"
                fill="currentColor"
                opacity="0.7"
            />
            {/* Dot — the ink drop at the tip */}
            <circle
                cx="20"
                cy="36"
                r="1.5"
                fill="currentColor"
                opacity="0.5"
            />
        </svg>
    );
};

export default BrandLogo;
