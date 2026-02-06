"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileVideo, Plus, Loader2, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import * as UpChunk from "@mux/upchunk";
import { getMuxUploadUrl } from "@/app/(dashboard)/upload-video/actions";
import { createClient } from "@/lib/supabase/client";

// Define the shape of our video data
interface ProcessedVideoData {
    asset_id: string;
    playback_id: string;
    filename: string;
    duration: number;
    created_at_video: string;
    uploaded_at_mux: string;
    description: string;
    summary: string;
    transcription: string;
    title: string;
}

export function VideoUploadCard() {
    const [mode, setMode] = useState<"idle" | "uploading" | "processing" | "review">("idle");
    const [file, setFile] = useState<File | null>(null);
    const [progress, setProgress] = useState(0);
    const [processingStep, setProcessingStep] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<ProcessedVideoData | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setMode("uploading");
            setError(null);
            await startUpload(selectedFile);
        }
    };

    const startUpload = async (fileToUpload: File) => {
        try {
            // 1. Get Mux Upload URL
            const { url, id: uploadId } = await getMuxUploadUrl();

            // 2. Start Upload
            const upload = UpChunk.createUpload({
                endpoint: url,
                file: fileToUpload,
                chunkSize: 5120, // 5MB
            });

            upload.on("progress", (detail) => {
                setProgress(Math.floor(detail.detail));
            });

            upload.on("success", async () => {
                setMode("processing");
                setProcessingStep("Iniciando procesamiento IA...");
                await processVideo(uploadId, fileToUpload.name);
            });

            upload.on("error", (detail) => {
                setError(`Error en subida: ${detail.detail.message}`);
                setMode("idle");
            });

        } catch (err: any) {
            setError(err.message || "Error iniciando carga");
            setMode("idle");
        }
    };

    const processVideo = async (uploadId: string, filename: string) => {
        try {
            setProcessingStep("Esperando que Mux procese el video...");

            const response = await fetch("/api/process-mux-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uploadId, filename }),
            });

            if (!response.ok) {
                throw new Error("Error en procesamiento del servidor");
            }

            const data = await response.json();

            setFormData({
                asset_id: data.asset_id,
                playback_id: data.playback_id,
                filename: data.filename,
                duration: data.duration,
                created_at_video: data.created_at,
                uploaded_at_mux: data.uploaded_at_mux,
                description: data.description,
                summary: data.summary,
                transcription: data.transcription,
                title: data.title
            });

            setMode("review");

        } catch (err: any) {
            setError(err.message || "Error procesando video");
            setMode("idle"); // Offer retry? For now, reset.
        }
    };

    const handleSave = async () => {
        if (!formData) return;
        setIsSaving(true);
        setError(null);

        try {
            const supabase = createClient();

            const { error: dbError } = await supabase
                .from("historial_videos_subidos_a_mux")
                .insert({
                    asset_id: formData.asset_id,
                    playback_id: formData.playback_id,
                    nombre_archivo: formData.filename,
                    duracion: formData.duration,
                    fecha_creacion_video: formData.created_at_video,
                    fecha_carga_mux: formData.uploaded_at_mux,
                    descripcion: formData.description,
                    resumen: formData.summary,
                    transcripcion: formData.transcription,
                    titulo: formData.title
                });

            if (dbError) throw dbError;

            // Success! Reset or show success state
            alert("¡Video guardado exitosamente!");
            setMode("idle");
            setFile(null);
            setFormData(null);
            setProgress(0);

        } catch (err: any) {
            setError(`Error guardando en base de datos: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // --- RENDER STATES ---

    if (mode === "idle") {
        return (
            <Card className="h-full border-dashed border-2 border-white/20 bg-white/5 hover:border-neon-blue/50 hover:bg-white/10 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}>
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4">
                    <div className="p-4 rounded-full bg-neon-blue/10 group-hover:scale-110 transition-transform">
                        <Plus className="h-10 w-10 text-neon-blue" />
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">Subir Nuevo Video</h3>
                        <p className="text-sm text-foreground-muted">Click para seleccionar MP4</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (mode === "uploading") {
        return (
            <Card className="h-full border-white/10 bg-black/20">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6 p-8">
                    <div className="relative h-20 w-20">
                        <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-neon-blue border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                            {progress}%
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-medium">Subiendo a Mux...</h3>
                        <p className="text-sm text-foreground-muted">{file?.name}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (mode === "processing") {
        return (
            <Card className="h-full border-white/10 bg-black/20">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] gap-6 p-8">
                    <Loader2 className="h-12 w-12 text-purple-400 animate-spin" />
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-medium">Procesando Video</h3>
                        <p className="text-sm text-foreground-muted animate-pulse">{processingStep}</p>
                        <p className="text-xs text-foreground-muted/50 max-w-xs mx-auto">
                            Esto incluye transcripción y generación de metadatos con IA. Puede tardar unos minutos.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
            <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Revisar y Guardar
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setMode("idle")}>
                        Cancelar
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Título Generado</Label>
                        <Input
                            value={formData?.title || ""}
                            onChange={e => setFormData(prev => prev ? { ...prev, title: e.target.value } : null)}
                            className="bg-white/5 border-white/10"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Archivo</Label>
                        <Input value={formData?.filename || ""} disabled className="bg-white/5 border-white/10 opacity-70" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                        value={formData?.description || ""}
                        onChange={e => setFormData(prev => prev ? { ...prev, description: e.target.value } : null)}
                        className="bg-white/5 border-white/10 min-h-[80px]"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Resumen</Label>
                    <Textarea
                        value={formData?.summary || ""}
                        onChange={e => setFormData(prev => prev ? { ...prev, summary: e.target.value } : null)}
                        className="bg-white/5 border-white/10 min-h-[80px]"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Transcripción (Extracto)</Label>
                    <div className="p-3 rounded-md bg-white/5 border border-white/5 text-xs text-foreground-muted max-h-24 overflow-y-auto">
                        {formData?.transcription}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-foreground-muted bg-black/20 p-3 rounded-lg border border-white/5">
                    <div>
                        <span className="block font-semibold">Playback ID:</span>
                        <span className="font-mono text-white/70">{formData?.playback_id}</span>
                    </div>
                    <div>
                        <span className="block font-semibold">Asset ID:</span>
                        <span className="font-mono text-white/70">{formData?.asset_id}</span>
                    </div>
                    <div>
                        <span className="block font-semibold">Duración:</span>
                        <span>{formData?.duration}s</span>
                    </div>
                    <div>
                        <span className="block font-semibold">Subido:</span>
                        <span>{formData?.uploaded_at_mux ? new Date(formData.uploaded_at_mux).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-md">
                        {error}
                    </div>
                )}

                <Button
                    className="w-full bg-gradient-to-r from-neon-blue to-cyan-500 text-black font-bold hover:opacity-90 transition-opacity"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar en Historial
                        </>
                    )}
                </Button>
            </div>
        </Card>
    );
}
