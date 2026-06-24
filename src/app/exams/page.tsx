import { Metadata } from "next";
import ExamsClient from "./ExamsClient";

export const metadata: Metadata = {
  title: "2026 AI Exam Guides | WAEC, JAMB, NECO, SAT & GCSE Preparation",
  description: "Smart AI-powered preparation guides for major 2026 regional and international exams.",
};

export default function ExamsPage() {
  return <ExamsClient />;
}
