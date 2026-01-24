
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
    image = 'https://www.theprofessor.xyz/og-image.png',
    type = 'website',
    path = '',
    schema
}) => {
    const siteUrl = 'https://www.theprofessor.xyz';
    const fullUrl = `${siteUrl}${path}`;
    const fullTitle = `${title} | The Professor - AI Study Tool`;

    // Default schema for SoftwareApplication
    const defaultSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "The Professor",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "2000"
        },
        "description": description
    };

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="theme-color" content="#050505" />
            <link rel="canonical" href={fullUrl} />

            {/* Additional SEO Meta Tags */}
            <meta name="keywords" content="AI study tool, exam generator, flashcard maker, quiz generator, study app, AI tutor, lecture notes, student productivity, free study tool" />
            <meta name="author" content="Vexis Automations" />
            <meta name="robots" content="index, follow" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="The Professor" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* JSON-LD Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(schema || defaultSchema)}
            </script>
        </Helmet>
    );
};
