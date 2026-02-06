"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Film,
    Loader2,
    AlertCircle,
    RefreshCw,
    Search,
    CheckCircle2,
    Clock,
    Layers,
    ChevronDown,
    ChevronRight,
    FolderOpen,
    Folder,
    Play,
    ImageOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { MuxUploadCard } from "@/components/mux-upload-card";
import type { ProductionLessonRow } from "@/app/api/production-lessons/route";

type CommunityOption = { id: string; name: string };
type CourseOption = { id: string; title: string; community_id: string };
type ModuleOption = { id: string; title: string; course_id: string };

// Jerarquía para la pestaña "Por jerarquía"
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
}: {
    lesson: ProductionLessonRow;
    onPlay: (lesson: ProductionLessonRow) => void;
}) {
    const status = lesson.mux_asset_status ?? "—";
    const isReady = status === "ready";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-white/5 overflow-hidden hover:border-neon-blue/30 transition-colors"
        >
            <VideoThumbnail
                playbackId={lesson.mux_playback_id}
                title={lesson.title}
                onPlay={() => onPlay(lesson)}
            />
            <div className="p-3">
                <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1" title={lesson.title}>
                    {lesson.title}
                </h4>
                {lesson.description && (
                    <p className="text-xs text-foreground-muted line-clamp-2 mb-2" title={lesson.description}>
                        {lesson.description}
                    </p>
                )}
                <div className="flex items-center justify-between gap-2">
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isReady ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                            }`}
                    >
                        {isReady ? <CheckCircle2 className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
                        {status}
                    </span>
                    {lesson.duration_minutes != null && (
                        <span className="text-xs text-foreground-muted flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.duration_minutes} min
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export function ProductionCoursesClient() {
    const [lessons, setLessons] = useState<ProductionLessonRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
    const [showDebug, setShowDebug] = useState(false);
    const [tab, setTab] = useState("lista");
    const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");
    const [selectedModuleId, setSelectedModuleId] = useState<string>("");
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

    // Opciones para selectores (únicas, ordenadas)
    const { communities, courses, modules } = useMemo(() => {
        const commMap = new Map<string, CommunityOption>();
        const courseMap = new Map<string, CourseOption>();
        const modMap = new Map<string, ModuleOption>();
        for (const l of lessons) {
            const comm = l.course_modules?.courses?.communities;
            const course = l.course_modules?.courses;
            const mod = l.course_modules;
            if (comm) commMap.set(comm.id, { id: comm.id, name: comm.name });
            if (course) courseMap.set(course.id, { id: course.id, title: course.title, community_id: course.community_id });
            if (mod) modMap.set(mod.id, { id: mod.id, title: mod.title, course_id: mod.course_id });
        }
        return {
            communities: Array.from(commMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
            courses: Array.from(courseMap.values()).sort((a, b) => a.title.localeCompare(b.title)),
            modules: Array.from(modMap.values()).sort((a, b) => a.title.localeCompare(b.title)),
        };
    }, [lessons]);

    // Cursos filtrados por comunidad seleccionada
    const coursesByCommunity = useMemo(() => {
        if (!selectedCommunityId) return courses;
        return courses.filter((c) => c.community_id === selectedCommunityId);
    }, [courses, selectedCommunityId]);

    // Módulos filtrados por curso seleccionado
    const modulesByCourse = useMemo(() => {
        if (!selectedCourseId) return modules;
        return modules.filter((m) => m.course_id === selectedCourseId);
    }, [modules, selectedCourseId]);

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

    // Lecciones filtradas por selectores + búsqueda
    const filteredLessons = useMemo(() => {
        return lessons.filter((lesson) => {
            const commId = lesson.course_modules?.courses?.community_id;
            const courseId = lesson.course_modules?.course_id;
            const modId = lesson.module_id;
            if (selectedCommunityId && commId !== selectedCommunityId) return false;
            if (selectedCourseId && courseId !== selectedCourseId) return false;
            if (selectedModuleId && modId !== selectedModuleId) return false;
            const q = searchQuery.toLowerCase();
            if (!q) return true;
            const community = lesson.course_modules?.courses?.communities?.name ?? "";
            const course = lesson.course_modules?.courses?.title ?? "";
            const moduleTitle = lesson.course_modules?.title ?? "";
            const title = lesson.title ?? "";
            return (
                community.toLowerCase().includes(q) ||
                course.toLowerCase().includes(q) ||
                moduleTitle.toLowerCase().includes(q) ||
                title.toLowerCase().includes(q)
            );
        });
    }, [lessons, selectedCommunityId, selectedCourseId, selectedModuleId, searchQuery]);

    const toggleExpanded = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    return (
        <div className="max-w-7xl pb-20">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                        <Film className="h-5 w-5 text-neon-blue" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Videos ya configurados (Producción)
                    </h1>
                </div>
                <p className="text-foreground-muted">
                    Navega por comunidad, curso y módulo para ver las lecciones en video con Mux
                    listo. Haz clic en un video para reproducirlo.
                </p>
            </motion.div>

            <Card className="border-neon-blue/20 shadow-lg shadow-neon-blue/5">
                <CardHeader className="border-b border-border/50 pb-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <CardTitle>Lecciones con video listo</CardTitle>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => fetchLessons(true)}
                                    disabled={loading}
                                    className="p-2 rounded-lg border border-border hover:bg-white/5 text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50"
                                    title="Recargar"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                                </button>
                                {debugInfo && (
                                    <button
                                        type="button"
                                        onClick={() => setShowDebug((s) => !s)}
                                        className="text-xs px-2 py-1 rounded border border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                    >
                                        {showDebug ? "Ocultar" : "Ver"} debug
                                    </button>
                                )}
                            </div>
                        </div>

                        <Tabs value={tab} onValueChange={setTab}>
                            <TabsList className="flex gap-1">
                                <TabsTrigger value="lista">Galería con filtros</TabsTrigger>
                                <TabsTrigger value="jerarquia">Por jerarquía</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>

                <CardContent className="pt-6">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4 text-foreground-muted">
                            <Loader2 className="h-10 w-10 animate-spin text-neon-blue" />
                            <p>Cargando lecciones desde producción...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4 text-error">
                            <AlertCircle className="h-10 w-10" />
                            <p className="text-center max-w-md">{error}</p>
                            <button
                                type="button"
                                onClick={() => fetchLessons(false)}
                                className="bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/30 rounded-lg py-2 px-4 text-sm font-medium"
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!loading && !error && (
                        <Tabs value={tab} onValueChange={() => { }}>
                            {/* Galería: selectores + grid de tarjetas */}
                            <TabsContent value="lista" className="mt-0">
                                <CardDescription className="mb-3">
                                    Filtra por comunidad, curso y módulo. Haz clic en un video para reproducirlo.
                                </CardDescription>
                                <div className="flex flex-wrap items-end gap-3 mb-6">
                                    <div className="flex flex-col gap-1 min-w-[160px]">
                                        <label className="text-xs font-medium text-foreground-muted">
                                            Comunidad
                                        </label>
                                        <select
                                            value={selectedCommunityId}
                                            onChange={(e) => {
                                                setSelectedCommunityId(e.target.value);
                                                setSelectedCourseId("");
                                                setSelectedModuleId("");
                                            }}
                                            className="h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue/30"
                                        >
                                            <option value="">Todas</option>
                                            {communities.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-[200px]">
                                        <label className="text-xs font-medium text-foreground-muted">
                                            Curso
                                        </label>
                                        <select
                                            value={selectedCourseId}
                                            onChange={(e) => {
                                                setSelectedCourseId(e.target.value);
                                                setSelectedModuleId("");
                                            }}
                                            className="h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue/30"
                                        >
                                            <option value="">Todos</option>
                                            {coursesByCommunity.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-[200px]">
                                        <label className="text-xs font-medium text-foreground-muted">
                                            Módulo
                                        </label>
                                        <select
                                            value={selectedModuleId}
                                            onChange={(e) => setSelectedModuleId(e.target.value)}
                                            className="h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-neon-blue/30"
                                        >
                                            <option value="">Todos</option>
                                            {modulesByCourse.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1 min-w-[200px] max-w-xs">
                                        <label className="text-xs font-medium text-foreground-muted">
                                            Buscar
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                                            <Input
                                                placeholder="Lección, curso, módulo..."
                                                className="pl-9 h-9"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Grid de tarjetas de video */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredLessons.map((lesson) => (
                                        <VideoCard
                                            key={lesson.id}
                                            lesson={lesson}
                                            onPlay={handlePlayVideo}
                                        />
                                    ))}
                                </div>

                                {filteredLessons.length === 0 && (
                                    <div className="text-center py-12 text-foreground-muted">
                                        {lessons.length === 0
                                            ? "No hay lecciones de video con Mux configurado en producción."
                                            : "Ningún resultado con los filtros seleccionados."}
                                    </div>
                                )}

                                {filteredLessons.length > 0 && (
                                    <p className="text-xs text-foreground-muted mt-6">
                                        Total: {filteredLessons.length} video(s)
                                    </p>
                                )}
                            </TabsContent>

                            {/* Por jerarquía: árbol comunidad → curso → módulo → videos */}
                            <TabsContent value="jerarquia" className="mt-0">
                                <CardDescription className="mb-4">
                                    Expande cada nivel para ver cursos, módulos y videos. Haz clic en un video para reproducirlo.
                                </CardDescription>
                                <div className="space-y-2">
                                    {hierarchy.length === 0 && (
                                        <div className="text-center py-12 text-foreground-muted">
                                            No hay datos con comunidad/curso/módulo. Revisa que uses la service role key.
                                        </div>
                                    )}
                                    {hierarchy.map((comm) => {
                                        const commKey = `comm-${comm.id}`;
                                        const isCommOpen = expanded.has(commKey);
                                        return (
                                            <div key={comm.id} className="rounded-lg border border-border overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpanded(commKey)}
                                                    className="w-full flex items-center gap-2 px-4 py-3 text-left bg-white/5 hover:bg-white/10 transition-colors"
                                                >
                                                    {isCommOpen ? (
                                                        <ChevronDown className="h-4 w-4 text-foreground-muted" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-foreground-muted" />
                                                    )}
                                                    {isCommOpen ? (
                                                        <FolderOpen className="h-4 w-4 text-neon-blue" />
                                                    ) : (
                                                        <Folder className="h-4 w-4 text-foreground-muted" />
                                                    )}
                                                    <span className="font-medium text-foreground">{comm.name}</span>
                                                    <span className="text-xs text-foreground-muted">
                                                        {comm.courses.length} curso(s)
                                                    </span>
                                                </button>
                                                {isCommOpen && (
                                                    <div className="border-t border-border bg-background/50">
                                                        {comm.courses.map((course) => {
                                                            const courseKey = `course-${course.id}`;
                                                            const isCourseOpen = expanded.has(courseKey);
                                                            return (
                                                                <div key={course.id} className="border-b border-border/50 last:border-b-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleExpanded(courseKey)}
                                                                        className="w-full flex items-center gap-2 pl-8 pr-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                                                                    >
                                                                        {isCourseOpen ? (
                                                                            <ChevronDown className="h-3.5 w-3.5 text-foreground-muted" />
                                                                        ) : (
                                                                            <ChevronRight className="h-3.5 w-3.5 text-foreground-muted" />
                                                                        )}
                                                                        <span className="text-sm font-medium text-foreground">{course.title}</span>
                                                                        <span className="text-xs text-foreground-muted">
                                                                            {course.modules.length} módulo(s)
                                                                        </span>
                                                                    </button>
                                                                    {isCourseOpen && (
                                                                        <div className="bg-background/30">
                                                                            {course.modules.map((mod) => {
                                                                                const modKey = `mod-${mod.id}`;
                                                                                const isModOpen = expanded.has(modKey);
                                                                                return (
                                                                                    <div key={mod.id} className="border-t border-border/30">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => toggleExpanded(modKey)}
                                                                                            className="w-full flex items-center gap-2 pl-14 pr-4 py-2 text-left hover:bg-white/5 transition-colors"
                                                                                        >
                                                                                            {isModOpen ? (
                                                                                                <ChevronDown className="h-3 w-3 text-foreground-muted" />
                                                                                            ) : (
                                                                                                <ChevronRight className="h-3 w-3 text-foreground-muted" />
                                                                                            )}
                                                                                            <Film className="h-3 w-3 text-neon-blue" />
                                                                                            <span className="text-sm text-foreground">{mod.title}</span>
                                                                                            <span className="text-xs text-foreground-muted">
                                                                                                {mod.lessons.length} video(s)
                                                                                            </span>
                                                                                        </button>
                                                                                        {isModOpen && (
                                                                                            <div className="pl-16 pr-4 pb-4 pt-2">
                                                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                                                    {mod.lessons.map((lesson) => (
                                                                                                        <VideoCard
                                                                                                            key={lesson.id}
                                                                                                            lesson={lesson}
                                                                                                            onPlay={handlePlayVideo}
                                                                                                        />
                                                                                                    ))}
                                                                                                    {/* Card de subida para este módulo */}
                                                                                                    <MuxUploadCard
                                                                                                        communityId={comm.id}
                                                                                                        courseId={course.id}
                                                                                                        moduleId={mod.id}
                                                                                                    />
                                                                                                </div>
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
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}

                    {showDebug && debugInfo && (
                        <div className="mt-6 p-4 rounded-lg bg-black/40 border border-amber-500/30 overflow-auto max-h-80">
                            <p className="text-xs font-medium text-amber-500 mb-2">Debug API (pasos 1–8)</p>
                            <pre className="text-xs text-foreground-muted whitespace-pre-wrap font-mono">
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
