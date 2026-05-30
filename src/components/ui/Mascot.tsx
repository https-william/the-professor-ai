import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import { useMascotStore } from "@/store/useMascotStore";

interface MascotProps {
  size?: number | string;
  interactive?: boolean;
  /** Called when user taps/clicks on Prof */
  onTap?: () => void;
}

const MascotInner: React.FC<MascotProps> = ({ size = "100%", interactive = true, onTap }) => {
  const { mascotState, bubbleText } = useMascotStore();
  const controls = useAnimation();
  const [isBlinking, setIsBlinking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentIdlePose, setCurrentIdlePose] = useState<"none" | "wave" | "bounce" | "tilt">("none");

  // Mobile viewport detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Tap-to-wave handler
  const handleTap = useCallback(() => {
    setCurrentIdlePose("wave");
    setTimeout(() => setCurrentIdlePose("none"), 1600);
    onTap?.();
  }, [onTap]);

  // Periodic proactive animations timer (waving, bouncing, tilting on idle)
  useEffect(() => {
    const interval = setInterval(() => {
      if (mascotState === "idle" || mascotState === "pointing-left" || mascotState === "pointing-right") {
        const poses = ["wave", "bounce", "tilt"] as const;
        const randomPose = poses[Math.floor(Math.random() * poses.length)];
        setCurrentIdlePose(randomPose);
        setTimeout(() => setCurrentIdlePose("none"), 1600);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [mascotState]);

  // Random blink interval timer logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      timeoutId = setTimeout(() => {
        setIsBlinking(false);
        const randomDelay = Math.random() * 4000 + 2000;
        timeoutId = setTimeout(triggerBlink, randomDelay);
      }, 150);
    };
    const initialDelay = Math.random() * 3000 + 1000;
    timeoutId = setTimeout(triggerBlink, initialDelay);
    return () => clearTimeout(timeoutId);
  }, []);

  // Floating bobbing effect (looping idle)
  useEffect(() => {
    controls.start({
      y: [0, -6, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    });
  }, [controls]);

  // Eye tracking state
  const [scrollRotate, setScrollRotate] = useState(0);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse and Touch tracking (eyes follow cursor/finger)
  useEffect(() => {
    if (typeof window === "undefined" || !interactive) return;
    const handleInteraction = (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mascotX = rect.left + rect.width / 2;
      const mascotY = rect.top + rect.height / 2;
      const dx = clientX - mascotX;
      const dy = clientY - mascotY;
      const angle = Math.atan2(dy, dx);
      const maxDistance = isMobile ? 6.5 : 4.0;
      const divisor = isMobile ? 20 : 40;
      const distance = Math.min(maxDistance, Math.sqrt(dx * dx + dy * dy) / divisor);
      setEyeOffset({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
    };
    const handleMouseMove = (e: MouseEvent) => handleInteraction(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches?.length > 0) handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchstart", handleTouchMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchstart", handleTouchMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [interactive, isMobile]);

  // Scroll-based rotation (lightweight — 500ms poll)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleScroll = () => {
      const scrollContainer = document.getElementById("main-scroll-container");
      const currentScroll = scrollContainer ? scrollContainer.scrollTop : (window.scrollY || document.documentElement.scrollTop);
      const maxScrollHeight = scrollContainer
        ? (scrollContainer.scrollHeight - scrollContainer.clientHeight)
        : (document.documentElement.scrollHeight - window.innerHeight);
      const scrollPct = maxScrollHeight > 0 ? (currentScroll / maxScrollHeight) : 0;
      setScrollRotate(scrollPct * 30 - 15);
      if (!interactive) {
        setEyeOffset({
          x: Math.sin(scrollPct * Math.PI * 2) * (isMobile ? 5 : 3.5),
          y: Math.cos(scrollPct * Math.PI * 2) * (isMobile ? 2.5 : 1.5)
        });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    const container = document.getElementById("main-scroll-container");
    if (container) container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    const interval = setInterval(handleScroll, 500);
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
      if (container) container.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, [interactive, isMobile]);

  // Determine eye details based on state
  const getEyeContent = (isLeft: boolean) => {
    const cx = isLeft ? 65 : 95;
    switch (mascotState) {
      case "working":
        return (
          <g>
            <motion.circle
              cx={cx}
              cy="80"
              r="6"
              fill="none"
              stroke="var(--foreground)"
              strokeWidth="2"
              animate={{ rotate: isLeft ? 360 : -360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
            <circle cx={cx} cy="80" r="2.5" fill="#2563EB" />
          </g>
        );
      case "success":
        return (
          <path
            d={isLeft ? "M60,82 L65,75 L70,82 L63,77 L67,77 Z" : "M90,82 L95,75 L100,82 L93,77 L97,77 Z"}
            fill="#2563EB"
            stroke="var(--foreground)"
            strokeWidth="1"
          />
        );
      case "fail":
        return (
          <path
            d={isLeft ? "M60,76 L70,84 M70,76 L60,84" : "M90,76 L100,84 M100,76 L90,84"}
            stroke="var(--foreground)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        );
      case "sleepy":
        return (
          <path
            d={isLeft ? "M58,80 Q65,86 72,80" : "M88,80 Q95,86 102,80"}
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        );
      case "streak":
        return (
          <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
            <circle cx={cx} cy="80" r="6.5" fill="#2563EB" stroke="var(--foreground)" strokeWidth="1" />
            <circle cx={cx + 1.5} cy="78.5" r="2" fill="#FFFFFF" />
          </g>
        );
      case "idle":
      case "pointing-left":
      case "pointing-right":
      default:
        return (
          <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
            <circle cx={cx} cy="80" r="5.5" fill="#2563EB" stroke="var(--foreground)" strokeWidth="0.8" />
            <circle cx={cx} cy="80" r="2.8" fill="#09090B" />
            <circle cx={cx + 1.2} cy="78" r="1" fill="#FFFFFF" />
          </g>
        );
    }
  };

  const getMouth = () => {
    switch (mascotState) {
      case "success":
      case "streak":
        return <path d="M70,96 Q80,108 90,96" fill="var(--foreground)" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" />;
      case "fail":
        return <path d="M72,102 Q80,95 88,102" fill="none" stroke="var(--foreground)" strokeWidth="3.5" strokeLinecap="round" />;
      case "sleepy":
        return <motion.circle cx="80" cy="98" r="4.5" fill="var(--foreground)" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 4 }} />;
      case "working":
        return <line x1="74" y1="98" x2="86" y2="98" stroke="var(--foreground)" strokeWidth="3.5" strokeLinecap="round" />;
      case "idle":
      default:
        return <path d="M72,98 Q80,105 88,98" fill="none" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" />;
    }
  };

  // Dynamic arm animations
  const leftArmAnimate = currentIdlePose === "wave"
    ? { rotate: [0, -75, -25, -75, -25, 0] }
    : mascotState === "working" ? { rotate: [0, 45, 0] }
    : mascotState === "success" ? { y: [-2, -15, -2], rotate: [0, -30, 0] }
    : mascotState === "pointing-left" ? { rotate: -65 }
    : { rotate: [0, 5, 0] };

  const rightArmAnimate = mascotState === "working" ? { rotate: [0, -45, 0] }
    : mascotState === "success" ? { y: [-2, -15, -2], rotate: [0, 30, 0] }
    : mascotState === "pointing-right" ? { rotate: 65 }
    : { rotate: [0, -5, 0] };

  const leftArmTransition = currentIdlePose === "wave"
    ? { duration: 1.5, ease: "easeInOut" }
    : (mascotState === "pointing-left" || mascotState === "pointing-right")
    ? { duration: 0.4, ease: "easeOut" }
    : { repeat: Infinity, duration: 1.5, ease: "easeInOut" } as any;

  const rightArmTransition = ((mascotState === "pointing-left" || mascotState === "pointing-right")
    ? { duration: 0.4, ease: "easeOut" }
    : { repeat: Infinity, duration: 1.5, ease: "easeInOut" }) as any;

  const legAnimate = currentIdlePose === "bounce"
    ? { y: [0, -4, 0] }
    : mascotState === "working" ? { y: [0, -2, 0] }
    : mascotState === "success" ? { y: [0, -6, 0] }
    : { y: [0, 0] };

  const legTransition = (currentIdlePose === "bounce"
    ? { duration: 0.8, ease: "easeInOut" }
    : { repeat: Infinity, duration: 1, ease: "easeInOut" }) as any;

  // Combine scrollRotate with idle poses
  const svgAnimate = currentIdlePose === "bounce"
    ? { ...controls, y: [0, -22, 0], rotate: scrollRotate }
    : currentIdlePose === "tilt"
    ? { ...controls, rotate: [scrollRotate, scrollRotate - 14, scrollRotate + 14, scrollRotate] }
    : { ...controls, rotate: scrollRotate };

  const svgTransition = (currentIdlePose === "bounce"
    ? { type: "spring", stiffness: 80, damping: 10 }
    : currentIdlePose === "tilt"
    ? { duration: 1.4, ease: "easeInOut" }
    : undefined) as any;

  const isEyeClosed = isBlinking && mascotState !== "working" && mascotState !== "fail" && mascotState !== "sleepy";

  return (
    <div
      ref={containerRef}
      onClick={handleTap}
      className="relative flex flex-col items-center justify-center select-none w-full h-full max-w-full max-h-full cursor-pointer"
      style={{ width: size, height: typeof size === "number" ? `${size}px` : size, willChange: "transform" }}
    >
      {bubbleText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          className="absolute -top-16 z-20 max-w-[200px] px-4 py-2 bg-white/95 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-md rounded-2xl shadow-lg text-xs font-semibold text-zinc-900 dark:text-zinc-100 text-center leading-relaxed"
        >
          {bubbleText}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/95 dark:bg-zinc-900/90 border-r border-b border-zinc-200/50 dark:border-zinc-800/50 rotate-45" />
        </motion.div>
      )}

      <motion.svg
        animate={svgAnimate}
        transition={svgTransition}
        viewBox="0 0 160 170"
        className="w-full h-full drop-shadow-md overflow-visible"
        style={{ willChange: "transform" }}
      >
        <defs>
          <linearGradient id="mugBodyGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F8F8FA" />
            <stop offset="100%" stopColor="#EAEAEF" />
          </linearGradient>
          <linearGradient id="coffeeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B3A1A" />
            <stop offset="100%" stopColor="#3A200D" />
          </linearGradient>
          <linearGradient id="rimShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#D4D4D8" />
          </linearGradient>
          <linearGradient id="shoeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27272A" />
            <stop offset="100%" stopColor="#09090B" />
          </linearGradient>
          <linearGradient id="vestGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3F3F46" />
            <stop offset="100%" stopColor="#18181B" />
          </linearGradient>
          <clipPath id="leftEyeClip"><ellipse cx="65" cy="80" rx="11" ry="8" /></clipPath>
          <clipPath id="rightEyeClip"><ellipse cx="95" cy="80" rx="11" ry="8" /></clipPath>
          <clipPath id="mugBodyClip">
            <path d="M45,52 C45,115 50,132 80,132 C110,132 115,115 115,52 Z" />
          </clipPath>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="80" cy="155" rx="38" ry="6" fill="rgba(9, 9, 11, 0.1)" />

        {/* Legs with shoes */}
        <g>
          <motion.g animate={legAnimate} transition={legTransition}>
            <line x1="64" y1="130" x2="62" y2="142" stroke="var(--foreground)" strokeWidth="3.5" strokeLinecap="round" />
            <ellipse cx="59" cy="146" rx="9" ry="5" fill="url(#shoeGrad)" stroke="var(--foreground)" strokeWidth="1.5" />
            <ellipse cx="56" cy="145" rx="3" ry="1.5" fill="#3F3F46" opacity="0.4" />
          </motion.g>
          <motion.g animate={legAnimate} transition={legTransition}>
            <line x1="96" y1="130" x2="98" y2="142" stroke="var(--foreground)" strokeWidth="3.5" strokeLinecap="round" />
            <ellipse cx="101" cy="146" rx="9" ry="5" fill="url(#shoeGrad)" stroke="var(--foreground)" strokeWidth="1.5" />
            <ellipse cx="104" cy="145" rx="3" ry="1.5" fill="#3F3F46" opacity="0.4" />
          </motion.g>
        </g>

        {/* Body group */}
        <g>
          {/* Steam */}
          <g>
            <motion.path d="M70,44 Q67,35 72,25 T68,12" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round"
              animate={{ pathLength: [0,1,1], pathOffset: [0,0,1], opacity: [0,0.7,0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} />
            <motion.path d="M80,43 Q83,32 78,22 T82,8" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"
              animate={{ pathLength: [0,1,1], pathOffset: [0,0,1], opacity: [0,0.5,0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.8, ease: "linear" }} />
            <motion.path d="M90,44 Q93,36 88,26 T92,14" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round"
              animate={{ pathLength: [0,1,1], pathOffset: [0,0,1], opacity: [0,0.4,0] }}
              transition={{ duration: 2.8, repeat: Infinity, delay: 1.4, ease: "linear" }} />
          </g>

          {/* Left arm with hand */}
          <motion.g style={{ transformOrigin: "45px 90px" }} animate={leftArmAnimate} transition={leftArmTransition}>
            <path d="M45,88 C30,88 28,102 38,106" fill="none" stroke="var(--foreground)" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="36" cy="108" rx="7" ry="6" fill="url(#mugBodyGrad)" stroke="var(--foreground)" strokeWidth="2.5" />
            <ellipse cx="31" cy="105" rx="3.5" ry="3" fill="url(#mugBodyGrad)" stroke="var(--foreground)" strokeWidth="2" />
          </motion.g>

          {/* Right arm with hand */}
          <motion.g style={{ transformOrigin: "115px 90px" }} animate={rightArmAnimate} transition={rightArmTransition}>
            <path d="M115,88 C130,88 132,102 122,106" fill="none" stroke="var(--foreground)" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="124" cy="108" rx="7" ry="6" fill="url(#mugBodyGrad)" stroke="var(--foreground)" strokeWidth="2.5" />
            <ellipse cx="129" cy="105" rx="3.5" ry="3" fill="url(#mugBodyGrad)" stroke="var(--foreground)" strokeWidth="2" />
          </motion.g>

          {/* Mug body */}
          <path d="M45,52 C45,115 50,132 80,132 C110,132 115,115 115,52 Z" fill="url(#mugBodyGrad)" stroke="var(--foreground)" strokeWidth="4.5" strokeLinejoin="round" />
          
          {/* Mug details clipped to body (Sweater vest + shirt) */}
          <g clipPath="url(#mugBodyClip)">
            {/* White shirt chest area */}
            <path d="M 60,110 L 100,110 L 100,135 L 60,135 Z" fill="#FFFFFF" />
            
            {/* White shirt collar flaps */}
            <polygon points="68,110 80,119 72,119" fill="#FFFFFF" stroke="var(--foreground)" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="92,110 80,119 88,119" fill="#FFFFFF" stroke="var(--foreground)" strokeWidth="1.2" strokeLinejoin="round" />

            {/* Charcoal/dark sweater vest */}
            <path d="M 35,110 L 68,110 L 80,123 L 92,110 L 125,110 L 125,135 L 35,135 Z" fill="url(#vestGrad)" />
            {/* V-neck trim line */}
            <path d="M 68,110 L 80,123 L 92,110" fill="none" stroke="var(--foreground)" strokeWidth="2.0" strokeLinecap="round" />
            
            {/* Pocket protector / pocket on vest */}
            <rect x="94" y="116" width="12" height="11" rx="1.5" fill="#27272A" stroke="var(--foreground)" strokeWidth="1.2" />
            {/* Pens sticking out */}
            {/* Blue pen */}
            <line x1="97" y1="112" x2="97" y2="116" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
            {/* Black pen */}
            <line x1="103" y1="111" x2="103" y2="116" stroke="var(--foreground)" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Body highlights & shadows (drawn on top of vest for 3D depth) */}
          <path d="M50,60 C50,105 52,120 60,125" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
          <path d="M46,78 C60,98 100,98 114,78 L114,108 C114,126 106,131 80,131 C54,131 46,126 46,108 Z" fill="#2563EB" opacity="0.1" />

          {/* Mug rim */}
          <ellipse cx="80" cy="52" rx="35" ry="7" fill="url(#rimShine)" stroke="var(--foreground)" strokeWidth="3" />
          <ellipse cx="80" cy="52" rx="30" ry="5" fill="url(#coffeeGrad)" stroke="none" />
          <ellipse cx="74" cy="51" rx="8" ry="2" fill="#6B3F1A" opacity="0.4" />

          {/* Bow tie (draws on top of collar/vest) */}
          <g>
            <polygon points="73,112 80,116 87,112 87,120 80,116 73,120" fill="#2563EB" stroke="var(--foreground)" strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="80" cy="116" r="2.5" fill="#1D4ED8" stroke="var(--foreground)" strokeWidth="1" />
          </g>

          {/* Eyebrows */}
          <path d="M54,71 Q65,66 76,71" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M84,71 Q95,66 106,71" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Left Eye */}
          {isEyeClosed ? (
            <line x1="54" y1="80" x2="76" y2="80" stroke="var(--foreground)" strokeWidth="4.5" strokeLinecap="round" />
          ) : (
            <>
              <g clipPath="url(#leftEyeClip)">
                <ellipse cx="65" cy="80" rx="11" ry="8" fill="#F4F4F5" />
                {getEyeContent(true)}
              </g>
              {/* Eyeball border stroke */}
              <ellipse cx="65" cy="80" rx="11" ry="8" fill="none" stroke="var(--foreground)" strokeWidth="2.2" />
              {/* Eyelid detail */}
              <path d="M 53,72 L 77,72 L 77,76 Q 65,73 53,76 Z" fill="url(#mugBodyGrad)" />
              <path d="M 54,76 Q 65,73 76,76" stroke="var(--foreground)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Right Eye */}
          {isEyeClosed ? (
            <line x1="84" y1="80" x2="106" y2="80" stroke="var(--foreground)" strokeWidth="4.5" strokeLinecap="round" />
          ) : (
            <>
              <g clipPath="url(#rightEyeClip)">
                <ellipse cx="95" cy="80" rx="11" ry="8" fill="#F4F4F5" />
                {getEyeContent(false)}
              </g>
              {/* Eyeball border stroke */}
              <ellipse cx="95" cy="80" rx="11" ry="8" fill="none" stroke="var(--foreground)" strokeWidth="2.2" />
              {/* Eyelid detail */}
              <path d="M 83,72 L 107,72 L 107,76 Q 95,73 83,76 Z" fill="url(#mugBodyGrad)" />
              <path d="M 84,76 Q 95,73 106,76" stroke="var(--foreground)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Eyebrow shadows (soft detail lines under eyebrows) */}
          <path d="M56,84 Q65,88 74,84" fill="none" stroke="var(--foreground)" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
          <path d="M86,84 Q95,88 104,84" fill="none" stroke="var(--foreground)" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />

          {/* Scholarly Glasses (drawn on top of eyes for depth) */}
          <g style={{ pointerEvents: "none" }}>
            {/* Lenses glass effect */}
            <circle cx="65" cy="80" r="15" fill="rgba(255, 255, 255, 0.08)" stroke="var(--foreground)" strokeWidth="2.5" />
            <circle cx="95" cy="80" r="15" fill="rgba(255, 255, 255, 0.08)" stroke="var(--foreground)" strokeWidth="2.5" />
            {/* Bridge */}
            <path d="M78,78 Q80,75 82,78" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" />
            {/* Side frames */}
            <path d="M50,80 H46" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M110,80 H114" fill="none" stroke="var(--foreground)" strokeWidth="2.5" strokeLinecap="round" />
            {/* Lens reflections */}
            <path d="M57,73 L62,78" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M87,73 L92,78" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Rosy cheeks */}
          <circle cx="52" cy="90" r="6" fill="#F87171" opacity="0.15" />
          <circle cx="108" cy="90" r="6" fill="#F87171" opacity="0.15" />

          {/* Nose */}
          <ellipse cx="80" cy="90" rx="2" ry="1.5" fill="var(--foreground)" opacity="0.2" />

          {/* Mouth */}
          {getMouth()}

          {/* Mortarboard cap */}
          <g>
            <motion.path d="M80,30 L48,36" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"
              animate={{ rotate: [-2, 5, -2] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} />
            <motion.circle cx="46" cy="37" r="3" fill="#2563EB" stroke="var(--foreground)" strokeWidth="1"
              animate={{ y: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} />
            <path d="M60,34 L60,42 C60,48 100,48 100,42 L100,34 Z" fill="#09090B" stroke="var(--foreground)" strokeWidth="1.5" />
            <rect x="60" y="40" width="40" height="3" rx="1" fill="#27272A" opacity="0.6" />
            <polygon points="80,22 116,31 80,40 44,31" fill="#09090B" stroke="var(--foreground)" strokeWidth="1.8" />
            <line x1="50" y1="31" x2="110" y2="31" stroke="#3F3F46" strokeWidth="0.8" opacity="0.5" />
            <circle cx="80" cy="31" r="2.5" fill="#2563EB" stroke="var(--foreground)" strokeWidth="1" />
          </g>
        </g>
      </motion.svg>
    </div>
  );
};

export const Mascot = React.memo(MascotInner);
export default Mascot;
