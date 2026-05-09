import NavPill from "@/components/landing/NavPill";

export default function GlossaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavPill />
      {children}
    </>
  );
}
