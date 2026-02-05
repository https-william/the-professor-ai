"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

/**
 * DecryptedText
 * Matrix-style text reveal effect that cycles through characters
 */
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

export const DecryptedText = ({
    text,
    speed = 50,
    className = "",
    parentClassName = "",
    revealDirection = "start", // "start" | "end" | "center"
    useOriginalCharsOnly = false,
    animateOn = "view", // "view" | "hover"
}: {
    text: string;
    speed?: number;
    className?: string;
    parentClassName?: string;
    revealDirection?: "start" | "end" | "center";
    useOriginalCharsOnly?: boolean;
    animateOn?: "view" | "hover";
}) => {
    const [displayText, setDisplayText] = useState(text);
    const [isHovering, setIsHovering] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const containerRef = useRef<HTMLSpanElement>(null);
    const iterations = useRef(0);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                }
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (animateOn === "view" && !isInView) return;
        if (animateOn === "hover" && !isHovering) return;

        const interval = setInterval(() => {
            setDisplayText((prev) =>
                text
                    .split("")
                    .map((letter, index) => {
                        if (index < iterations.current) {
                            return text[index];
                        }
                        return letters[Math.floor(Math.random() * letters.length)];
                    })
                    .join("")
            );

            if (iterations.current >= text.length) {
                clearInterval(interval);
            }

            iterations.current += 1 / 3; // Slow down the reveal
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed, isInView, isHovering, animateOn]);

    return (
        <span
            ref={containerRef}
            className={parentClassName}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <span className={className}>{displayText}</span>
        </span>
    );
};

/**
 * GradientText
 * Simple wrapper for gradient text
 */
export const GradientText = ({
    children,
    className = "",
    colors = ["#F59E0B", "#EF4444", "#8B5CF6"]
}: {
    children: React.ReactNode;
    className?: string;
    colors?: string[];
}) => {
    return (
        <span
            className={`bg-clip-text text-transparent bg-gradient-to-r ${className}`}
            style={{
                backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`
            }}
        >
            {children}
        </span>
    );
};
