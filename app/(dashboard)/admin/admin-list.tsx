"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Video {
    id: string;
    title: string;
    description: string;
    created_at: string;
}

interface AdminListProps {
    videos: Video[];
}

export function AdminList({ videos }: AdminListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar este video? Esta acción no se puede deshacer.")) return;

        setDeletingId(id);

        try {
            const { error } = await supabase
                .from("media")
                .delete()
                .eq("id", id);

            if (error) throw error;

            router.refresh();
        } catch (error) {
            console.error("Error deleting video:", error);
            alert("Error al eliminar el video");
        } finally {
            setDeletingId(null);
        }
    };

    if (videos.length === 0) {
        return (
            <div className="glass rounded-xl p-8 text-center text-foreground-muted">
                No hay videos registrados.
            </div>
        );
    }

    return (
        <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-background-secondary/50">
                            <th className="text-left py-4 px-6 text-sm font-medium text-foreground-muted">Título</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-foreground-muted">Fecha</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-foreground-muted">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {videos.map((video) => (
                            <tr key={video.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                                <td className="py-4 px-6 text-foreground font-medium">{video.title}</td>
                                <td className="py-4 px-6 text-foreground-muted text-sm">
                                    {new Date(video.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <button
                                        onClick={() => handleDelete(video.id)}
                                        disabled={deletingId === video.id}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                                    >
                                        {deletingId === video.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
