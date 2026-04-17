import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | The Professor",
  description: "Your personalized study dashboard. Track progress, review materials, and stay on top of your learning goals.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
