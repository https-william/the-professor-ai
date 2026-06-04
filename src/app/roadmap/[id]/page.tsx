import RoadmapClient from "./RoadmapClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function RoadmapIdPage() {
  return <RoadmapClient />;
}
