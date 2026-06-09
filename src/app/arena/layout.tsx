import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trivia Arena | The Professor AI",
    description: "Duel your classmates in real-time speed trivia challenges generated directly from your study notes."
};

export default function ArenaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
