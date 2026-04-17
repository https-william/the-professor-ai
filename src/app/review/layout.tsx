import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Daily Review | The Professor",
    description: "Review your due flashcards using spaced repetition to maximize long-term retention.",
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
