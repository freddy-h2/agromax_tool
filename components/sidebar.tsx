"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

interface SidebarProps {
    userEmail?: string;
}

export function Sidebar({ userEmail }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-black border-r border-[#333] flex flex-col">
            {/* Logo / Brand */}
            <div className="p-6 border-b border-[#333]">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-white">☕︎</span>
                    Agromax - Video Tool
                </h1>
                <p className="text-xs text-[#888] mt-1 truncate">
                    {userEmail || "Usuario"}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                                    isActive
                                        ? "bg-[#1a1a1a] text-white"
                                        : "text-[#888] hover:text-white hover:bg-[#111]"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{item.name}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-[#333]">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-[#888] hover:text-red-400 hover:bg-[#111] transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
