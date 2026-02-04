"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Sparkles, Video as VideoIcon, Download } from "lucide-react";
import MuxPlayer from "@mux/mux-player-react";
import { DownloadButton } from "@/components/download-button";

interface DashboardClientProps {
    userEmail: string;
}

interface Video {
    id: string;
    title: string;
    description: string;
    resumen: string;
    live_date: string;
    duration_minutes: number;
    mux_playback_id: string;
    mux_asset_id?: string; // Added field
    created_at?: string;
}

interface DashboardClientProps {
    userEmail: string;
    videos: Video[];
}

export default function DashboardClient({ userEmail, videos }: DashboardClientProps) {
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

    return (
        <div className="max-w-6xl pb-20">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                        <Home className="h-5 w-5 text-neon-blue" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Galería de Videos</h1>
                </div>
                <p className="text-foreground-muted">
                    Explora y gestiona tu biblioteca de contenido.
                </p>
            </motion.div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video, index) => (
                    <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="glass rounded-xl overflow-hidden group hover:border-neon-blue/50 transition-colors"
                    >
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-black/50 overflow-hidden cursor-pointer" onClick={() => video.mux_playback_id && setSelectedVideo(video)}>
                            {/* Standard Mux Thumbnail URL or Placeholder */}
                            {video.mux_playback_id ? (
                                <img
                                    src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=640&height=360&fit_mode=smart`}
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-background-secondary to-background p-4 text-center">
                                    <div className="p-3 rounded-full bg-white/5 mb-2">
                                        <VideoIcon className="h-8 w-8 text-foreground-muted" />
                                    </div>
                                    <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
                                        Solo Descarga
                                    </span>
                                </div>
                            )}

                            {/* Play Overlay - Only if playable */}
                            {video.mux_playback_id && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                                    <div className="p-3 rounded-full bg-neon-blue text-black transform scale-90 group-hover:scale-100 transition-transform">
                                        <Sparkles className="h-6 w-6 fill-current" />
                                    </div>
                                </div>
                            )}

                            {/* Duration Badge */}
                            {video.duration_minutes > 0 && (
                                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-xs font-medium text-white">
                                    {video.duration_minutes} min
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-1" title={video.title}>
                                {video.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-foreground-muted mb-3">
                                <span>{new Date(video.live_date || video.created_at || Date.now()).toLocaleDateString()}</span>
                                {video.resumen && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <span className="line-clamp-1">{video.resumen}</span>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                                {video.mux_playback_id ? (
                                    <button
                                        onClick={() => setSelectedVideo(video)}
                                        className="flex-1 text-sm font-medium text-neon-blue hover:text-neon-blue/80 transition-colors"
                                    >
                                        Ver Video
                                    </button>
                                ) : (
                                    <span className="flex-1 text-sm font-medium text-foreground-muted">
                                        --
                                    </span>
                                )}
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DownloadButton videoId={video.id} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {videos.length === 0 && (
                <div className="glass rounded-xl p-12 text-center">
                    <p className="text-foreground-muted">No hay videos disponibles aún.</p>
                </div>
            )}

            {/* Video Player Modal/Dialog implementation would go here. 
                For now, we'll placeholder it or use a simple fixed overlay if desired, 
                but to keep it clean I will skip the complex modal code in this step unless requested.
                Wait, user request is specific: "Reproducción: Al hacer clic... usa MuxPlayer".
                I MUST implement the player.
            */}
            {selectedVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setSelectedVideo(null)}>
                    <div className="bg-background border border-border rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="relative aspect-video bg-black">
                            <MuxPlayer
                                playbackId={selectedVideo.mux_playback_id}
                                metadata={{
                                    video_id: selectedVideo.id,
                                    video_title: selectedVideo.title,
                                }}
                                streamType="on-demand"
                                accentColor="#22dd60"
                            />
                        </div>
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground mb-2">{selectedVideo.title}</h2>
                                    <p className="text-foreground-muted">{selectedVideo.description || selectedVideo.resumen}</p>
                                </div>
                                <button className="p-2 hover:bg-white/10 rounded-full transition-colors" onClick={() => setSelectedVideo(null)}>
                                    <span className="sr-only">Cerrar</span>
                                    <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
