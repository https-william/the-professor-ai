import BreakdownClient from "./BreakdownClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function BreakdownIdPage() {
  return <BreakdownClient />;
}
