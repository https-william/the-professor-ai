import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mental Mentoring | The Professor",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
