export const dynamic = 'force-static';
export const revalidate = false;

import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Metadata } from 'next';
import SEOHead from "@/components/SEOHead";
import SharedGenerationClient from "./SharedBlogPostClient";

interface Props {
    searchParams: Promise<{ id?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const { id } = await searchParams;
    if (!id) return { title: "Shared Result | The Professor" };
    
    const { data } = await supabaseAdmin
        .from("generations")
        .select("title, type")
        .eq("id", id)
        .single();
    
    if (!data) return { title: "Shared Result | The Professor" };

    const descriptions: Record<string, string> = {
        summary: "A comprehensive academic summary curated by The Professor AI.",
        flashcards: "A master-level flashcard deck for active recall and memorization.",
        quiz: "A high-rigor practice assessment designed to test material mastery."
    };

    return {
        title: `${data.title} | The Professor`,
        description: descriptions[data.type as keyof typeof descriptions] || "Academic materials prepared by the The Professor.",
        openGraph: {
            title: `${data.title} | The Professor`,
            description: descriptions[data.type as keyof typeof descriptions],
            type: "article",
            images: ["/logo.png"],
        }
    };
}

export default async function SharedGenerationPage({ searchParams }: Props) {
    const { id } = await searchParams;
    
    if (!id) {
        notFound();
    }

    const { data: generation, error } = await supabaseAdmin
        .from("generations")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !generation) {
        notFound();
    }

    const getSchema = () => {
        const descMap: Record<string, string> = {
            summary: "A comprehensive academic summary curated by The Professor AI.",
            flashcards: "A master-level flashcard deck for active recall and memorization.",
            quiz: "A high-rigor practice assessment designed to test material mastery."
        };
        
        return {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": generation.title,
            "description": descMap[generation.type] || "Academic materials prepared by The Professor.",
            "provider": {
                "@type": "Organization",
                "name": "The Professor",
                "url": "https://theprofessor.xyz"
            },
            "datePublished": generation.created_at,
            "author": {
                "@type": "Person",
                "name": "The Professor"
            }
        };
    };

    return (
        <>
            <SEOHead type="WebPage" data={getSchema()} />
            <SharedGenerationClient generation={generation} />
        </>
    );
}
