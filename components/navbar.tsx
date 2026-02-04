"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Download, Upload, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const menuItems = [
    {
        name: "Inicio",
        href: "/dashboard",
        icon: Home,
    },
    {
        name: "Download",
        href: "/download",
        icon: Download,
    },
    {
        name: "Upload",
        href: "/upload",
        icon: Upload,
    },
];

interface NavbarProps {
    userEmail?: string;
}

export function Navbar({ userEmail }: NavbarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out"
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Collapsed state - thin bar with central bump for easier hover */}
            <div
                className={cn(
                    "absolute inset-x-0 top-0 flex justify-center transition-opacity duration-300",
                    isExpanded ? "opacity-0" : "opacity-100"
                )}
            >
                {/* Left bar */}
                <div className="flex-1 h-1.5 bg-yellow-500" />
                {/* Central bump (inverted mountain) */}
                <div className="w-24 h-5 bg-yellow-500 rounded-b-full" />
                {/* Right bar */}
                <div className="flex-1 h-1.5 bg-yellow-500" />
            </div>

            {/* Expanded navbar with glass effect */}
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden",
                    isExpanded ? "h-16 opacity-100" : "h-1.5 opacity-0"
                )}
            >
                <div className="h-16 backdrop-blur-xl bg-black/70 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <span className="text-white text-lg">☕︎</span>
                            <span className="text-white font-semibold">Agromax - Video Tool</span>
                        </Link>

                        {/* Navigation Links */}
                        <div className="flex items-center gap-1">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;

                                return (
                                    <Link key={item.href} href={item.href}>
                                        <div
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                                                isActive
                                                    ? "bg-white/10 text-white"
                                                    : "text-[#888] hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span className="text-sm font-medium">{item.name}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User & Logout */}
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-[#888] hidden sm:block">
                                {userEmail}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 rounded-full text-[#888] hover:text-red-400 hover:bg-white/5 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="text-sm hidden sm:block">Salir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
