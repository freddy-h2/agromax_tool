"use client";

import { useState, useEffect } from "react";
import { Images, Film, HardDrive, Calendar, RefreshCw, Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface VideoFile {
    id: string;
    fileName: string;
    assetId: string;
    size: number;
    sizeFormatted: string;
    downloadedAt: string;
    downloadedAtFormatted: string;
}

interface GalleryData {
    files: VideoFile[];
    total: number;
    totalSize: string;
}

export default function GalleryPage() {
    const [data, setData] = useState<GalleryData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
    const [playingVideo, setPlayingVideo] = useState<VideoFile | null>(null);

    const fetchVideos = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/gallery");
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error("Error fetching videos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Images className="h-5 w-5 text-white" />
                        <h1 className="text-2xl font-bold text-white">Galería</h1>
                    </div>
                    <p className="text-[#888]">
                        Videos descargados de MUX almacenados localmente
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchVideos}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Actualizar
                </Button>
            </div>

            {/* Stats Cards */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5">
                                <Film className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{data.total}</p>
                                <p className="text-xs text-[#888]">Videos descargados</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5">
                                <HardDrive className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{data.totalSize || "0 Bytes"}</p>
                                <p className="text-xs text-[#888]">Espacio utilizado</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5">
                                <Download className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">/downloads</p>
                                <p className="text-xs text-[#888]">Carpeta de almacenamiento</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 text-[#888] animate-spin mx-auto mb-3" />
                        <p className="text-[#888]">Cargando videos...</p>
                    </div>
                </div>
            ) : data?.files.length === 0 ? (
                <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-[#333] bg-black mb-4">
                        <Film className="h-8 w-8 text-[#555]" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No hay videos</h3>
                    <p className="text-[#888] max-w-md mx-auto">
                        Aún no has descargado ningún video. Ve a la sección de Download para comenzar.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data?.files.map((video) => (
                        <div
                            key={video.id}
                            className="rounded-xl border border-[#333] bg-[#0a0a0a] overflow-hidden hover:border-[#555] transition-colors cursor-pointer"
                            onClick={() => setSelectedVideo(selectedVideo?.id === video.id ? null : video)}
                        >
                            {/* Thumbnail placeholder */}
                            <div
                                className="aspect-video bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center relative hover:opacity-90 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPlayingVideo(video);
                                }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                                        <Play className="h-8 w-8 text-white ml-1" />
                                    </div>
                                </div>
                                {/* Asset ID Badge */}
                                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 text-xs text-[#888] font-mono">
                                    {video.assetId.slice(0, 12)}...
                                </div>
                                {/* Size Badge */}
                                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-xs text-white">
                                    {video.sizeFormatted}
                                </div>
                            </div>

                            {/* Video Info */}
                            <div className="p-4">
                                <p className="text-sm font-medium text-white truncate mb-2" title={video.fileName}>
                                    {video.fileName}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-[#888]">
                                    <Calendar className="h-3 w-3" />
                                    <span>{video.downloadedAtFormatted}</span>
                                </div>
                            </div>

                            {/* Expanded details */}
                            {selectedVideo?.id === video.id && (
                                <div className="px-4 pb-4 pt-0 border-t border-[#333] mt-2">
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-[#888]">Asset ID:</span>
                                            <span className="text-white font-mono">{video.assetId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#888]">Tamaño exacto:</span>
                                            <span className="text-white">{video.size.toLocaleString()} bytes</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#888]">Archivo:</span>
                                            <span className="text-white truncate max-w-[200px]" title={video.fileName}>
                                                {video.fileName}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Video Player Modal */}
            <Modal
                isOpen={!!playingVideo}
                onClose={() => setPlayingVideo(null)}
                title={playingVideo?.fileName}
                className="max-w-4xl"
            >
                {playingVideo && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                        <video
                            src={`/downloads/${playingVideo.fileName}`}
                            className="h-full w-full"
                            controls
                            autoPlay
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}
            </Modal>
        </div>
    );
}
