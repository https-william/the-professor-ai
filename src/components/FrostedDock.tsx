"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";

const navItems = [
    { icon: "dashboard", label: "Home", href: "/dashboard" },
    { icon: "school", label: "Class", href: "/class" },
    { icon: "auto_awesome", label: "Create", href: "/create" },
    { icon: "history", label: "Library", href: "/history" },
    { icon: "swords", label: "Arena", href: "/arena" },
];

// Pages where dock should NOT appear
const hiddenPaths = ["/", "/login", "/signup"];

export default function FrostedDock() {
    const pathname = usePathname();
    const { user } = useUser();

    // Hide dock on landing/auth pages
    if (hiddenPaths.includes(pathname)) {
        return null;
    }

    return (
        <>
            {/* Desktop Dock - Bottom center */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-1 px-3 py-2 rounded-2xl frosted-dock">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group relative flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 ${isActive
                                ? "dock-item-active"
                                : "dock-item"
                                }`}
                        >
                            <span className={`material-symbols-outlined text-2xl transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"
                                }`}>
                                {item.icon}
                            </span>

                            {/* Tooltip */}
                            <span className="absolute -top-10 px-2.5 py-1 rounded-lg bg-[var(--foreground)] text-[var(--background)] text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-lg">
                                {item.label}
                            </span>

                            {/* Active indicator dot */}
                            {isActive && (
                                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[var(--accent)]" />
                            )}
                        </Link>
                    );
                })}

                {/* Divider */}
                <div className="w-px h-8 bg-[var(--border)] mx-1" />

                {/* Settings */}
                <Link
                    href="/settings"
                    className={`dock-item w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${pathname === "/settings" ? "dock-item-active" : ""
                        }`}
                >
                    <span className="material-symbols-outlined text-xl">settings</span>
                </Link>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:scale-110 transition-transform shadow-lg">
                    {user.avatar}
                </div>
            </nav>

            {/* Mobile Dock - Full width bottom */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around px-2 py-2 frosted-dock-mobile safe-area-bottom">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${isActive ? "dock-item-active" : "dock-item"
                                }`}
                        >
                            <span className={`material-symbols-outlined text-xl ${isActive ? "scale-110" : ""}`}>
                                {item.icon}
                            </span>
                            <span className="text-[9px] mt-0.5 font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
