"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Wand2, Loader2, Save, Check, Search, BrainCircuit, Calendar, Clock, Timer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductionPanel } from "./production-panel";

interface Video {
    id: string;
    title: string;
    description: string | null;
    resumen: string | null;
    transcription: string | null;
    live_date: string | null;
    duration_minutes: number | null;
    created_at: string;
}

interface PastLivestream {
    id: string;
    created_at: string;
    mux_playback_id: string;
    title: string | null;
}

interface ContentClientProps {
    videos: Video[];
    pastLivestreams: PastLivestream[];
}

export function ContentClient({ videos, pastLivestreams }: ContentClientProps) {
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Editor State
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // AI State
    const [generatingTranscription, setGeneratingTranscription] = useState(false);
    const [generatingField, setGeneratingField] = useState<string | null>(null);

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

    const handleSelectVideo = (video: Video) => {
        setSelectedVideo(video);

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

        const combinedDate = formData.live_date_date && formData.live_date_time
            ? new Date(`${formData.live_date_date}T${formData.live_date_time}:00`).toISOString()
            : null;

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
            router.refresh();

            setTimeout(() => setSuccess(false), 3000);
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
                    <Tabs defaultValue="published" className="flex flex-col h-full w-full">
                        <div className="border-b border-white/10 mb-4 shrink-0">
                            <TabsList className="w-auto justify-start bg-transparent p-0 gap-6 h-auto">
                                <TabsTrigger
                                    value="published"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-500 bg-transparent px-2 py-3 text-foreground/60 hover:text-foreground/80 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                        Publicados
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="pending"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-500 data-[state=active]:text-yellow-500 bg-transparent px-2 py-3 text-foreground/60 hover:text-foreground/80 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                        Por subir
                                    </span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="published" className="flex-1 mt-0 overflow-y-auto custom-scrollbar pr-2 pb-10">
                            {pastLivestreams && pastLivestreams.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {pastLivestreams.map((stream) => (
                                        <Card key={stream.id} className="overflow-hidden border-border/20 bg-card hover:bg-card/80 transition-all group">
                                            <div className="aspect-video relative bg-black/50 overflow-hidden">
                                                {/* Thumbnail from Mux */}
                                                <img
                                                    src={`https://image.mux.com/${stream.mux_playback_id}/thumbnail.png?width=400&height=225&fit_mode=smart`}
                                                    alt={stream.title || "Livestream"}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    loading="lazy"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
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
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* List Panel */}
                                <div className="lg:col-span-1 flex flex-col gap-4">
                                    <div className="sticky top-0 bg-background z-10 space-y-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                                            <Input
                                                placeholder="Buscar video..."
                                                className="pl-9"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-h-[600px] pr-2">
                                        {filteredVideos.map(video => (
                                            <motion.div
                                                key={video.id}
                                                layoutId={video.id}
                                                onClick={() => handleSelectVideo(video)}
                                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedVideo?.id === video.id
                                                    ? "bg-neon-blue/10 border-neon-blue/50 ring-1 ring-neon-blue/20"
                                                    : "glass border-white/5 hover:bg-white/5"
                                                    }`}
                                            >
                                                <h3 className={`font-medium text-sm line-clamp-1 ${selectedVideo?.id === video.id ? "text-neon-blue" : "text-foreground"
                                                    }`}>
                                                    {video.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-foreground-muted">
                                                        {new Date(video.created_at).toLocaleDateString()}
                                                    </span>
                                                    {video.transcription && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 text-[10px] text-green-500 font-medium">
                                                            <BrainCircuit className="h-3 w-3" />
                                                            IA Ready
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                        {filteredVideos.length === 0 && (
                                            <div className="text-center py-8 text-foreground-muted text-sm">
                                                No se encontraron videos pendientes por subir.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Editor Panel */}
                                <div className="lg:col-span-2">
                                    {selectedVideo ? (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={selectedVideo.id}
                                        >
                                            <Card className="border-neon-blue/20 shadow-lg shadow-neon-blue/5 h-full">
                                                <CardHeader className="border-b border-border/50 pb-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle>Editando Contenido</CardTitle>
                                                            <CardDescription>{selectedVideo.title}</CardDescription>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-6 pt-6">
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
                                                    <div className="flex justify-end pt-4">
                                                        <button
                                                            onClick={handleSave}
                                                            disabled={loading}
                                                            className="bg-neon-blue hover:bg-neon-blue/90 text-black font-medium py-2.5 px-6 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-neon-blue/20"
                                                        >
                                                            {loading ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                    Guardando...
                                                                </>
                                                            ) : success ? (
                                                                <>
                                                                    <Check className="h-4 w-4" />
                                                                    Guardado
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Save className="h-4 w-4" />
                                                                    Guardar Cambios
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-foreground-muted glass rounded-xl p-8 text-center">
                                            <div>
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FileText className="h-8 w-8 opacity-20" />
                                                </div>
                                                <h3 className="text-lg font-medium text-foreground mb-1">Selecciona un Video</h3>
                                                <p className="text-sm max-w-xs mx-auto">
                                                    Elige un video de la lista para gestionar su información, agenda y contenido IA.
                                                </p>
                                            </div>
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
            </Tabs>
        </div>
    );
}
