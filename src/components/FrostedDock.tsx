"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";

const navItems = [
    { icon: "home", label: "Home", href: "/dashboard" },
    { icon: "add_circle", label: "Create", href: "/create" },
    { icon: "local_library", label: "Library", href: "/library" },
    { icon: "groups", label: "Hub", href: "/hub" },
    { icon: "person", label: "Profile", href: "/profile" },
];

const hiddenPaths = ["/", "/login", "/signup", "/create", "/summary", "/quiz", "/flashcards"];

export default function FrostedDock() {
    const pathname = usePathname();
    const { user } = useUser();

    if (hiddenPaths.includes(pathname)) return null;

    return (
        <>
            {/* Mobile Dock — Jelly Glass Bottom Bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center justify-around px-2 py-3 safe-area-bottom"
                style={{
                    background: "rgba(12, 12, 20, 0.85)",
                    backdropFilter: "blur(50px) saturate(180%)",
                    WebkitBackdropFilter: "blur(50px) saturate(180%)",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 -4px 24px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.06)",
                }}
            >
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center w-[18%] h-14 rounded-2xl transition-all"
                            style={{
                                background: isActive ? "rgba(245, 158, 11, 0.1)" : "transparent",
                                boxShadow: isActive ? "inset 0 1px rgba(255,255,255,0.12)" : "none",
                            }}
                        >
                            <span className={`material-symbols-outlined text-2xl transition-transform ${isActive ? "text-[var(--accent)] drop-shadow-[0_0_8px_var(--accent)] scale-110 -translate-y-1" : "text-white/60"}`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] mt-1 font-semibold tracking-wide transition-opacity ${isActive ? "text-[var(--accent)] opacity-100" : "text-white/40 opacity-80"}`}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
