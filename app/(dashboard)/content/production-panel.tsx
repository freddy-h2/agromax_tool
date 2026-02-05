"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Film,
    Loader2,
    AlertCircle,
    RefreshCw,
    CheckCircle2,
    Clock,
    Layers,
    ChevronDown,
    ChevronRight,
    FolderOpen,
    Play,
    ImageOff,
    Sparkles,
    Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VideoPlayerModal } from "@/components/video-player-modal";
import type { ProductionLessonRow } from "@/app/api/production-lessons/route";

type HierarchyModule = { id: string; title: string; lessons: ProductionLessonRow[] };
type HierarchyCourse = { id: string; title: string; modules: HierarchyModule[] };
type HierarchyCommunity = { id: string; name: string; courses: HierarchyCourse[] };

// Componente para thumbnail con fallback a signed URL
function VideoThumbnail({
    playbackId,
    title,
    onPlay,
}: {
    playbackId: string | null;
    title: string;
    onPlay: () => void;
}) {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!playbackId) {
            setLoading(false);
            setError(true);
            return;
        }
        // Primero intentamos sin token
        setImgSrc(`https://image.mux.com/${playbackId}/thumbnail.jpg?width=320&height=180&fit_mode=smartcrop`);
        setLoading(true);
        setError(false);
    }, [playbackId]);

    const handleError = useCallback(async () => {
        if (!playbackId) return;
        // Intentar con signed URL
        try {
            const res = await fetch("/api/mux-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playbackId, type: "thumbnail" }),
            });
            if (!res.ok) throw new Error("Token error");
            const data = await res.json();
            if (data.url) {
                setImgSrc(data.url + "&width=320&height=180&fit_mode=smartcrop");
            } else {
                setError(true);
            }
        } catch {
            setError(true);
        }
    }, [playbackId]);

    return (
        <div
            className="relative aspect-video bg-black/40 rounded-lg overflow-hidden group cursor-pointer"
            onClick={onPlay}
        >
            {loading && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
                </div>
            )}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-foreground-muted">
                    <ImageOff className="h-8 w-8 opacity-50" />
                    <span className="text-xs">Sin preview</span>
                </div>
            )}
            {imgSrc && !error && (
                <img
                    src={imgSrc}
                    alt={title}
                    className="w-full h-full object-cover"
                    onLoad={() => setLoading(false)}
                    onError={() => {
                        if (imgSrc.includes("token=")) {
                            setError(true);
                            setLoading(false);
                        } else {
                            handleError();
                        }
                    }}
                />
            )}
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-neon-blue/90 flex items-center justify-center shadow-lg shadow-neon-blue/30">
                    <Play className="h-5 w-5 text-black ml-0.5" fill="currentColor" />
                </div>
            </div>
        </div>
    );
}

