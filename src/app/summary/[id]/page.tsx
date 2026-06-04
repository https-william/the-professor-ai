import SummaryClient from "./SummaryClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function SummaryIdPage() {
  return <SummaryClient />;
}
