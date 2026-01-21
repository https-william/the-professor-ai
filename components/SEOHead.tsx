
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
    title: string;
    description: string;
    image?: string;
    type?: 'website' | 'article' | 'profile';
    path?: string;
    schema?: any; // JSON-LD Structured Data
}

export const SEOHead: React.FC<SEOHeadProps> = ({
    title,
    description,
    image = 'https://the-professor-ai.vercel.app/og-default.png',
    type = 'website',
    path = '',
    schema
}) => {
    const siteUrl = 'https://the-professor-ai.vercel.app';
    const fullUrl = `${siteUrl}${path}`;
    const fullTitle = `${title} | The Professor AI`;

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="theme-color" content="#000000" />
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={fullUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />

            {/* AEO / JSON-LD Structured Data (Agent Beacon) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};
