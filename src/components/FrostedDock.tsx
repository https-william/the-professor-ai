"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";

const navItems = [
    { icon: "dashboard", label: "Home", href: "/dashboard" },
    { icon: "school", label: "Class", href: "/class" },
    { icon: "auto_awesome", label: "Create", href: "/create" },
    { icon: "psychology", label: "Professor", href: "/professor" },
    { icon: "history", label: "History", href: "/history" },
];

const hiddenPaths = ["/", "/login", "/signup", "/library"];

export default function FrostedDock() {
    const pathname = usePathname();
    const { user } = useUser();

    if (hiddenPaths.includes(pathname)) return null;

    return (
        <>
            {/* Desktop Dock — Bottom center pill */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-0.5 px-2.5 py-2 rounded-2xl frosted-dock">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-250 ${isActive ? "dock-item-active" : "dock-item"
                                }`}
                        >
                            <span
                                className={`material-symbols-outlined text-[22px] transition-all duration-250 ${isActive ? "scale-110" : "group-hover:scale-110"
                                    }`}
                            >
                                {item.icon}
                            </span>

                            {/* Tooltip */}
                            <span className="absolute -top-9 px-2.5 py-1 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-lg">
                                {item.label}
                            </span>

                            {/* Active dot */}
                            {isActive && (
                                <span className="absolute -bottom-px w-1 h-1 rounded-full bg-[var(--accent)] shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                            )}
                        </Link>
                    );
                })}

                {/* Divider */}
                <div className="w-px h-7 bg-[var(--border)] mx-1.5" />

                {/* Settings */}
                <Link
                    href="/settings"
                    className={`dock-item w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-250 ${pathname.startsWith("/settings") ? "dock-item-active" : ""
                        }`}
                >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                </Link>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] flex items-center justify-center text-[#08080E] text-sm font-black cursor-pointer hover:scale-110 transition-transform ml-1 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                    {user.avatar}
                </div>
            </nav>

            {/* Mobile Dock — Full width bottom bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around px-2 py-2 frosted-dock-mobile safe-area-bottom">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${isActive ? "dock-item-active" : "dock-item"
                                }`}
                        >
                            <span className={`material-symbols-outlined text-xl ${isActive ? "scale-110" : ""}`}>
                                {item.icon}
                            </span>
                            <span className="text-[9px] mt-0.5 font-semibold tracking-wide">{item.label}</span>
                            {isActive && (
                                <span className="absolute -bottom-px w-5 h-0.5 rounded-full bg-[var(--accent)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
