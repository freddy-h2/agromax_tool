"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Plus, Video, Save, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AdminList } from "./admin-list";

interface AdminClientProps {
    videos: any[];
}

export function AdminClient({ videos }: AdminClientProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        resumen: "",
        live_date_date: "",
        live_date_time: "",
        duration_minutes: "",
        mux_playback_id: "",
        mux_asset_id: "",
    });

    const supabase = createClient();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const combinedDate = formData.live_date_date && formData.live_date_time
            ? new Date(`${formData.live_date_date}T${formData.live_date_time}:00`).toISOString()
            : null;

        try {
            const { error } = await supabase.from("media").insert([
                {
                    title: formData.title,
                    description: formData.description,
                    resumen: formData.resumen,
                    live_date: combinedDate,
                    duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : 0,
                    mux_playback_id: formData.mux_playback_id,
                    mux_asset_id: formData.mux_asset_id,
                },
            ]);

            if (error) throw error;

            setSuccess(true);
            setFormData({
                title: "",
                description: "",
                resumen: "",
                live_date_date: "",
                live_date_time: "",
                duration_minutes: "",
                mux_playback_id: "",
                mux_asset_id: "",
            });
            router.refresh();

            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error creating video:", error);
            alert("Error al crear el video. Verifica la consola.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl pb-20">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
                        <Settings className="h-5 w-5 text-neon-purple" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Administrar Contenido</h1>
                </div>
                <p className="text-foreground-muted">
                    Agrega nuevos videos y administra el contenido existente.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="glass rounded-xl p-6 sticky top-24"
                    >
                        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-neon-purple" />
                            Agregar Video
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm text-foreground-muted block mb-1">Título</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full bg-background-secondary border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-neon-purple outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-foreground-muted block mb-1">Resumen</label>
                                <input
                                    type="text"
                                    name="resumen"
                                    value={formData.resumen}
                                    onChange={handleChange}
                                    className="w-full bg-background-secondary border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-neon-purple outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-foreground-muted block mb-1">Descripción</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full bg-background-secondary border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-neon-purple outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-foreground-muted block mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        name="live_date_date"
                                        value={formData.live_date_date}
                                        onChange={handleChange}
                                        className="w-full bg-background-secondary border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-neon-purple outline-none [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-foreground-muted block mb-1">Hora</label>
                                    <input
                                        type="time"
                                        name="live_date_time"
                                        value={formData.live_date_time}
                                        onChange={handleChange}
                                        className="w-full bg-background-secondary border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-neon-purple outline-none [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-foreground-muted block mb-1">Duración (min)</label>
                                <input
                                    type="number"
                                    name="duration_minutes"
                                    value={formData.duration_minutes}
                                    onChange={handleChange}
                                    className="w-full bg-background-secondary border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-neon-purple outline-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-border space-y-4">
                                <h3 className="text-sm font-medium text-neon-purple">Credenciales Mux</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-foreground-muted block mb-1">Mux Asset ID</label>
                                        <p className="text-xs text-foreground-muted mb-1">Necesario para habilitar descargas (Master Access)</p>
                                        <input
                                            type="text"
                                            name="mux_asset_id"
                                            value={formData.mux_asset_id}
                                            onChange={handleChange}
                                            className="w-full bg-background-secondary border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-neon-purple outline-none"
                                            placeholder="Asset ID de Mux"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-foreground-muted block mb-1">Mux Playback ID</label>
                                        <input
                                            type="text"
                                            name="mux_playback_id"
                                            value={formData.mux_playback_id}
                                            onChange={handleChange}
                                            className="w-full bg-background-secondary border border-border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-neon-purple outline-none"
                                            placeholder="Opcional (para testing)"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 bg-neon-purple hover:bg-neon-purple/90 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Guardando...</span>
                                    </>
                                ) : success ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        <span>¡Guardado!</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        <span>Guardar Video</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                            <Video className="h-5 w-5 text-neon-blue" />
                            Videos Existentes
                        </h2>
                        <AdminList videos={videos} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
