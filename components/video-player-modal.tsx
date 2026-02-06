"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import MuxPlayer from "@mux/mux-player-react";
import { Button } from "./ui/button";

interface VideoPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    playbackId: string | null;
    title?: string;
    description?: string;
}

export function VideoPlayerModal({
    isOpen,
    onClose,
    playbackId,
    title,
    description,
}: VideoPlayerModalProps) {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const fetchToken = useCallback(async (pbId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/mux-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playbackId: pbId, type: "video" }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Error al obtener token");
            }
            setToken(data.token);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch token immediately when modal opens (production videos require signed URLs)
    useEffect(() => {
        if (isOpen && playbackId) {
            // Immediately fetch token for signed playback
            setError(null);
            fetchToken(playbackId);
        } else {
            setToken(null);
            setError(null);
        }
    }, [isOpen, playbackId, fetchToken]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    // Handle MuxPlayer error (retry fetching token)
    const handlePlayerError = useCallback(() => {
        if (playbackId && !token) {
            // Retry fetching token
            fetchToken(playbackId);
        }
    }, [playbackId, token, fetchToken]);

    if (!playbackId) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background-secondary shadow-xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-4 border-b border-border">
                            <div className="min-w-0 pr-4">
                                {title && (
                                    <h2 className="text-lg font-semibold text-foreground truncate">
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p className="text-sm text-foreground-muted mt-1 line-clamp-2">
                                        {description}
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="shrink-0 hover:bg-sidebar-hover"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Video Player */}
                        <div className="relative aspect-video bg-black">
                            {loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-foreground-muted z-10">
                                    <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
                                    <p className="text-sm">Obteniendo acceso al video...</p>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-400 z-10 p-6">
                                    <AlertCircle className="h-8 w-8" />
                                    <p className="text-sm text-center">{error}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => playbackId && fetchToken(playbackId)}
                                    >
                                        Reintentar
                                    </Button>
                                </div>
                            )}

                            {!loading && !error && token && (
                                <MuxPlayer
                                    playbackId={playbackId}
                                    tokens={{ playback: token }}
                                    streamType="on-demand"
                                    autoPlay
                                    accentColor="#22dd60"
                                    className="w-full h-full"
                                    onError={handlePlayerError}
                                />
                            )}
                        </div>

                        {/* Footer info */}
                        <div className="p-3 bg-background/50 border-t border-border">
                            <p className="text-xs text-foreground-muted">
                                Playback ID:{" "}
                                <code className="bg-white/5 px-1.5 py-0.5 rounded">
                                    {playbackId}
                                </code>
                                {token && (
                                    <span className="ml-2 text-amber-500">(signed)</span>
                                )}
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
