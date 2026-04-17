import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academic Summary | The Professor",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SummaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
