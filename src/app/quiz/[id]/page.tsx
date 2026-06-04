import QuizClient from "./QuizClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function QuizIdPage() {
  return <QuizClient />;
}
