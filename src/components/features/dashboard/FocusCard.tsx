"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, BookOpen, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface FocusCardProps {
    topic: string;
    progress: number;
    lastAccessed: string;
    timeLeft?: string;
}

export function FocusCard({
    topic = "Organic Chemistry: Alkanes",
    progress = 65,
    lastAccessed = "2 hours ago",
    timeLeft = "15 min left"
}: Partial<FocusCardProps>) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full"
        >
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card to-card/50 hover:border-primary/40 transition-all duration-300 group">
                {/* Abstract Background Glow */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />

                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                <SparkleIcon className="w-3 h-3" />
                                <span>Continue Learning</span>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold font-serif mb-1 group-hover:text-primary transition-colors">
                                    {topic}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {lastAccessed}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> {timeLeft}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2 max-w-md">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Mastery</span>
                                    <span className="font-bold text-foreground">{progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <Button size="lg" className="w-full md:w-auto rounded-full px-8 h-12 text-md shadow-[0_0_30px_-10px_var(--color-primary)] hover:shadow-[0_0_40px_-5px_var(--color-primary)] transition-all">
                                <Play className="w-4 h-4 mr-2 fill-current" />
                                Resume Session
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function SparkleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
    )
}
