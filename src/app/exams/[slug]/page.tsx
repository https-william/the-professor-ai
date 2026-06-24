import { Metadata } from "next";
import { notFound } from "next/navigation";
import ExamBlueprintClient from "./ExamBlueprintClient";

type ExamData = {
  name: string;
  fullName: string;
  year: string;
  description: string;
  difficulty: "High" | "Medium" | "Extreme";
  silos: { title: string; points: string[] }[];
  cta: string;
};

const examRegistry: Record<string, ExamData> = {
  jamb: {
    name: "JAMB",
    fullName: "Joint Admissions and Matriculation Board (UTME)",
    year: "2026",
    description: "The 2026 JAMB season is expected to be the most competitive yet. Success requires more than reading—it requires CBT excellence and smart retrieval.",
    difficulty: "High",
    silos: [
      { title: "CBT Simulation", points: ["Timed practice under exam conditions", "Interface desensitization", "Automatic marking & correction"] },
      { title: "Syllabus Excellence", points: ["Use of English intensive drills", "Subject-specific retrieval loops", "Past question trend analysis"] }
    ],
    cta: "Secure your 300+ score"
  },
  waec: {
    name: "WAEC",
    fullName: "West African Senior School Certificate Examination (WASSCE)",
    year: "2026",
    description: "Master the WAEC marking scheme. We turn complex syllabus requirements into structured, high-yield revision plans.",
    difficulty: "High",
    silos: [
      { title: "Marking Scheme Logic", points: ["Learning what examiners look for", "Essay structuring frameworks", "Practical theory drills"] },
      { title: "Subject Silos", points: ["Biology pathways mapping", "Chemistry logic drills", "Physics derivation practice"] }
    ],
    cta: "Guarantee your A1s"
  },
  neco: {
    name: "NECO",
    fullName: "National Examinations Council (SSCE)",
    year: "2026",
    description: "National standard excellence. Our AI-native strategy aligns perfectly with the NECO curriculum for maximum performance.",
    difficulty: "Medium",
    silos: [
      { title: "Curriculum Alignment", points: ["NECO-specific past question bank", "Logic-first objective practice", "Time management sprints"] }
    ],
    cta: "Dominate the SSCE"
  },
  sat: {
    name: "Digital SAT",
    fullName: "Scholastic Assessment Test",
    year: "2026",
    description: "The Digital SAT demands adaptive logic. We provide the highest-fidelity practice for the 2026 test cycle.",
    difficulty: "Extreme",
    silos: [
      { title: "Adaptive Logic", points: ["Module 2 'Hard' difficulty simulation", "Desmos calculator hacking", "Contextual reading strategies"] }
    ],
    cta: "Master the 1600"
  },
  gcse: {
    name: "GCSE",
    fullName: "General Certificate of Secondary Education",
    year: "2026",
    description: "Grade 9 performance is a result of strategy, not just effort. Align your revision with the 2026 exam board specs.",
    difficulty: "High",
    silos: [
      { title: "Exam Board Locking", points: ["AQA specification excellence", "Edexcel pattern recognition", "OCR logic drills"] }
    ],
    cta: "Unlock Grade 9"
  }
};

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
