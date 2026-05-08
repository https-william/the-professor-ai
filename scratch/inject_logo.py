with open('scratch/ProfessorLOGO.jsx', 'r') as f:
    svg = f.read()

svg = svg.replace('<style>', '<style>{`')
svg = svg.replace('</style>', '`}</style>')

out = f'''"use client";

import React from 'react';

export const BrandLogo: React.FC<{{
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}}> = ({{ className = "", size = "md" }}) => {{
    const sizeMap = {{
        xs: 16,
        sm: 24,
        md: 32,
        lg: 48,
        xl: 80,
    }};
    const px = sizeMap[size];

    return (
        <svg width={{px}} height={{px}} className={{`w-full h-full ${{className}}`}} viewBox="0 0 1000 1000" fillRule="evenodd" imageRendering="optimizeQuality" shapeRendering="geometricPrecision" xmlns="http://www.w3.org/2000/svg">
            {{/* The styles and paths from the original SVG */}}
            {svg.split('viewBox="0 0 1000 1000">')[1]}
    );
}};

export default BrandLogo;
'''

with open('src/components/ui/BrandLogo.tsx', 'w') as f:
    f.write(out)
