"use client";

import React from 'react';

/**
 * BrandLogo: The Professor — Standard Brand Logo
 */
export const BrandLogo: React.FC<{ 
    className?: string; 
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; 
}> = ({
    className = "",
    size = "md",
}) => {
    const sizes = {
        xs: "w-4 h-4",
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-20 h-20",
    };

    return (
        <div className={`relative flex items-center justify-center ${sizes[size]} ${className}`}>
             <img 
                src="/favicon-96x96.png" 
                alt="The Professor Logo"
                className="w-full h-full object-contain"
                loading="eager"
                onError={(e) => {
                    // Fallback to favicon.ico if PNG fails
                    e.currentTarget.src = '/favicon.ico';
                }}
            />
        </div>
    );
};

export default BrandLogo;
