export const dynamic = 'force-static';
export const revalidate = false;

import { Metadata } from "next";
import ShareClient from "./ShareClient";

interface Props {
  searchParams: Promise<{ id?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const { id } = await searchParams;
    return {
        title: `Shared Result | The Professor`,
        description: "Review academic materials shared by a peer on The Professor AI.",
        openGraph: {
            title: "Shared Academic Content",
            description: "High-rigor study materials prepared by The Professor.",
            type: "article",
            images: ["/logo.png"],
        }
    };
}

export default function SharePage() {
    return <ShareClient />;
}