// Tarjeta de video compacta
function VideoCard({
    lesson,
    onPlay,
    onProcess,
}: {
    lesson: ProductionLessonRow;
    onPlay: (lesson: ProductionLessonRow) => void;
    onProcess: (lesson: ProductionLessonRow) => Promise<void>;
}) {
    const status = lesson.mux_asset_status ?? "—";
    const isReady = status === "ready";
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleProcessClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (processing) return;
        setProcessing(true);
        try {
            await onProcess(lesson);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-white/5 overflow-hidden hover:border-neon-blue/30 transition-colors group"
        >
            <VideoThumbnail
                playbackId={lesson.mux_playback_id}
                title={lesson.title}
                onPlay={() => onPlay(lesson)}
            />
            <div className="p-2.5">
                <h4 className="font-medium text-xs text-foreground line-clamp-2 mb-1" title={lesson.title}>
                    {lesson.title}
                </h4>
                {lesson.description && (
                    <p className="text-[10px] text-foreground-muted line-clamp-2 mb-1.5" title={lesson.description}>
                        {lesson.description}
                    </p>
                )}
                <div className="flex items-center justify-between gap-2 mt-2">
                    <div className="flex items-center gap-2">
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isReady ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                                }`}
                        >
                            {isReady ? <CheckCircle2 className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
                            {status}
                        </span>

                        {isReady && (
                            <button
                                onClick={handleProcessClick}
                                disabled={processing}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${success
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20"
                                    }`}
                            >
                                {processing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : success ? (
                                    <Download className="h-3 w-3" />
                                ) : (
                                    <Sparkles className="h-3 w-3" />
                                )}
                                {processing ? "Procesando..." : success ? "Descargado" : "Procesar"}
                            </button>
                        )}
                    </div>

                    {lesson.duration_minutes != null && (
                        <span className="text-[10px] text-foreground-muted flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.duration_minutes}m
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export function ProductionPanel() {
    const [lessons, setLessons] = useState<ProductionLessonRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    // Video player modal state
    const [playerOpen, setPlayerOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<ProductionLessonRow | null>(null);

    const fetchLessons = async (withDebug = false) => {
        setLoading(true);
        setError(null);
        if (!withDebug) setDebugInfo(null);
        try {
            const res = await fetch(
                "/api/production-lessons" + (withDebug ? "?debug=1" : "")
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Error al cargar los datos");
            }
            setLessons(data.lessons ?? []);
            if (data.debug) {
                setDebugInfo(data.debug);
                console.log("[production-lessons] DEBUG (en navegador):", data.debug);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
            setLessons([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLessons(true);
    }, []);

    const handlePlayVideo = useCallback((lesson: ProductionLessonRow) => {
        setSelectedVideo(lesson);
        setPlayerOpen(true);
    }, []);

    const handleProcessVideo = useCallback(async (lesson: ProductionLessonRow) => {
        try {
            // 1. Transcribir
            const transcribeRes = await fetch("/api/transcribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId: lesson.id, table: "course_lessons" }),
            });

            if (!transcribeRes.ok) {
                const data = await transcribeRes.json();
                throw new Error(data.error || "Error al transcribir");
            }

            const { transcription } = await transcribeRes.json();
            console.log("Transcription result:", transcription);

            let resumen = "No se pudo generar resumen (sin transcripción).";

            if (transcription && transcription.length > 0) {
                // 2. Generar Resumen IA solo si hay transcripción
                try {
                    const generateRes = await fetch("/api/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            transcription,
                            field: "resumen",
                        }),
                    });

                    if (generateRes.ok) {
                        const data = await generateRes.json();
                        if (data.result) resumen = data.result;
                    } else {
                        console.warn("Generate summary failed, using default.");
                    }
                } catch (e) {
                    console.error("Error generating summary:", e);
                }
            } else {
                console.warn("Transcription is empty, skipping AI summary.");
            }

            // 3. Generar archivo de texto y GUARDAR LOCALMENTE
            const communityName = lesson.course_modules?.courses?.communities?.name || "Sin comunidad";
            const courseTitle = lesson.course_modules?.courses?.title || "Sin curso";
            const moduleTitle = lesson.course_modules?.title || "Sin módulo";

            const fileContent = `METADATOS
----------------------------------------
Título: ${lesson.title}
Descripción: ${lesson.description || "N/A"}
ID: ${lesson.id}
Fecha Creación: ${new Date(lesson.created_at).toLocaleString()}
Duración: ${lesson.duration_minutes} min

CONTEXTO
----------------------------------------
Comunidad: ${communityName}
Curso: ${courseTitle}
Módulo: ${moduleTitle}

RESUMEN IA
----------------------------------------
${resumen}

TRANSCRIPCIÓN COMPLETA
----------------------------------------
${transcription || "(Sin transcripción disponible)"}
`;

            // Call API to save file locally
            const filename = `${lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data.txt`;

            const saveRes = await fetch("/api/save-file", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename, content: fileContent }),
            });

            if (!saveRes.ok) {
                throw new Error("Error al guardar el archivo en el servidor");
            }

            console.log("File saved successfully on server.");

        } catch (err) {
            console.error("Error processing video:", err);
            alert(err instanceof Error ? err.message : "Error al procesar el video");
            throw err; // Re-throw to handle state in VideoCard
        }
    }, []);

    // Jerarquía: comunidad → curso → módulo → lecciones
    const hierarchy = useMemo((): HierarchyCommunity[] => {
        const byCommunity = new Map<string, HierarchyCommunity>();
        for (const l of lessons) {
            const comm = l.course_modules?.courses?.communities;
            const course = l.course_modules?.courses;
            const mod = l.course_modules;
            if (!comm || !course || !mod) continue;
            if (!byCommunity.has(comm.id)) {
                byCommunity.set(comm.id, { id: comm.id, name: comm.name, courses: [] });
            }
            const commNode = byCommunity.get(comm.id)!;
            let courseNode = commNode.courses.find((c) => c.id === course.id);
            if (!courseNode) {
                courseNode = { id: course.id, title: course.title, modules: [] };
                commNode.courses.push(courseNode);
            }
            let modNode = courseNode.modules.find((m) => m.id === mod.id);
            if (!modNode) {
                modNode = { id: mod.id, title: mod.title, lessons: [] };
                courseNode.modules.push(modNode);
            }
            modNode.lessons.push(l);
        }
        return Array.from(byCommunity.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [lessons]);

    const toggleExpanded = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    return (
        <div className="max-w-7xl pb-10">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-4"
            >
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                        <Film className="h-4 w-4 text-neon-blue" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground">
                        Videos ya configurados (Producción)
                    </h1>
                </div>
                <p className="text-sm text-foreground-muted">
                    Selecciona una comunidad para ver sus cursos y módulos disponibles.
                </p>
            </motion.div>

            <Card className="border-neon-blue/20 shadow-lg shadow-neon-blue/5">
                <CardHeader className="border-b border-border/50 pb-2 pt-4 px-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-lg">Catálogo de Comunidades</CardTitle>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fetchLessons(true)}
                                disabled={loading}
                                className="p-1.5 rounded-lg border border-border hover:bg-white/5 text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50"
                                title="Recargar"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                            </button>
                            {debugInfo && (
                                <button
                                    type="button"
                                    onClick={() => setShowDebug((s) => !s)}
                                    className="text-[10px] px-2 py-0.5 rounded border border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                >
                                    {showDebug ? "Ocultar" : "Ver"} debug
                                </button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-4 px-4 pb-6">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-foreground-muted">
                            <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
                            <p className="text-sm">Cargando comunidades...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-error">
                            <AlertCircle className="h-8 w-8" />
                            <p className="text-center max-w-md text-sm">{error}</p>
                            <button
                                type="button"
                                onClick={() => fetchLessons(false)}
                                className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/30 rounded-lg py-1.5 px-3 text-xs font-medium"
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!loading && !error && hierarchy.length === 0 && (
                        <div className="text-center py-8 text-foreground-muted text-sm">
                            No hay contenido disponible por el momento.
                        </div>
                    )}

                    {!loading && !error && hierarchy.length > 0 && (
                        <Tabs defaultValue={hierarchy[0]?.id} className="w-full">
                            <TabsList className="mb-4 w-full flex-wrap h-auto justify-start border-b border-border bg-transparent p-0 rounded-none">
                                {hierarchy.map((comm) => (
                                    <TabsTrigger
                                        key={comm.id}
                                        value={comm.id}
                                        className="rounded-none border-b-2 border-transparent px-3 py-1.5 text-sm data-[state=active]:border-neon-blue data-[state=active]:bg-transparent data-[state=active]:text-neon-blue data-[state=active]:shadow-none"
                                    >
                                        {comm.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {hierarchy.map((comm) => (
                                <TabsContent key={comm.id} value={comm.id} className="mt-0 space-y-2 animate-in fade-in-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FolderOpen className="h-4 w-4 text-neon-blue" />
                                        <h3 className="text-base font-semibold text-foreground">
                                            Cursos en {comm.name}
                                        </h3>
                                        <span className="text-[10px] text-foreground-muted bg-white/5 px-1.5 py-0.5 rounded-full">
                                            {comm.courses.length} curso(s)
                                        </span>
                                    </div>

                                    {comm.courses.length === 0 && (
                                        <div className="text-xs text-foreground-muted italic px-4">
                                            Esta comunidad aún no tiene cursos con videos listos.
                                        </div>
                                    )}

                                    {comm.courses.map((course) => {
                                        const courseKey = `course-${course.id}`;
                                        const isCourseOpen = expanded.has(courseKey);
                                        return (
                                            <div key={course.id} className="rounded-md border border-border bg-background/50 overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpanded(courseKey)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
                                                >
                                                    {isCourseOpen ? (
                                                        <ChevronDown className="h-3.5 w-3.5 text-foreground-muted" />
                                                    ) : (
                                                        <ChevronRight className="h-3.5 w-3.5 text-foreground-muted" />
                                                    )}
                                                    <span className="font-medium text-sm text-foreground">{course.title}</span>
                                                    <span className="text-[10px] text-foreground-muted ml-auto bg-white/5 px-1.5 py-0.5 rounded">
                                                        {course.modules.length} módulo(s)
                                                    </span>
                                                </button>

                                                {isCourseOpen && (
                                                    <div className="border-t border-border bg-black/20">
                                                        {course.modules.length === 0 && (
                                                            <div className="px-8 py-2 text-xs text-foreground-muted italic">
                                                                Sin módulos
                                                            </div>
                                                        )}
                                                        {course.modules.map((mod) => {
                                                            const modKey = `mod-${mod.id}`;
                                                            const isModOpen = expanded.has(modKey);
                                                            return (
                                                                <div key={mod.id} className="border-b border-border/50 last:border-b-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleExpanded(modKey)}
                                                                        className="w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-left hover:bg-white/5 transition-colors"
                                                                    >
                                                                        {isModOpen ? (
                                                                            <ChevronDown className="h-3 w-3 text-foreground-muted" />
                                                                        ) : (
                                                                            <ChevronRight className="h-3 w-3 text-foreground-muted" />
                                                                        )}
                                                                        <Layers className="h-3.5 w-3.5 text-neon-blue opacity-70" />
                                                                        <span className="text-xs text-foreground">{mod.title}</span>
                                                                        <span className="text-[10px] text-foreground-muted ml-auto">
                                                                            {mod.lessons.length} video(s)
                                                                        </span>
                                                                    </button>

                                                                    {isModOpen && (
                                                                        <div className="pl-8 pr-3 pb-3 pt-2">
                                                                            {mod.lessons.length === 0 ? (
                                                                                <p className="text-[10px] text-foreground-muted italic">Sin videos en este módulo.</p>
                                                                            ) : (
                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                                                    {mod.lessons.map((lesson) => (
                                                                                        <VideoCard
                                                                                            key={lesson.id}
                                                                                            lesson={lesson}
                                                                                            onPlay={handlePlayVideo}
                                                                                            onProcess={handleProcessVideo}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </TabsContent>
                            ))}
                        </Tabs>
                    )}

                    {showDebug && debugInfo && (
                        <div className="mt-4 p-3 rounded-lg bg-black/40 border border-amber-500/30 overflow-auto max-h-60">
                            <p className="text-[10px] font-medium text-amber-500 mb-1">Debug API</p>
                            <pre className="text-[10px] text-foreground-muted whitespace-pre-wrap font-mono">
                                {JSON.stringify(debugInfo, null, 2)}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Video Player Modal */}
            <VideoPlayerModal
                isOpen={playerOpen}
                onClose={() => {
                    setPlayerOpen(false);
                    setSelectedVideo(null);
                }}
                playbackId={selectedVideo?.mux_playback_id ?? null}
                title={selectedVideo?.title}
                description={selectedVideo?.description ?? undefined}
            />
        </div>
    );
}
