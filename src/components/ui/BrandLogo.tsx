import React from 'react';

export const BrandLogo: React.FC<{ className?: string; size?: 'sm' | 'md' | 'lg' }> = ({
    className = "",
    size = "md"
}) => {
    const sizes = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-14 h-14"
    };

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            className={`${sizes[size]} ${className}`}
            fill="none"
            stroke="currentColor"
        >
            {/* Graduation Cap Top (Diamond) */}
            <path
                d="M50 25 L85 45 L50 65 L15 45 Z"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--foreground)] fill-[var(--accent)]/20"
            />

            {/* Cap Base */}
            <path
                d="M25 52 V70 C25 80 75 80 75 70 V52"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-[var(--foreground)] opacity-50"
            />

            {/* Tassel Button */}
            <circle cx="50" cy="45" r="3" fill="#fbbf24" stroke="none" />

            {/* Tassel (Hanging right) */}
            <path
                d="M50 45 C55 45 75 48 85 65"
                strokeWidth="2"
                stroke="#f59e0b"
                strokeLinecap="round"
            />
            {/* Tassel Fringe */}
            <path
                d="M85 65 L82 75 M85 65 L85 78 M85 65 L88 75"
                strokeWidth="1.5"
                stroke="#f59e0b"
            />

            {/* Neural Core Glow */}
            <circle
                cx="50"
                cy="45"
                r="10"
                className="stroke-[var(--accent)] opacity-30 animate-pulse"
                strokeWidth="1"
            />
        </svg>
    );
};

export default BrandLogo;
