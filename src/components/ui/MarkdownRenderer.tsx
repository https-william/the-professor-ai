import React, { useState, useMemo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import { BubblyThinkingLoader } from "./Markdown";
import { motion, AnimatePresence } from "framer-motion";

interface MarkdownRendererProps {
    content: string;
    className?: string;
    isStreaming?: boolean;
}

// Pre-generated Feynman-style definitions — plain English, no jargon
// Covers the most common academic and technical terms across disciplines.
const DEFINITIONS_CATALOG: Record<string, string> = {
    // Biology & Medicine
    "homeostasis": "Your body keeping everything balanced — temperature, pH, blood sugar — automatically, without you thinking about it.",
    "osmosis": "Water moving through a membrane from a dilute (watery) side to a concentrated side, like water chasing a sponge.",
    "mitosis": "A cell making an exact copy of itself — one cell becomes two identical daughters.",
    "meiosis": "Cell division that halves the chromosome count to make sex cells (eggs/sperm) — needed for sexual reproduction.",
    "atp": "Adenosine Triphosphate — your cell's rechargeable battery. Every action in your body runs on ATP.",
    "dna": "The instruction manual stored in every cell, written in 4 chemical letters: A, T, G, C.",
    "rna": "The messenger that reads DNA instructions and carries them to the protein-building machinery.",
    "enzyme": "A protein that speeds up a chemical reaction without being consumed — like a key that unlocks reactions.",
    "photosynthesis": "Plants converting sunlight, water and CO₂ into sugar (food) — sunlight is the power source.",
    "respiration": "Breaking down glucose to release energy your cells can use. The opposite of photosynthesis.",
    "diffusion": "Particles spreading from where there's a lot of them to where there's fewer — like perfume filling a room.",
    "osmotic pressure": "The force created when water tries to move through a membrane to balance concentrations.",
    "membrane": "A thin, flexible boundary — like a gatekeeper — that controls what enters and leaves a cell.",
    "nucleus": "The control centre of a cell — holds the DNA and sends instructions to the rest of the cell.",
    "mitochondria": "The powerhouse of the cell — converts food and oxygen into ATP energy.",
    "ribosome": "The factory where proteins are built, following instructions from RNA.",
    "chromosome": "A tightly coiled package of DNA. Humans have 46 in most cells.",
    "gene": "A specific section of DNA that codes for a single protein or trait.",
    "allele": "A version of a gene — like different flavours of the same instruction.",
    "phenotype": "What you can actually observe — eye colour, height, behaviour.",
    "genotype": "The actual genetic code behind a trait, even if it's not visible.",
    "dominant": "A gene version that always shows up in the phenotype, even with just one copy.",
    "recessive": "A gene version that only shows up if you have two copies of it.",
    "antibody": "A Y-shaped protein your immune system makes to tag and neutralise specific threats.",
    "antigen": "A molecule on a pathogen (or cell surface) that triggers an immune response.",
    "pathogen": "Any organism that causes disease — bacteria, viruses, fungi, parasites.",
    "metabolism": "Every chemical reaction happening in your body to keep you alive — breaking down food, building molecules.",
    "hormone": "A chemical messenger released by a gland that travels through the blood to change behaviour in other organs.",
    "neuron": "A nerve cell — specialised for sending electrical and chemical signals across the nervous system.",
    "synapse": "The tiny gap between two neurons where signals are passed using chemical messengers.",
    "neurotransmitter": "A chemical released at a synapse to carry a signal from one neuron to the next.",
    "dopamine": "A neurotransmitter linked to reward, motivation, and learning. Spikes when something good happens unexpectedly.",
    "serotonin": "A neurotransmitter that helps regulate mood, sleep, and appetite.",
    "cortisol": "The stress hormone — released to give you energy in a crisis, but harmful if chronically elevated.",
    "adrenaline": "The fight-or-flight hormone — spikes your heart rate and alertness when danger is detected.",
    // Chemistry
    "molarity": "How many moles of a substance are dissolved in one litre of solution — measures concentration.",
    "titration": "Adding one solution to another of known concentration to find out how much is in the unknown.",
    "redox": "A reaction where one thing loses electrons (oxidation) and another gains them (reduction) — always together.",
    "oxidation": "Losing electrons in a chemical reaction — think of iron rusting.",
    "reduction": "Gaining electrons in a chemical reaction — the opposite of oxidation.",
    "catalyst": "A substance that speeds up a reaction without being used up.",
    "equilibrium": "When a reversible reaction's forward and backward rates are equal — looks static, but isn't.",
    "ph": "A scale from 0–14 measuring how acidic or basic something is. Below 7 = acidic, above 7 = basic.",
    "electrolysis": "Using electricity to drive a non-spontaneous chemical reaction — splitting water into H₂ and O₂.",
    "isotope": "Atoms of the same element with different numbers of neutrons — same identity, different mass.",
    "covalent bond": "Atoms sharing electrons to stay together — the sharing makes both atoms stable.",
    "ionic bond": "One atom gives an electron to another, making both charged. Opposite charges attract and bond.",
    // Physics
    "momentum": "Mass × velocity — how much 'oomph' a moving object has. Hard to stop if it's large or fast.",
    "inertia": "An object's resistance to changing its state of motion — a heavy bus needs more force to stop.",
    "entropy": "The tendency of systems to move toward disorder. Heat always flows from hot to cold.",
    "kinetic energy": "Energy of motion — the faster or heavier the object, the more it has.",
    "potential energy": "Stored energy based on position or condition — a stretched spring or a held-up book.",
    "work": "Force applied over a distance — in physics, you only 'work' if the object actually moves.",
    "power": "How fast work is done — same job done quicker = more power.",
    "velocity": "Speed in a specific direction — 60 km/h north is velocity; 60 km/h alone is speed.",
    "acceleration": "Rate of change of velocity — speeding up, slowing down, or changing direction.",
    "electromagnetic spectrum": "The full range of light and radiation — from radio waves to gamma rays. Visible light is a tiny slice.",
    "refraction": "Light bending as it passes from one medium to another (like air to water).",
    "resonance": "When an object vibrates at its natural frequency, absorbing energy and amplifying oscillations.",
    // Mathematics
    "derivative": "The rate of change of a function at a point — how steep the graph is right there.",
    "integral": "The area under a graph — reverse of differentiation.",
    "logarithm": "The exponent you need to raise a base to get a number. log₁₀(100) = 2 because 10² = 100.",
    "matrix": "A grid of numbers used to represent data or transformations — essential in linear algebra.",
    "vector": "A quantity with both size AND direction — velocity is a vector; speed is not.",
    "probability": "The chance of an event happening — expressed as a fraction or percentage between 0 and 1.",
    "standard deviation": "How spread out values are around the average. Large SD = data is scattered.",
    "variance": "Standard deviation squared — measures how spread out a dataset is.",
    "median": "The middle value when data is sorted — not affected by extreme outliers.",
    "mean": "The average — add all values, divide by how many there are.",
    // Computer Science
    "algorithm": "A step-by-step procedure for solving a problem. Like a recipe, but for computation.",
    "recursion": "A function that calls itself to solve smaller versions of the same problem.",
    "complexity": "A measure of how much time or memory an algorithm needs as input size grows.",
    "data structure": "A way of organising data so it can be used efficiently — arrays, lists, trees, etc.",
    "abstraction": "Hiding complexity behind a simple interface — you drive a car without understanding the engine.",
    "polymorphism": "One interface, many implementations — the same function call behaves differently based on the object.",
    "encapsulation": "Bundling data and the methods that operate on it inside one unit (a class), hiding internals.",
    "inheritance": "A class adopting properties and methods from a parent class — code reuse through family trees.",
    "api": "Application Programming Interface — a contract that lets two software systems talk to each other.",
    "database": "An organised collection of structured data, stored and accessed electronically.",
    "query": "A request sent to a database to retrieve or manipulate data.",
    "boolean": "A value that is only ever true or false — the foundation of all digital logic.",
    "variable": "A named container that stores a value your program can read and change.",
    "loop": "Code that repeats until a condition is met — do this task 10 times, or until done.",
    "function": "A reusable block of code that takes inputs and returns an output.",
    "binary": "A number system with only two digits — 0 and 1. All computers run on this.",
    "encryption": "Scrambling data so only authorised parties can read it.",
    "bandwidth": "The maximum data transfer rate of a network — how wide the information pipe is.",
    "latency": "The delay between sending data and receiving it. Low latency = fast response.",
    // Economics
    "inflation": "A general rise in prices over time — your money buys less as inflation rises.",
    "gdp": "Gross Domestic Product — the total value of all goods and services a country produces in a year.",
    "opportunity cost": "What you give up when you choose one option over another — the cost of the next best alternative.",
    "supply and demand": "Prices rise when demand exceeds supply; prices fall when supply exceeds demand.",
    "elasticity": "How sensitive demand or supply is to a price change — a luxury is elastic; medicine is inelastic.",
    "fiscal policy": "Government spending and taxation decisions to influence the economy.",
    "monetary policy": "Central bank control of money supply and interest rates to manage inflation and growth.",
    "equilibrium price": "The price where the quantity supplied equals the quantity demanded — the market clears.",
    // Study methods
    "active recall": "Testing yourself on material instead of re-reading it — forcing your brain to retrieve information.",
    "spaced repetition": "Reviewing content at increasing intervals to exploit how memory consolidates over time.",
    "feynman technique": "Explaining a concept simply, as if to a 5-year-old, to find and fix gaps in your understanding.",
    "cognitive retention": "Your brain's ability to store, consolidate, and retrieve processed information.",
    "reward circuitry": "The brain's pathway of neurons that fires dopamine during positive reinforcement loops.",
    "ventral tegmental area": "VTA: A group of neurons at the brain's base, central to the reward system.",
    "nucleus accumbens": "A key brain region that handles pleasure, motivation, and habit formation.",
    // Abstract terms
    "intention": "A conscious, purposeful commitment to act or behave in a specific way in the future.",
    "dream": "An aspiration, goal, or deep subconscious vision reflecting core values and motivations.",
    "willpower": "The cognitive ability to resist short-term temptations in order to meet long-term goals.",
    "success": "The accomplishment of an aim, purpose, or desired learning outcome.",
    "traps": "Cognitive biases or study habits (like passive re-reading) that lead to illusions of competence.",
    "blindspots": "Areas or details in the material that you think you know, but actually misunderstand.",
};

const TermPopover = ({ children }: { children?: React.ReactNode }) => {
    const termText = children ? String(children) : "";
    const lowercaseTerm = termText.toLowerCase().trim();
    
    // Look for exact match first, then partial match
    const staticDefinition = DEFINITIONS_CATALOG[lowercaseTerm] || 
        Object.entries(DEFINITIONS_CATALOG).find(([key]) => 
            lowercaseTerm.includes(key) || key.includes(lowercaseTerm)
        )?.[1];

    const [isVisible, setIsVisible] = useState(false);

    const displayDefinition = staticDefinition || 
        `A key concept from your study material — understanding this well will help you break down the whole topic.`;

    return (
        <span 
            className="relative inline-block cursor-help group/popover"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(!isVisible)}
        >
            <strong className="font-black text-[var(--accent)] underline decoration-dotted decoration-[var(--accent)]/50 underline-offset-4 hover:text-[var(--accent-light)] transition-colors">
                {children}
            </strong>
            <AnimatePresence>
                {isVisible && (
                    <motion.span
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 rounded-2xl bg-zinc-950/90 backdrop-blur-xl border border-zinc-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-xs text-zinc-200 z-50 text-center leading-relaxed"
                    >
                        <span className="block font-black text-white uppercase tracking-wider mb-1 text-[10px] text-[var(--blue-text)]">
                            Plain English
                        </span>
                        {displayDefinition}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-950/90" />
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
};

export default function MarkdownRenderer({ 
    content, 
    className,
    isStreaming = false 
}: MarkdownRendererProps) {
    // Sort keys by length descending to match longer phrases first
    const sortedKeys = useMemo(() => {
        return Object.keys(DEFINITIONS_CATALOG).sort((a, b) => b.length - a.length);
    }, []);

    const highlightTerms = useCallback((text: string) => {
        if (typeof text !== 'string') return text;
        const escapedKeys = sortedKeys.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
        const regex = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi');
        
        const parts = text.split(regex);
        if (parts.length === 1) return text;
        
        return parts.map((part, i) => {
            const isMatch = sortedKeys.some(k => k.toLowerCase() === part.toLowerCase());
            if (isMatch) {
                return <TermPopover key={i}>{part}</TermPopover>;
            }
            return part;
        });
    }, [sortedKeys]);

    const processChildren = useCallback((childList: React.ReactNode): React.ReactNode => {
        return React.Children.map(childList, child => {
            if (typeof child === 'string') {
                return highlightTerms(child);
            }
            if (React.isValidElement(child)) {
                const element = child as React.ReactElement<any>;
                if (element.props && element.props.children) {
                    // If it is a TermPopover already, don't double process
                    if ((element.type as any) === TermPopover || element.key?.toString().includes('term-')) {
                        return element;
                    }
                    return React.cloneElement(element, {
                        ...element.props,
                        children: processChildren(element.props.children)
                    });
                }
            }
            return child;
        });
    }, [highlightTerms]);

    const isEmpty = !content || content.trim() === "";

    if (isEmpty && isStreaming) {
        return (
            <div className={cn("prose prose-invert max-w-none transition-all duration-300", className)}>
                <BubblyThinkingLoader />
            </div>
        );
    }

    const cleanContent = (content || "")
        .replace(/[ \t]+:[ \t]*/g, ': ')
        .replace(/:[ \t]+/g, ': ');

    return (
        <div className={cn(
            "prose dark:prose-invert max-w-none transition-all duration-300 font-serif",
            "prose-headings:font-black prose-headings:tracking-tight prose-headings:text-[var(--foreground)]",
            "prose-p:leading-relaxed prose-p:text-[var(--foreground-muted)]",
            "prose-strong:text-[var(--foreground)] prose-strong:font-bold",
            "prose-code:text-[var(--blue)] prose-code:bg-[var(--blue)]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none",
            "prose-li:text-[var(--foreground-muted)]",
            isStreaming && "typing-cursor",
            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    // TermPopover definition lookup for explicit bold elements
                    strong: ({ node, ...props }) => <TermPopover {...props} />,

                    // Dynamic terminology popovers for paragraphs and lists
                    p: ({ node, children, ...props }) => {
                        return <p className="leading-relaxed text-[var(--foreground-muted)] mb-4" {...props}>{processChildren(children)}</p>;
                    },

                    code: ({ node, inline, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        return !inline ? (
                            <div className="my-6 rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-sm overflow-hidden font-mono text-sm shadow-xl">
                                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                        {match ? match[1] : 'code'}
                                    </span>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(codeString)}
                                        className="text-[10px] font-black uppercase tracking-wider text-[var(--blue-light)] hover:underline cursor-pointer"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <pre className="p-5 overflow-x-auto text-white/90 bg-transparent leading-relaxed custom-scrollbar m-0">
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            </div>
                        ) : (
                            <code className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 font-mono text-[13px] text-amber-400 font-bold" {...props}>
                                {children}
                            </code>
                        );
                    },

                    // Custom rendering for headings to add "weight"
                    h1: ({ node, ...props }) => <h1 className="text-2xl md:text-4xl font-black mt-12 mb-6 text-[var(--foreground)] tracking-tight border-b border-[var(--border)] pb-3" {...props} />,
                    h2: ({ node, children, ...props }) => {
                        const isKeyFacts = typeof children === 'string' && children.toLowerCase().includes('key facts');
                        if (isKeyFacts) {
                            return (
                                <h2 className="text-xl md:text-2xl font-black text-[var(--blue)] flex items-center gap-2 border-b border-[var(--blue)]/20 pb-3 mb-6 mt-12 tracking-tight" {...props}>
                                    <Zap size={18} className="text-[var(--blue)] animate-pulse shrink-0" />
                                    {children}
                                </h2>
                            );
                        }
                        return (
                            <h2 className="text-xl md:text-2xl font-black mt-12 mb-5 text-[var(--foreground)] border-l-4 border-[var(--blue)] pl-4 flex items-center gap-2 tracking-tight" {...props}>
                                {children}
                            </h2>
                        );
                    },
                    h3: ({ node, children, ...props }) => (
                        <h3 className="text-lg md:text-xl font-black mt-8 mb-4 text-[var(--foreground)] border-l-2 border-[var(--border)] pl-3 tracking-tight" {...props}>
                            {children}
                        </h3>
                    ),
                    
                    // Style horizontal rules
                    hr: ({ node, ...props }) => <hr className="my-12 border-[var(--border)]" {...props} />,
                    
                    // Special treatment for blockquotes (Professor's Insights)
                    blockquote: ({ node, ...props }) => (
                        <blockquote 
                            className="border-l-4 border-[var(--blue)]/40 pl-6 my-8 italic text-[var(--foreground-muted)] bg-[var(--background-secondary)]/50 py-5 pr-4 rounded-r-2xl border-dashed"
                            {...props} 
                        />
                    ),

                    // Custom table styling
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-8 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)]/30">
                            <table className="min-w-full divide-y divide-[var(--border)]" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-[var(--background-secondary)]" {...props} />,
                    th: ({ node, ...props }) => <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-[var(--foreground-muted)]" {...props} />,
                    td: ({ node, ...props }) => <td className="px-6 py-4 text-sm text-[var(--foreground)] border-t border-[var(--border)]" {...props} />,

                    // Stylized list rendering to prevent monotone look
                    ul: ({ node, ...props }) => <ul className="my-6 space-y-3.5 pl-0" {...props} />,
                    ol: ({ node, ...props }) => <ol className="my-6 space-y-3.5 pl-6 list-decimal text-[var(--foreground-muted)]" {...props} />,
                    li: ({ node, children, ...props }) => (
                        <li className="list-none flex items-start gap-3 mb-2 text-[var(--foreground)] leading-relaxed text-sm md:text-base font-medium" {...props}>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] mt-2.5 shrink-0 shadow-[0_0_8px_var(--blue-glow)]" />
                            <span className="flex-1">{processChildren(children)}</span>
                        </li>
                    ),
                }}
            >
                {cleanContent}
            </ReactMarkdown>
            
            {/* The "Identity Nudge" styling for the footer if it exists */}
            {content && content.includes("That's the difference sha.") && (
                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center text-center opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 mb-2">
                        Professor's Verdict
                    </p>
                </div>
            )}
        </div>
    );
}
