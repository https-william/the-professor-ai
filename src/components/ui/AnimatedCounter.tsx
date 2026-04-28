"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, animate } from "framer-motion";

export default function AnimatedCounter({
    value,
    className = "",
    duration = 1.5,
}: {
    value: number;
    className?: string;
    duration?: number;
}) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const controls = animate(displayValue, value, {
            duration: duration,
            ease: "easeOut",
            onUpdate: (val) => setDisplayValue(Math.floor(val))
        });
        return controls.stop;
    }, [value, duration]); // eslint-disable-line react-hooks/exhaustive-deps

    return <span className={className}>{displayValue}</span>;
}
