import StudyPackClient from "./StudyPackClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function StudyPackPage() {
  return <StudyPackClient />;
}
