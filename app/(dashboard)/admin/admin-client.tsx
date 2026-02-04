"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Plus, Video, Save, Loader2, Check, Lock, Unlock, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { AdminList } from "./admin-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Schema Configuration
const formSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    description: z.string().optional(),
    mux_playback_id: z.string().optional(),
    mux_asset_id: z.string().optional(),
}).superRefine((data, ctx) => {
    if (!data.mux_playback_id && !data.mux_asset_id) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debes ingresar al menos un ID de Mux (Asset o Playback).",
            path: ["mux_asset_id"], // Attach error to one field to show it
        });
    }
});

type FormValues = z.infer<typeof formSchema>;

interface AdminClientProps {
    videos: any[];
}

export function AdminClient({ videos }: AdminClientProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Mux Security State: Default to unlocked for creation since we are asking the user to enter them
    const [muxLocked, setMuxLocked] = useState(false);

    const supabase = createClient();
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            mux_playback_id: "",
            mux_asset_id: "",
        },
    });

    const { register, handleSubmit, formState: { errors } } = form;

    // Submit Handler
    const onSubmit = async (data: FormValues) => {
        setLoading(true);

        try {
            const { error } = await supabase.from("media").insert([
                {
                    title: data.title,
                    description: data.description,
                    mux_playback_id: data.mux_playback_id,
                    mux_asset_id: data.mux_asset_id,
                },
            ]);

            if (error) throw error;

            setSuccess(true);
            form.reset();
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
        <div className="max-w-7xl pb-20">
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
                    <h1 className="text-2xl font-bold text-foreground">Administrar</h1>
                </div>
                <p className="text-foreground-muted">
                    Creación, eliminación y gestión técnica de videos.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="xl:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="sticky top-24"
                    >
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Card className="border-neon-purple/20 shadow-lg shadow-neon-purple/5">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Plus className="h-5 w-5 text-neon-purple" />
                                            Nuevo Video
                                        </CardTitle>
                                    </div>
                                    <CardDescription>
                                        Ingresa los datos básicos y técnicos.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Título</Label>
                                            <Input
                                                id="title"
                                                {...register("title")}
                                                placeholder="Título del video"
                                            />
                                            {errors.title && <span className="text-xs text-red-400">{errors.title.message}</span>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Descripción</Label>
                                            <Textarea
                                                id="description"
                                                {...register("description")}
                                                placeholder="Descripción técnica o interna..."
                                                className="min-h-[80px]"
                                            />
                                        </div>
                                    </div>

                                    {/* MUX SECTION */}
                                    <div className="pt-4 border-t border-border mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-medium text-neon-purple flex items-center gap-2">
                                                Credenciales Mux (Requerido)
                                            </h3>
                                        </div>

                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4 flex gap-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-yellow-200/80">
                                                Debes ingresar al menos uno de los siguientes IDs para registrar el video.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs flex justify-between">
                                                    <span>Mux Asset ID</span>
                                                    <span className="text-[10px] text-neon-blue uppercase">Para Descargas</span>
                                                </Label>
                                                <Input
                                                    {...register("mux_asset_id")}
                                                    placeholder="Ej: 00ec4d..."
                                                    className="border-neon-purple/30 focus-visible:ring-neon-purple"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs flex justify-between">
                                                    <span>Mux Playback ID</span>
                                                    <span className="text-[10px] text-green-400 uppercase">Para Reproducción Online</span>
                                                </Label>
                                                <Input
                                                    {...register("mux_playback_id")}
                                                    placeholder="Ej: 3f8a2..."
                                                    className="border-neon-purple/30 focus-visible:ring-neon-purple"
                                                />
                                            </div>
                                            {errors.mux_asset_id && <span className="text-xs text-red-400 block mt-1">{errors.mux_asset_id.message}</span>}
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-neon-purple hover:bg-neon-purple/90 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-neon-purple/20"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    <span>Guardando...</span>
                                                </>
                                            ) : success ? (
                                                <>
                                                    <Check className="h-5 w-5" />
                                                    <span>¡Guardado!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-5 w-5" />
                                                    <span>Registrar Video</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        </form>
                    </motion.div>
                </div>

                {/* List Section */}
                <div className="xl:col-span-2">
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
