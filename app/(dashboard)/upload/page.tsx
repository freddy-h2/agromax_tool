"use client";

import { useState, useEffect } from "react";
import { Upload as UploadIcon, FileVideo, CheckCircle2, Loader2, Save, Calendar, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

// Interface for Gallery Files (Shared)
interface VideoFile {
    id: string;
    fileName: string;
    assetId: string;
    size: number;
    sizeFormatted: string;
    downloadedAt: string;
    downloadedAtFormatted: string;
}

// Interface for Processed Data
interface ProcessedData {
    title: string;
    description: string;
    resumen: string;
    transcription: string;
    duration_minutes: number;
    assetId: string;
    playbackId?: string;
    liveDate?: string;
}

export default function UploadPage() {
    const router = useRouter();
    const [step, setStep] = useState<"select" | "processing" | "review" | "success">("select");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [videos, setVideos] = useState<VideoFile[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
    const [processingStage, setProcessingStage] = useState<string>("");
    const [formData, setFormData] = useState<ProcessedData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch local videos
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await fetch("/api/gallery");
                const data = await res.json();
                setVideos(data.files || []);
            } catch (error) {
                console.error("Error loading videos:", error);
            }
        };
        fetchVideos();
    }, []);

    // Handle File Selection
    const handleSelectVideo = (video: VideoFile) => {
        setSelectedVideo(video);
        startSimulation(video);
    };

    // Simulate Processing
    const startSimulation = async (video: VideoFile) => {
        setStep("processing");

        try {
            setProcessingStage("Iniciando análisis de video...");
            await new Promise(r => setTimeout(r, 1000));

            setProcessingStage("Extrayendo audio...");
            await new Promise(r => setTimeout(r, 1500));

            setProcessingStage("Transcribiendo convertidor de voz a texto (OpenAI Whisper)...");
            // Call simulation API
            const res = await fetch("/api/processing/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName: video.fileName })
            });
            const result = await res.json();

            if (!result.success) throw new Error(result.error);

            setProcessingStage("Generando resumen y metadatos (GPT-4)...");
            await new Promise(r => setTimeout(r, 1000));

            setFormData({
                title: result.data.title,
                description: result.data.resumen, // Use summary as initial description
                resumen: result.data.resumen,
                transcription: result.data.transcription,
                duration_minutes: result.data.duration_minutes,
                assetId: video.assetId,
                playbackId: "", // Simulado
            });

            setStep("review");
        } catch (error) {
            console.error("Simulation failed:", error);
            alert("Error en la simulación");
            setStep("select");
        }
    };

    // Handle Publish
    const handlePublish = async () => {
        if (!formData) return;
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/videos/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Error al publicar");

            setStep("success");
        } catch (error) {
            console.error(error);
            alert("Error al guardar en base de datos");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <UploadIcon className="h-6 w-6 text-white" />
                    <h1 className="text-2xl font-bold text-white">Publicar Video</h1>
                </div>
                <p className="text-[#888]">
                    Proceso de transcripción, resumen y publicación.
                </p>
            </div>

            {/* STEP 1: SELECT VIDEO */}
            {step === "select" && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">1. Selecciona un video descargado</h2>

                        <div className="flex items-center bg-[#0a0a0a] border border-[#333] rounded-lg p-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-md ${viewMode === "grid" ? "bg-[#333] text-white" : "text-[#888] hover:text-white"}`}
                                onClick={() => setViewMode("grid")}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-md ${viewMode === "list" ? "bg-[#333] text-white" : "text-[#888] hover:text-white"}`}
                                onClick={() => setViewMode("list")}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {videos.length === 0 ? (
                        <div className="text-center p-12 border border-[#333] rounded-xl bg-[#0a0a0a]">
                            <p className="text-[#888]">No hay videos descargados disponibles.</p>
                        </div>
                    ) : (
                        viewMode === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {videos.map((video) => (
                                    <div
                                        key={video.id}
                                        onClick={() => handleSelectVideo(video)}
                                        className="group cursor-pointer rounded-xl border border-[#333] bg-[#0a0a0a] overflow-hidden hover:border-green-500 transition-all"
                                    >
                                        <div className="aspect-video bg-[#111] flex items-center justify-center relative">
                                            <FileVideo className="h-10 w-10 text-[#555] group-hover:text-green-500 transition-colors" />
                                            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                                                {video.sizeFormatted}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-white font-medium truncate" title={video.fileName}>{video.fileName}</p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-[#888]">
                                                <Calendar className="h-3 w-3" />
                                                {video.downloadedAtFormatted}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-[#333] bg-[#0a0a0a] overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-white/5 text-[#888] font-medium border-b border-[#333]">
                                            <tr>
                                                <th className="px-4 py-3">Nombre</th>
                                                <th className="px-4 py-3">Fecha</th>
                                                <th className="px-4 py-3">Tipo</th>
                                                <th className="px-4 py-3">Tamaño</th>
                                                <th className="px-4 py-3">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#333]">
                                            {videos.map((video) => (
                                                <tr key={video.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => handleSelectVideo(video)}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-[#222] flex items-center justify-center group-hover:bg-green-500/20">
                                                                <FileVideo className="h-4 w-4 text-[#888] group-hover:text-green-500" />
                                                            </div>
                                                            <span className="text-white font-medium truncate max-w-[300px]" title={video.fileName}>
                                                                {video.fileName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[#ccc] whitespace-nowrap">
                                                        {video.downloadedAtFormatted}
                                                    </td>
                                                    <td className="px-4 py-3 text-[#888]">
                                                        MP4
                                                    </td>
                                                    <td className="px-4 py-3 text-[#ccc] font-mono">
                                                        {video.sizeFormatted}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-green-600 hover:bg-green-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            Seleccionar
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* STEP 2: PROCESSING */}
            {step === "processing" && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
                        <Loader2 className="h-16 w-16 text-green-500 animate-spin relative z-10" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Procesando Video</h3>
                    <p className="text-[#888] animate-pulse">{processingStage}</p>
                </div>
            )}

            {/* STEP 3: REVIEW FORM */}
            {step === "review" && formData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#888]">Título</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData(prev => prev ? { ...prev, title: e.target.value } : null)}
                                className="bg-[#0a0a0a] border-[#333] text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#888]">Descripción</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => prev ? { ...prev, description: e.target.value } : null)}
                                className="w-full min-h-[100px] rounded-md border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#888]">Resumen Generado (AI)</label>
                            <textarea
                                value={formData.resumen}
                                onChange={(e) => setFormData(prev => prev ? { ...prev, resumen: e.target.value } : null)}
                                className="w-full min-h-[100px] rounded-md border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#888]">Transcripción Completa</label>
                            <div className="rounded-md border border-[#333] bg-[#0a0a0a] p-4 h-48 overflow-y-auto">
                                <p className="text-sm text-[#ccc] whitespace-pre-wrap">{formData.transcription}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Actions */}
                    <div className="space-y-6">
                        <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-6 space-y-4">
                            <h3 className="font-semibold text-white">Detalles del Archivo</h3>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#888]">Duración est.:</span>
                                    <span className="text-white">{formData.duration_minutes} min</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#888]">Asset ID:</span>
                                    <span className="text-white font-mono text-xs">{formData.assetId.slice(0, 8)}...</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#333]">
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    onClick={handlePublish}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Publicar Video
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={() => setStep("select")}
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === "success" && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                    <div className="rounded-full bg-green-500/10 p-6 mb-6">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">¡Publicado con éxito!</h2>
                    <p className="text-[#888] max-w-md mb-8">
                        El video ha sido procesado y guardado en la base de datos correctamente.
                    </p>
                    <div className="flex gap-4">
                        <Button onClick={() => setStep("select")} variant="outline">
                            Subir otro video
                        </Button>
                        {/* Future: Link to dashboard or view page */}
                    </div>
                </div>
            )}
        </div>
    );
}
