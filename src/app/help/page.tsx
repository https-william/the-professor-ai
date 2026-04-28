"use client";

import { Sidebar } from "@/components/ui/Sidebar";
import { motion } from "framer-motion";
import { HelpCircle, Book, MessageCircle, Mail, ExternalLink, ChevronRight } from "lucide-react";

const faqs = [
    { q: "How do I upload study materials?", a: "You can upload PDFs, documents, and notes directly in the Creation Studio or Library page." },
    { q: "What file types are supported?", a: "We support PDF, DOCX, TXT, MD, PPTX, and CSV files." },
    { q: "How does the Arena work?", a: "The Arena lets you test your knowledge with AI-generated quizzes based on your study materials." },
    { q: "Is my data secure?", a: "Yes, all your data is encrypted and stored securely. We never share your information." },
];

const resources = [
    { title: "Getting Started Guide", icon: Book, href: "#" },
    { title: "Community Discord", icon: MessageCircle, href: "#" },
    { title: "Contact Support", icon: Mail, href: "#" },
];

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-[#09090B]">
            <Sidebar />

            <main className="lg:ml-[260px] min-h-screen">
                <header className="h-16 px-8 flex items-center border-b border-[#1F1F23] sticky top-0 bg-[#09090B]/80 backdrop-blur-xl z-10">
                    <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-[#6366F1]" />
                        <span className="text-[15px] font-semibold text-white">Help & Support</span>
                    </div>
                </header>

                <div className="p-8 max-w-3xl space-y-8">
                    {/* Header */}
                    <div className="text-center py-8">
                        <h1 className="text-2xl font-bold text-white mb-2">How can we help?</h1>
                        <p className="text-[#71717A]">Find answers to common questions or reach out to our team.</p>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-3 gap-4">
                        {resources.map((resource, i) => (
                            <motion.a
                                key={i}
                                href={resource.href}
                                whileHover={{ y: -2, borderColor: '#2A2A2F' }}
                                className="bg-[#0F0F11] border border-[#1F1F23] rounded-xl p-5 flex flex-col items-center text-center gap-3 transition-all"
                            >
                                <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
                                    <resource.icon className="w-6 h-6 text-[#6366F1]" />
                                </div>
                                <span className="text-[14px] font-medium text-white">{resource.title}</span>
                                <ExternalLink className="w-4 h-4 text-[#52525B]" />
                            </motion.a>
                        ))}
                    </div>

                    {/* FAQs */}
                    <div>
                        <h2 className="text-[15px] font-semibold text-white mb-4">Frequently Asked Questions</h2>
                        <div className="space-y-3">
                            {faqs.map((faq, i) => (
                                <motion.details
                                    key={i}
                                    className="bg-[#0F0F11] border border-[#1F1F23] rounded-xl overflow-hidden group"
                                >
                                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                                        <span className="text-[14px] font-medium text-white">{faq.q}</span>
                                        <ChevronRight className="w-4 h-4 text-[#52525B] group-open:rotate-90 transition-transform" />
                                    </summary>
                                    <div className="px-4 pb-4 text-[13px] text-[#A1A1AA] leading-relaxed">
                                        {faq.a}
                                    </div>
                                </motion.details>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 border border-[#6366F1]/20 rounded-xl p-6 text-center">
                        <h3 className="text-[15px] font-semibold text-white mb-2">Still need help?</h3>
                        <p className="text-[13px] text-[#A1A1AA] mb-4">Our support team is here to assist you.</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-2.5 bg-[#6366F1] hover:bg-[#818CF8] text-white text-[13px] font-semibold rounded-lg transition-colors"
                        >
                            Contact Support
                        </motion.button>
                    </div>
                </div>
            </main>
        </div>
    );
}
