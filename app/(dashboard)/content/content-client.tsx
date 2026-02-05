"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    FileText, Wand2, Loader2, Save, Check, Search, BrainCircuit, Calendar, Clock, Timer,
    Plus, Eye, Video as VideoIcon, Play, Settings, AlertTriangle, Download, Edit, X
} from "lucide-react";
import { publishVideo, unpublishVideo } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ProductionPanel } from "./production-panel";
import MuxPlayer from "@mux/mux-player-react";
import { DownloadButton } from "@/components/download-button";
import { cn } from "@/lib/utils";
import { AdminList } from "../admin/admin-list";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Schema Configuration for Manual Import
const manualImportSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    description: z.string().optional(),
    mux_playback_id: z.string().optional(),
    mux_asset_id: z.string().optional(),
}).superRefine((data, ctx) => {
    if (!data.mux_playback_id && !data.mux_asset_id) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debes ingresar al menos un ID de Mux (Asset o Playback).",
            path: ["mux_asset_id"],
        });
    }
});

type ManualImportFormValues = z.infer<typeof manualImportSchema>;

// Unified Video Interface to handle both local uploads and production streams
interface Video {
    id: string;
    title: string;
    description: string | null;
    resumen: string | null;
    transcription: string | null;
    live_date: string | null;
    duration_minutes: number | null;
    created_at: string;
    url?: string; // Added for download support
    mux_playback_id?: string | null;
    live_stream_config_id?: string; // Optional field for detailed copy
}

// PastLivestream is significantly simpler, but we can map it to Video or just use Video with optional fields
// For simplicity in the UI, we will treat everything as a Video object
type PastLivestream = Partial<Video> & {
    id: string;
    created_at: string;
    mux_playback_id: string;
    title: string | null;
};

interface ContentClientProps {
    videos: Video[];
    pastLivestreams: PastLivestream[];
}

