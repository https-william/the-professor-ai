import FlashcardClient from "./FlashcardClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function FlashcardIdPage() {
  return <FlashcardClient />;
}
