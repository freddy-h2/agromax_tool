"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
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
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar-bg border-r border-border flex flex-col">
            {/* Logo / Brand */}
            <div className="p-6 border-b border-border">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-center"
                >
                    <Image
                        src="/img/agro_max_logo.png"
                        alt="Agro Max Logo"
                        width={180}
                        height={50}
                        className="object-contain"
                        priority
                    />
                </motion.h1>
                <p className="text-xs text-foreground-muted mt-1 truncate">
                    {userEmail || "Usuario"}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <Link href={item.href}>
                                <motion.div
                                    whileHover={{ x: 4, backgroundColor: "var(--sidebar-hover)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                                        isActive
                                            ? "bg-sidebar-active text-neon-blue border-l-2 border-neon-blue"
                                            : "text-foreground-muted hover:text-foreground"
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "h-5 w-5",
                                            isActive && "text-neon-blue"
                                        )}
                                    />
                                    <span className="font-medium">{item.name}</span>

                                    {/* Active indicator glow */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 w-1 h-8 bg-neon-blue rounded-r"
                                            style={{
                                                boxShadow: "0 0 12px var(--neon-blue-glow)",
                                            }}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-border">
                <motion.button
                    whileHover={{ x: 4, backgroundColor: "var(--sidebar-hover)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-foreground-muted hover:text-red-400 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Cerrar Sesión</span>
                </motion.button>
            </div>
        </aside >
    );
}