export function ContentClient({ videos, pastLivestreams }: ContentClientProps) {
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal State
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false); // New state for video-only player
    const [isManualImportOpen, setIsManualImportOpen] = useState(false); // New state for manual import modal
    const [isEditing, setIsEditing] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState("published");

    // Editor State
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Confirmation Modal State
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        type: "publish" | "unpublish";
        video: Video | PastLivestream | null;
    }>({ isOpen: false, type: "publish", video: null });

    // AI State
    const [generatingTranscription, setGeneratingTranscription] = useState(false);
    const [generatingField, setGeneratingField] = useState<string | null>(null);

    // Manual Import Form
    const manualImportForm = useForm<ManualImportFormValues>({
        resolver: zodResolver(manualImportSchema),
        defaultValues: {
            title: "",
            description: "",
            mux_playback_id: "",
            mux_asset_id: "",
        },
    });

    const onManualImportSubmit = async (data: ManualImportFormValues) => {
        setLoading(true);
        try {
            const { error } = await supabase.from("media").insert([
                {
                    title: data.title.trim(),
                    description: data.description,
                    mux_playback_id: data.mux_playback_id?.trim(),
                    mux_asset_id: data.mux_asset_id?.trim(),
                },
            ]);

            if (error) throw error;

            setSuccess(true);
            manualImportForm.reset();
            router.refresh();

            // Optional: Close modal after success or keep open for more additions?
            // User asked to clone "Administrar", which stays open. So we keep it open but show success.
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Error creating video:", error);
            alert("Error al crear el video. Verifica la consola.");
        } finally {
            setLoading(false);
        }
    };

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        resumen: "",
        transcription: "",
        live_date_date: "",
        live_date_time: "",
        duration_minutes: "",
    });

    const supabase = createClient();
    const router = useRouter();

    // Publish / Unpublish Handlers
    const handleConfirmAction = async () => {
        if (!confirmAction.video) return;

        setLoading(true);
        try {
            if (confirmAction.type === "publish") {
                // Publish: Server Action
                const video = confirmAction.video as Video;

                // Validate required fields before publishing
                if (!video.live_date) {
                    alert("⚠️ Este video no tiene una fecha asignada (live_date). Por favor, edita el video y agrega una fecha antes de publicar.");
                    setLoading(false);
                    return;
                }

                const result = await publishVideo(video);

                if (!result.success) throw new Error(result.error);
            } else {
                // Unpublish: Server Action
                const result = await unpublishVideo(confirmAction.video.id);

                if (!result.success) throw new Error(result.error);
            }

            setConfirmAction({ isOpen: false, type: "publish", video: null });
            router.refresh();
        } catch (error) {
            console.error("Error executing action:", error);
            // Enhanced error logging
            if (typeof error === 'object' && error !== null) {
                console.error("Full error object:", JSON.stringify(error, null, 2));
            }
            alert(`Error al ejecutar la acción: ${error instanceof Error ? error.message : "Detalles en consola"}`);
        } finally {
            setLoading(false);
        }
    };


    const handleSelectVideo = (video: Video | PastLivestream) => {
        // Cast to Video for internal state, ensuring defaults for missing fields
        const fullVideo: Video = {
            id: video.id,
            title: video.title || "Sin título",
            description: video.description || null,
            resumen: video.resumen || null,
            transcription: video.transcription || null,
            live_date: video.live_date || null,
            duration_minutes: video.duration_minutes || null,
            created_at: video.created_at,
            url: video.url,
            mux_playback_id: video.mux_playback_id,
        };

        setSelectedVideo(fullVideo);
        setIsDetailOpen(true);
        setIsEditing(false); // Default to view mode

        // Initialize form data
        let datePart = "";
        let timePart = "";

        if (video.live_date) {
            try {
                const dateObj = new Date(video.live_date);
                datePart = dateObj.toISOString().split('T')[0];
                timePart = dateObj.toTimeString().split(' ')[0].substring(0, 5);
            } catch (e) {
                console.warn("Error parsing date", e);
            }
        }

        setFormData({
            title: video.title || "",
            description: video.description || "",
            resumen: video.resumen || "",
            transcription: video.transcription || "",
            live_date_date: datePart,
            live_date_time: timePart,
            duration_minutes: video.duration_minutes ? video.duration_minutes.toString() : "",
        });
        setSuccess(false);
    };

    const handlePlayVideo = (video: Video | PastLivestream) => {
        // Cast to Video just for playback ID access
        const fullVideo: Video = {
            id: video.id,
            title: video.title || "Sin título",
            description: video.description || null,
            resumen: video.resumen || null,
            transcription: video.transcription || null,
            live_date: video.live_date || null,
            duration_minutes: video.duration_minutes || null,
            created_at: video.created_at,
            url: video.url,
            mux_playback_id: video.mux_playback_id,
        };
        setSelectedVideo(fullVideo);
        setIsVideoPlayerOpen(true);
    };

    const handleCloseModal = () => {
        setIsDetailOpen(false);
        setIsVideoPlayerOpen(false);
        setIsManualImportOpen(false);
    };

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // AI Actions
    const handleGenerateTranscription = async () => {
        if (!selectedVideo) return;
        setGeneratingTranscription(true);
        try {
            const res = await fetch("/api/transcribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId: selectedVideo.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                const msg = data.details || data.error || "Error al transcribir";
                throw new Error(msg);
            }
            handleChange("transcription", data.transcription || "");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error desconocido";
            alert(`Error: ${msg}`);
        } finally {
            setGeneratingTranscription(false);
        }
    };

    const handleGenerateField = async (field: "title" | "resumen" | "description") => {
        if (!selectedVideo || !formData.transcription) {
            alert("Necesitas una transcripción para generar contenido con IA.");
            return;
        }

        setGeneratingField(field);

        try {
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transcription: formData.transcription,
                    field,
                    currentContent: formData[field]
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Error al generar contenido");
            }

            if (data.result) {
                handleChange(field, data.result);
            }

        } catch (error: unknown) {
            console.error("Error generating content:", error);
            const msg = error instanceof Error ? error.message : "Error desconocido";
            alert(`Error de IA: ${msg}`);
        } finally {
            setGeneratingField(null);
        }
    };

    const handleSave = async () => {
        if (!selectedVideo) return;
        setLoading(true);

        // Build live_date: if only date is provided, default time to 00:00
        // If only time is provided without date, ignore it (date is required)
        let combinedDate: string | null = null;
        if (formData.live_date_date) {
            const timeStr = formData.live_date_time || "00:00";
            combinedDate = new Date(`${formData.live_date_date}T${timeStr}:00`).toISOString();
        }

        try {
            const { error } = await supabase
                .from("media")
                .update({
                    title: formData.title,
                    description: formData.description,
                    resumen: formData.resumen,
                    transcription: formData.transcription,
                    live_date: combinedDate,
                    duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : 0,
                })
                .eq("id", selectedVideo.id);

            if (error) throw error;

            setSuccess(true);

            // Update local state to reflect changes immediately
            if (selectedVideo) {
                setSelectedVideo({
                    ...selectedVideo,
                    title: formData.title,
                    description: formData.description,
                    resumen: formData.resumen,
                    transcription: formData.transcription,
                    live_date: combinedDate,
                    duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : 0,
                });
            }

            router.refresh();

            // Switch back to view mode on success
            setTimeout(() => {
                setSuccess(false);
                setIsEditing(false);
            }, 1000);
        } catch (error: unknown) {
            console.error("Error updating video content:", error);
            const msg = error instanceof Error ? error.message : "Error desconocido";
            alert(`Error al guardar: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredVideos = videos.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const hasTranscription = formData.transcription.length > 50;

    return (
        <div className="max-w-7xl pb-20 h-[calc(100vh-100px)]">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                        <FileText className="h-5 w-5 text-neon-blue" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Editor de Contenido IA</h1>
                </div>
                <p className="text-foreground-muted">
                    Mejora tus videos con transcripciones y metadatos generados por IA.
                </p>
            </motion.div>



            <Tabs defaultValue="lives" className="h-full flex flex-col">
                <TabsList className="mb-4 w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger
                        value="lives"
                        className="rounded-t-lg rounded-b-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-neon-blue data-[state=active]:text-neon-blue px-6 py-3"
                    >
                        Lives
                    </TabsTrigger>
                    <TabsTrigger
                        value="cursos"
                        className="rounded-t-lg rounded-b-none data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-neon-blue data-[state=active]:text-neon-blue px-6 py-3"
                    >
                        Cursos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="lives" className="flex-1 mt-0 h-full flex flex-col overflow-hidden">
                    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="flex flex-col h-full w-full">
                        <div className="border-b border-white/10 mb-4 shrink-0 flex items-center justify-between">
                            <TabsList className="w-auto justify-start bg-transparent p-0 gap-6 h-auto">
                                <TabsTrigger
                                    value="published"
                                    className="relative rounded-t-lg bg-transparent px-6 py-3 text-foreground/60 hover:text-foreground/80 hover:bg-white/5 transition-all w-[160px]"
                                >
                                    {activeSubTab === "published" && (
                                        <motion.div
                                            layoutId="activeTabIndicator"
                                            className="absolute inset-0 rounded-t-lg bg-green-500/20 border-b-2 border-green-500 shadow-[inset_0_-1px_10px_rgba(34,197,94,0.2)]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className={`relative z-10 flex items-center gap-2 justify-center ${activeSubTab === "published" ? "text-green-400 font-bold" : ""}`}>
                                        <div className={`h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] transition-opacity duration-300 ${activeSubTab === "published" ? "opacity-100" : "opacity-50"}`} />
                                        Publicados
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="pending"
                                    className="relative rounded-t-lg bg-transparent px-6 py-3 text-foreground/60 hover:text-foreground/80 hover:bg-white/5 transition-all w-[160px]"
                                >
                                    {activeSubTab === "pending" && (
                                        <motion.div
                                            layoutId="activeTabIndicator"
                                            className="absolute inset-0 rounded-t-lg bg-yellow-500/20 border-b-2 border-yellow-500 shadow-[inset_0_-1px_10px_rgba(234,179,8,0.2)]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className={`relative z-10 flex items-center gap-2 justify-center ${activeSubTab === "pending" ? "text-yellow-400 font-bold" : ""}`}>
                                        <div className={`h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)] transition-opacity duration-300 ${activeSubTab === "pending" ? "opacity-100" : "opacity-50"}`} />
                                        Sin publicar
                                    </span>
                                </TabsTrigger>
                            </TabsList>


                        </div>

                        <TabsContent value="published" className="flex-1 mt-0 overflow-y-auto custom-scrollbar pr-2 pb-10">
                            {pastLivestreams && pastLivestreams.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {pastLivestreams.map((stream) => (
                                        <Card key={stream.id} className="overflow-hidden border-border/20 bg-card hover:bg-card/80 transition-all group max-w-sm mx-auto w-full flex flex-col">
                                            <div className="aspect-video relative bg-black/50 overflow-hidden">
                                                {/* Thumbnail from Mux */}
                                                <div
                                                    className="w-full h-full cursor-pointer"
                                                    onClick={() => handlePlayVideo(stream)}
                                                >
                                                    <img
                                                        src={`https://image.mux.com/${stream.mux_playback_id?.trim()}/thumbnail.jpg`}
                                                        alt={stream.title || "Livestream"}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.parentElement?.querySelector('.fallback-placeholder')?.classList.remove('hidden');
                                                        }}
                                                    />
                                                    {/* Fallback Placeholder */}
                                                    <div className="fallback-placeholder hidden absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-zinc-900 p-4 text-center pointer-events-none">
                                                        <div className="p-3 rounded-full bg-white/5 mb-2">
                                                            <VideoIcon className="h-8 w-8 text-foreground-muted" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
                                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono backdrop-blur-sm">
                                                    VOD
                                                </div>
                                            </div>
                                            <CardContent className="p-4">
                                                <h3 className="font-medium text-sm text-foreground line-clamp-1 mb-1" title={stream.title || "Sin título"}>
                                                    {stream.title || "Sin título"}
                                                </h3>
                                                <p className="text-xs text-foreground-muted">
                                                    {new Date(stream.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </CardContent>
                                            <div className="flex items-center gap-2 p-4 pt-0 mt-auto">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 text-xs h-8 bg-transparent border-white/10 hover:bg-white/5"
                                                    onClick={() => handleSelectVideo(stream)}
                                                >
                                                    <Eye className="h-3 w-3 mr-2" />
                                                    Ver
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    onClick={() => setConfirmAction({ isOpen: true, type: "unpublish", video: stream })}
                                                    title="Quitar publicación"
                                                >
                                                    Quitar
                                                </Button>

                                                {/* Note: PastLivestreams might not have a direct URL, treating as disabled if missing */}
                                                <div className="h-8 w-8 flex items-center justify-center">
                                                    <DownloadButton videoId={stream.id} minimal className="hover:bg-white/5 hover:text-neon-blue rounded-md" />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center border border-dashed border-border/30 rounded-xl bg-card/30">
                                    <p className="text-foreground-muted text-sm">No hay lives publicados.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="pending" className="flex-1 mt-0 overflow-y-auto custom-scrollbar pr-2 pb-10">
                            <div className="flex flex-col gap-6">
                                {/* Header Actions (Search + Manual Import) */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="relative max-w-md w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                                        <Input
                                            placeholder="Buscar video..."
                                            className="pl-9"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        onClick={() => setIsManualImportOpen(true)}
                                        className="bg-neon-purple hover:bg-neon-purple/90 text-white border-none shadow-lg shadow-neon-purple/20 gap-2 shrink-0"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Agregar video manualmente de mux
                                    </Button>
                                </div>

                                {/* Gallery Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredVideos.map(video => (
                                        <Card key={video.id} className="group overflow-hidden bg-card hover:bg-card/80 transition-all border-border/20">
                                            <div
                                                className="aspect-video relative bg-black/40 flex items-center justify-center overflow-hidden cursor-pointer"
                                                onClick={() => handlePlayVideo(video)}
                                            >
                                                {video.mux_playback_id ? (
                                                    <>
                                                        <img
                                                            src={`https://image.mux.com/${video.mux_playback_id?.trim()}/thumbnail.jpg`}
                                                            alt={video.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            loading="lazy"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.parentElement?.querySelector('.fallback-placeholder')?.classList.remove('hidden');
                                                            }}
                                                        />
                                                        {/* Fallback Placeholder */}
                                                        <div className="fallback-placeholder hidden absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-zinc-900 p-4 text-center pointer-events-none">
                                                            <div className="z-10 bg-white/5 p-3 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                                                                <Play className="h-6 w-6 text-foreground/80 fill-current" />
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* Placeholder for Video Thumbnail */}
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-neon-blue/5 to-transparent opacity-50" />
                                                        <div className="z-10 bg-white/5 p-3 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                                                            <Play className="h-6 w-6 text-foreground/80 fill-current" />
                                                        </div>
                                                    </>
                                                )}

                                                {/* Status Badge */}
                                                {video.transcription && (
                                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-green-500/10 backdrop-blur-sm text-[10px] text-green-500 font-medium border border-green-500/20 flex items-center gap-1">
                                                        <BrainCircuit className="h-3 w-3" />
                                                        IA Ready
                                                    </div>
                                                )}
                                            </div>

                                            <CardContent className="p-4">
                                                <div className="mb-4">
                                                    <h3 className="font-medium text-sm text-foreground line-clamp-1 mb-1" title={video.title}>
                                                        {video.title}
                                                    </h3>
                                                    <p className="text-xs text-foreground-muted flex items-center gap-2">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(video.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 mt-auto">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 text-xs h-8 bg-transparent border-white/10 hover:bg-white/5"
                                                        onClick={() => handleSelectVideo(video)}
                                                    >
                                                        <Eye className="h-3 w-3 mr-2" />
                                                        Ver
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                                        onClick={() => setConfirmAction({ isOpen: true, type: "publish", video: video })}
                                                        title="Publicar video"
                                                    >
                                                        Publicar
                                                    </Button>

                                                    <div className="h-8 w-8 flex items-center justify-center">
                                                        <DownloadButton videoId={video.id} minimal className="hover:bg-white/5 hover:text-neon-blue rounded-md" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {filteredVideos.length === 0 && (
                                        <div className="col-span-full py-12 text-center border border-dashed border-border/30 rounded-xl bg-card/30">
                                            <p className="text-foreground-muted text-sm">No se encontraron videos sin publicar.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                <TabsContent value="cursos" className="h-full">
                    <ProductionPanel />
                </TabsContent>
            </Tabs >

            {/* Detail Modal */}
            < Modal
                isOpen={isDetailOpen}
                onClose={handleCloseModal}
                title={isEditing ? "Editando Contenido" : selectedVideo?.title || "Detalle del Video"}
                className="max-w-4xl"
            >
                {selectedVideo && (
                    <div className="max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                        {/* Video Player Section */}
                        {selectedVideo.mux_playback_id && (
                            <div className="aspect-video rounded-lg overflow-hidden border border-white/10 shadow-2xl mb-6 bg-black">
                                <MuxPlayer
                                    playbackId={selectedVideo.mux_playback_id}
                                    streamType="on-demand"
                                    accentColor="#00f0ff"
                                    metadata={{
                                        video_id: selectedVideo.id,
                                        video_title: selectedVideo.title,
                                    }}
                                />
                            </div>
                        )}

                        {isEditing ? (
                            /* EDIT MODE (Existing Form) */
                            <div className="space-y-6">
                                {/* AI Transcription Action */}
                                <div className="bg-neon-blue/5 border border-neon-blue/10 rounded-lg p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-neon-blue mb-1">Generación de Texto</h4>
                                            <p className="text-xs text-foreground-muted">
                                                Analiza el audio del video para habilitar las funciones de IA.
                                                {hasTranscription && !generatingTranscription && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-500 uppercase tracking-wide">
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Transcripción Lista
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleGenerateTranscription}
                                            disabled={generatingTranscription}
                                            className="shrink-0 bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/30 rounded-lg py-2 px-4 flex items-center gap-2 text-sm font-medium transition-all disabled:opacity-70"
                                        >
                                            {generatingTranscription ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <BrainCircuit className="h-4 w-4" />
                                            )}
                                            {formData.transcription ? "Regenerar Análisis" : "Analizar Video"}
                                        </button>
                                    </div>
                                    {generatingTranscription && (
                                        <div className="mt-4 space-y-2">
                                            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-neon-blue rounded-full"
                                                    initial={{ x: "-100%" }}
                                                    animate={{ x: "200%" }}
                                                    transition={{
                                                        duration: 1.8,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    }}
                                                    style={{ width: "40%" }}
                                                />
                                            </div>
                                            <p className="text-xs text-foreground-muted animate-pulse">
                                                Transcribiendo audio… Puede tardar varios minutos en videos largos. No cierres esta página.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Metadata Fields with AI */}
                                <div className="grid gap-6 pt-2">
                                    {/* TITLE */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Título</Label>
                                            {hasTranscription && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleGenerateField("title")}
                                                    disabled={!!generatingField}
                                                    className="text-xs text-neon-blue hover:text-neon-blue/80 flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {generatingField === "title" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                                    Mejorar con IA
                                                </button>
                                            )}
                                        </div>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => handleChange("title", e.target.value)}
                                        />
                                    </div>

                                    {/* DESCRIPTION */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Descripción</Label>
                                            {hasTranscription && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleGenerateField("description")}
                                                    disabled={!!generatingField}
                                                    className="text-xs text-neon-blue hover:text-neon-blue/80 flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {generatingField === "description" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                                    Mejorar con IA
                                                </button>
                                            )}
                                        </div>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => handleChange("description", e.target.value)}
                                            className="min-h-[120px]"
                                            placeholder="Descripción original del video..."
                                        />
                                    </div>

                                    {/* TRANSCRIPCIÓN */}
                                    <div className="space-y-2">
                                        <Label>Transcripción</Label>
                                        <Textarea
                                            value={formData.transcription}
                                            onChange={(e) => handleChange("transcription", e.target.value)}
                                            className="min-h-[180px] font-mono text-xs whitespace-pre-wrap"
                                            placeholder="La transcripción aparecerá aquí después de analizar el video..."
                                            readOnly={generatingTranscription}
                                        />
                                        {!formData.transcription && !generatingTranscription && (
                                            <p className="text-xs text-foreground-muted">
                                                Pulsa &quot;Analizar Video&quot; para generar la transcripción del audio.
                                            </p>
                                        )}
                                    </div>

                                    {/* RESUMEN (Markdown) */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Resumen (Markdown)</Label>
                                            {hasTranscription && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleGenerateField("resumen")}
                                                    disabled={!!generatingField}
                                                    className="text-xs text-neon-blue hover:text-neon-blue/80 flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {generatingField === "resumen" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                                    Generar Resumen
                                                </button>
                                            )}
                                        </div>
                                        <Textarea
                                            value={formData.resumen}
                                            onChange={(e) => handleChange("resumen", e.target.value)}
                                            className="min-h-[150px] font-mono text-xs"
                                            placeholder="Resumen generado por IA a partir de la transcripción..."
                                        />
                                    </div>

                                    {/* Scheduling Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Calendar className="h-3 w-3" /> Fecha</Label>
                                            <Input
                                                type="date"
                                                value={formData.live_date_date}
                                                onChange={(e) => handleChange("live_date_date", e.target.value)}
                                                className="[color-scheme:dark]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Clock className="h-3 w-3" /> Hora</Label>
                                            <Input
                                                type="time"
                                                value={formData.live_date_time}
                                                onChange={(e) => handleChange("live_date_time", e.target.value)}
                                                className="[color-scheme:dark]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2"><Timer className="h-3 w-3" /> Duración (min)</Label>
                                            <Input
                                                type="number"
                                                value={formData.duration_minutes}
                                                onChange={(e) => handleChange("duration_minutes", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Bar */}
                                <div className="flex justify-end pt-4 gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={toggleEditMode}
                                        disabled={loading}
                                        className="border-white/10"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="bg-neon-blue hover:bg-neon-blue/90 text-black min-w-[140px]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                Guardando...
                                            </>
                                        ) : success ? (
                                            <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Guardado
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Guardar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* VIEW MODE */
                            <div className="space-y-8">
                                <section className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-foreground-muted mb-1">Descripción</h3>
                                        <div className="p-4 rounded-lg bg-card border border-border/40 text-sm leading-relaxed">
                                            {selectedVideo.description || <span className="text-foreground-muted italic">Sin descripción</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-foreground-muted mb-1">Resumen</h3>
                                        <div className="p-4 rounded-lg bg-card border border-border/40 text-sm leading-relaxed font-mono whitespace-pre-wrap">
                                            {selectedVideo.resumen || <span className="text-foreground-muted italic">Sin resumen generado</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-foreground-muted mb-1">Transcripción</h3>
                                        <div className="p-4 rounded-lg bg-card border border-border/40 text-xs leading-relaxed font-mono whitespace-pre-wrap h-64 overflow-y-auto custom-scrollbar">
                                            {selectedVideo.transcription || <span className="text-foreground-muted italic">Sin transcripción disponible</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-card border border-border/40">
                                        <div>
                                            <span className="text-xs text-foreground-muted block mb-1">Fecha Programada</span>
                                            <span className="text-sm font-medium">
                                                {selectedVideo.live_date
                                                    ? new Date(selectedVideo.live_date).toLocaleString()
                                                    : <span className="text-foreground-muted italic">No definida</span>}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-foreground-muted block mb-1">Duración</span>
                                            <span className="text-sm font-medium">
                                                {selectedVideo.duration_minutes
                                                    ? `${selectedVideo.duration_minutes} min`
                                                    : <span className="text-foreground-muted italic">--</span>}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-foreground-muted block mb-1">Estado IA</span>
                                            <span className="text-sm font-medium">
                                                {selectedVideo.transcription ? "Completado" : "Pendiente"}
                                            </span>
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
                                    {/* Action Buttons in View Mode */}
                                    {selectedVideo.url && (
                                        <Button variant="outline" asChild>
                                            <a href={selectedVideo.url} download target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4 mr-2" />
                                                Descargar
                                            </a>
                                        </Button>
                                    )}
                                    <Button onClick={toggleEditMode} className="bg-neon-blue hover:bg-neon-blue/90 text-black">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar Contenido
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )
                }
            </Modal >

            {/* Video Player Only Modal */}
            < Modal
                isOpen={isVideoPlayerOpen}
                onClose={handleCloseModal}
                title={selectedVideo?.title || "Reproductor"}
                className="max-w-5xl bg-black border-white/10"
            >
                {selectedVideo && selectedVideo.mux_playback_id && (
                    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl">
                        <MuxPlayer
                            playbackId={selectedVideo.mux_playback_id}
                            streamType="on-demand"
                            accentColor="#00f0ff"
                            autoPlay
                            metadata={{
                                video_id: selectedVideo.id,
                                video_title: selectedVideo.title,
                            }}
                        />
                    </div>
                )}
            </Modal >


            {/* Manual Import Modal (Cloned from Admin Panel) */}
            <Modal
                isOpen={isManualImportOpen}
                onClose={handleCloseModal}
                title="Administración Manual de Mux"
                className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden"
            >
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Form Section */}
                        <div className="xl:col-span-1">
                            <div className="sticky top-0">
                                <form onSubmit={manualImportForm.handleSubmit(onManualImportSubmit)}>
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
                                                        {...manualImportForm.register("title")}
                                                        placeholder="Título del video"
                                                    />
                                                    {manualImportForm.formState.errors.title && <span className="text-xs text-red-400">{manualImportForm.formState.errors.title?.message}</span>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="description">Descripción</Label>
                                                    <Textarea
                                                        id="description"
                                                        {...manualImportForm.register("description")}
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
                                                            {...manualImportForm.register("mux_asset_id")}
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
                                                            {...manualImportForm.register("mux_playback_id")}
                                                            placeholder="Ej: 3f8a2..."
                                                            className="border-neon-purple/30 focus-visible:ring-neon-purple"
                                                        />
                                                    </div>
                                                    {manualImportForm.formState.errors.mux_asset_id && <span className="text-xs text-red-400 block mt-1">{manualImportForm.formState.errors.mux_asset_id?.message}</span>}
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
                            </div>
                        </div>

                        {/* List Section */}
                        <div className="xl:col-span-2">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-neon-blue" />
                                    Videos Existentes
                                </h2>
                                {/* Reusing AdminList component but passing current videos from props */}
                                {/* Note: AdminList expects a specific Video interface, we might need to map or ensure compatibility */}
                                {/* The AdminList interface is compatible enough or we pass 'videos' which are Any[] in AdminClient but typed here */}
                                <AdminList videos={videos as any[]} />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
                title={confirmAction.type === "publish" ? "Publicar Video" : "Quitar Publicación"}
                className="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-foreground-muted">
                        {confirmAction.type === "publish"
                            ? "¿Estás seguro de que deseas publicar este video? Aparecerá en la sección de 'Publicados'."
                            : "¿Estás seguro de que deseas quitar esta publicación? Se eliminará de la lista de 'Publicados'."
                        }
                    </p>
                    <div className="p-4 bg-card border border-border/40 rounded-lg">
                        <p className="font-medium text-foreground">{confirmAction.video?.title || "Sin título"}</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setConfirmAction({ ...confirmAction, isOpen: false })}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmAction}
                            className={confirmAction.type === "publish" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {confirmAction.type === "publish" ? "Confirmar Publicación" : "Eliminar Publicación"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
