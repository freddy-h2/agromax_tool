"use client";

import { useState } from "react";
import { BookOpen, Layers, MonitorPlay, AlertCircle, LayoutGrid, List, Grid3X3, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Community } from "@/lib/data/cursos-hierarchy";
import MuxPlayer from "@mux/mux-player-react";

import { VideoUploadCard } from "@/components/video-upload-card";
import { MuxUploadCard } from "@/components/mux-upload-card";

interface CursosTabsProps {
    data: Community[];
    orphanAssets: any[];
}

type ViewMode = 'grid' | 'list' | 'compact';

export default function CursosTabs({ data: communities, orphanAssets }: CursosTabsProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    return (
        <div className="max-w-6xl animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="h-6 w-6 text-white" />
                    <h1 className="text-2xl font-bold text-white">Catálogo de Cursos</h1>
                </div>
                <p className="text-[#888]">
                    Explora el contenido educativo organizado por comunidades.
                </p>
            </div>

            {/* Top Level Tabs */}
            <Tabs defaultValue="subido" className="w-full">
                <TabsList className="bg-[#0a0a0a] border border-[#333] w-full justify-start mb-6">
                    <TabsTrigger
                        value="subido"
                        className="data-[state=active]:bg-neon-blue data-[state=active]:text-black text-[#888] px-6"
                    >
                        Subido
                    </TabsTrigger>
                    <TabsTrigger
                        value="porsubir"
                        className="data-[state=active]:bg-neon-blue data-[state=active]:text-black text-[#888] px-6"
                    >
                        Por subir ({orphanAssets.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="nuevo"
                        className="data-[state=active]:bg-neon-blue data-[state=active]:text-black text-[#888] px-6 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Subir Video
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Subido (Existing Content) */}
                <TabsContent value="subido" className="animate-in fade-in-50">
                    {communities.length > 0 ? (
                        <Tabs defaultValue={communities[0]?.id} className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Comunidades</h2>
                            </div>
                            <TabsList className="bg-[#0a0a0a] border border-[#333] w-full justify-start overflow-x-auto">
                                {communities.map((community) => (
                                    <TabsTrigger
                                        key={community.id}
                                        value={community.id}
                                        className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-[#888]"
                                    >
                                        {community.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {communities.map((community) => (
                                <TabsContent key={community.id} value={community.id} className="mt-6 animate-in fade-in-50">

                                    {/* Level 2: Courses */}
                                    <div className="space-y-6">
                                        {community.courses.length > 0 ? (
                                            <Tabs defaultValue={community.courses[0]?.id} className="w-full">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Layers className="h-4 w-4 text-green-500" />
                                                    <h3 className="text-md font-medium text-[#ccc]">Cursos en {community.name}</h3>
                                                </div>
                                                <TabsList className="bg-[#111] border border-[#333] justify-start h-auto flex-wrap gap-2 p-2">
                                                    {community.courses.map((course) => (
                                                        <TabsTrigger
                                                            key={course.id}
                                                            value={course.id}
                                                            className="data-[state=active]:bg-[#333] data-[state=active]:text-white text-[#888] border border-transparent data-[state=active]:border-[#555]"
                                                        >
                                                            {course.title}
                                                        </TabsTrigger>
                                                    ))}
                                                </TabsList>

                                                {community.courses.map((course) => (
                                                    <TabsContent key={course.id} value={course.id} className="mt-6 border-l-2 border-[#333] pl-6 ml-2">

                                                        {/* Level 3: Modules */}
                                                        {course.modules.length > 0 ? (
                                                            <Tabs defaultValue={course.modules[0]?.id} className="w-full">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <MonitorPlay className="h-4 w-4 text-blue-500" />
                                                                    <h4 className="text-sm font-medium text-[#888]">Módulos de {course.title}</h4>
                                                                </div>
                                                                <TabsList className="bg-transparent p-0 gap-4 justify-start border-b border-[#333] rounded-none w-full h-auto">
                                                                    {course.modules.map((module) => (
                                                                        <TabsTrigger
                                                                            key={module.id}
                                                                            value={module.id}
                                                                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-500 px-0 py-2"
                                                                        >
                                                                            {module.title}
                                                                        </TabsTrigger>
                                                                    ))}
                                                                </TabsList>

                                                                {course.modules.map((module) => (
                                                                    <TabsContent key={module.id} value={module.id} className="mt-6">
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                            {/* Lessons Display */}
                                                                            {module.lessons.map((lesson: any) => (
                                                                                <Card key={lesson.id} className="bg-[#0a0a0a] border-[#333] overflow-hidden">
                                                                                    <CardHeader className="pb-2">
                                                                                        <CardTitle className="text-white text-base">{lesson.title}</CardTitle>
                                                                                        {lesson.description && (
                                                                                            <CardDescription className="text-[#888] line-clamp-2">
                                                                                                {lesson.description}
                                                                                            </CardDescription>
                                                                                        )}
                                                                                    </CardHeader>
                                                                                    <CardContent className="p-0">
                                                                                        {lesson.mux_playback_id ? (
                                                                                            <div className="aspect-video w-full bg-black relative group">
                                                                                                <MuxPlayer
                                                                                                    streamType="on-demand"
                                                                                                    playbackId={lesson.mux_playback_id}
                                                                                                    tokens={{ playback: lesson.mux_playback_token }}
                                                                                                    metadata={{
                                                                                                        video_title: lesson.title,
                                                                                                        video_id: lesson.id,
                                                                                                        page_type: "course_lesson"
                                                                                                    }}
                                                                                                    className="w-full h-full"
                                                                                                    accentColor="#22c55e"
                                                                                                />
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="aspect-video w-full bg-[#111] flex items-center justify-center text-[#444]">
                                                                                                <div className="flex flex-col items-center">
                                                                                                    <MonitorPlay className="h-8 w-8 mb-2 opacity-50" />
                                                                                                    <span className="text-xs">Sin video asignado</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}

                                                                                        <div className="p-4 border-t border-[#222]">
                                                                                            <div className="p-3 rounded bg-[#111] border border-[#222]">
                                                                                                <p className="text-xs text-[#666] font-mono mb-1">ID: {lesson.id}</p>
                                                                                                <p className="text-xs text-green-400 font-mono">
                                                                                                    {module.title} • {course.title}
                                                                                                </p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </CardContent>
                                                                                </Card>
                                                                            ))}
                                                                            {/* Card de subida de video para este módulo */}
                                                                            <MuxUploadCard
                                                                                communityId={community.id}
                                                                                courseId={course.id}
                                                                                moduleId={module.id}
                                                                            />
                                                                        </div>
                                                                    </TabsContent>
                                                                ))}
                                                            </Tabs>
                                                        ) : (
                                                            <p className="text-[#666] italic">No hay módulos disponibles en este curso.</p>
                                                        )}

                                                    </TabsContent>
                                                ))}
                                            </Tabs>
                                        ) : (
                                            <p className="text-[#666] italic">No hay cursos disponibles en esta comunidad.</p>
                                        )}
                                    </div>

                                </TabsContent>
                            ))}
                        </Tabs>
                    ) : (
                        <div className="p-12 text-center">
                            <p className="text-[#666]">No hay contenido subido todavía.</p>
                        </div>
                    )}
                </TabsContent>

                {/* Tab: Por subir */}
                <TabsContent value="porsubir" className="mt-6 animate-in fade-in-50">

                    {/* View Options Toolbar */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-[#888] text-sm">
                            Mostrando {orphanAssets.length} videos sin asignar
                        </div>
                        <div className="flex bg-[#111] p-1 rounded-lg border border-[#333]">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1 h-8 ${viewMode === 'grid' ? 'bg-[#333] text-white' : 'text-[#666] hover:text-white'}`}
                                title="Vista Cuadrícula"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('compact')}
                                className={`px-3 py-1 h-8 ${viewMode === 'compact' ? 'bg-[#333] text-white' : 'text-[#666] hover:text-white'}`}
                                title="Vista Compacta"
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1 h-8 ${viewMode === 'list' ? 'bg-[#333] text-white' : 'text-[#666] hover:text-white'}`}
                                title="Vista Lista"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* View: GRID (Default) */}
                    {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {orphanAssets.map((asset) => (
                                <OrphanAssetCard key={asset.id} asset={asset} mode="grid" />
                            ))}
                        </div>
                    )}

                    {/* View: COMPACT */}
                    {viewMode === 'compact' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {orphanAssets.map((asset) => (
                                <OrphanAssetCard key={asset.id} asset={asset} mode="compact" />
                            ))}
                        </div>
                    )}

                    {/* View: LIST */}
                    {viewMode === 'list' && (
                        <div className="space-y-3">
                            {orphanAssets.map((asset) => (
                                <OrphanAssetCard key={asset.id} asset={asset} mode="list" />
                            ))}
                        </div>
                    )}

                    {orphanAssets.length === 0 && (
                        <div className="p-12 border border-dashed border-[#333] rounded-xl bg-[#0a0a0a] text-center">
                            <p className="text-[#888] text-lg">
                                No hay videos huérfanos. Todo el contenido de Mux está asignado correctamente.
                            </p>
                        </div>
                    )}
                </TabsContent>

                {/* Tab: Subir Video */}
                <TabsContent value="nuevo" className="mt-6 animate-in fade-in-50">
                    <div className="max-w-3xl mx-auto h-[600px]">
                        <VideoUploadCard />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Sub-component for rendering individual assets to keep main component clean
function OrphanAssetCard({ asset, mode }: { asset: any, mode: ViewMode }) {
    if (mode === 'list') {
        return (
            <Card className="bg-[#0a0a0a] border-[#333] overflow-hidden flex flex-row items-center p-2 gap-4 hover:border-[#555] transition-colors">
                <div className="w-40 aspect-video bg-black flex-shrink-0 relative">
                    {asset.playback_id && asset.status === 'ready' ? (
                        <MuxPlayer
                            streamType="on-demand"
                            playbackId={asset.playback_id}
                            metadata={{ video_title: asset.id }}
                            className="w-full h-full"
                            accentColor="#22c55e"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-[#444] bg-[#111]">
                            <AlertCircle className="h-4 w-4 mr-2" />
                        </div>
                    )}
                </div>
                <div className="flex-grow grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-1">
                        <p className="text-white text-sm font-mono truncate" title={asset.id}>{asset.id}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${asset.status === 'ready' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                                {asset.status}
                            </span>
                        </div>
                    </div>
                    <div className="col-span-1 text-xs text-[#888]">
                        <p>Creado: {new Date(asset.created_at * 1000).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-1 text-xs text-[#888]">
                        <p>Duración: {asset.duration ? Math.round(asset.duration) + 's' : 'N/A'}</p>
                    </div>
                </div>
            </Card>
        );
    }

    // Grid and Compact modes share structure, just different sizes (handled by parent grid layout)
    return (
        <Card className="bg-[#0a0a0a] border-[#333] overflow-hidden hover:border-[#555] transition-colors">
            <CardHeader className={`${mode === 'compact' ? 'p-2' : 'pb-2'}`}>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm font-mono truncate max-w-[150px]" title={asset.id}>
                        {asset.id}
                    </CardTitle>
                    {mode !== 'compact' && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${asset.status === 'ready' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                            {asset.status}
                        </span>
                    )}
                </div>
                {mode !== 'compact' && (
                    <div className="flex items-center gap-2 mt-1">
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                        <CardDescription className="text-amber-500 text-xs">
                            Sin asignar
                        </CardDescription>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-0">
                <div className="aspect-video w-full bg-black relative group">
                    {asset.playback_id && asset.status === 'ready' ? (
                        <MuxPlayer
                            streamType="on-demand"
                            playbackId={asset.playback_id}
                            metadata={{ video_title: asset.id }}
                            className="w-full h-full"
                            accentColor="#22c55e"
                            onError={(err) => { }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-[#444] bg-[#111]">
                            {asset.status === 'errored' ? (
                                <AlertCircle className="h-4 w-4 text-red-900" />
                            ) : (
                                <div className="h-3 w-3 border-2 border-[#333] border-t-transparent rounded-full animate-spin"></div>
                            )}
                            {mode !== 'compact' && <p className="text-[10px] mt-1">{asset.status}</p>}
                        </div>
                    )}
                </div>
                {mode !== 'compact' && (
                    <div className="p-4 border-t border-[#222]">
                        <div className="flex justify-between text-xs text-[#666]">
                            <span>{asset.duration ? Math.round(asset.duration) + 's' : 'N/A'}</span>
                            <span>{new Date(asset.created_at * 1000).toLocaleDateString()}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
