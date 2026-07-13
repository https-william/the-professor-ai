import { Metadata } from "next";
import { notFound } from "next/navigation";
import ExamBlueprintClient from "./ExamBlueprintClient";

import { examRegistry } from "@/lib/blog/exams";

export async function generateStaticParams() {
  return Object.keys(examRegistry).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = examRegistry[slug];
  if (!data) return { title: "Exam Not Found" };

  return {
    title: `${data.name} ${data.year} Revision & Study Guide | The Professor AI`,
    description: `${data.name} ${data.year}. ${data.description}`,
    keywords: [`${data.name} 2026`, `how to pass ${data.name}`, `best ai for ${data.name}`],
  };
}

export default async function ExamLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = examRegistry[slug.toLowerCase()];
  if (!data) notFound();

  return <ExamBlueprintClient slug={slug} data={data} />;
}
