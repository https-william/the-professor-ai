import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Match Game | The Professor",
    description: "Test your knowledge by matching terms to their definitions. Beat the clock for bonus XP!",
};

export default function MatchLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
