import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Learn Mode | The Professor",
    description: "Type your answers to actively recall and strengthen your memory. Fuzzy matching gives partial credit.",
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
