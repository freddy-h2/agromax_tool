"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download as DownloadIcon, Play, Key, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export default function DownloadPage() {
    const [playbackId, setPlaybackId] = useState("");
    const [muxToken, setMuxToken] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        if (!playbackId.trim() || !muxToken.trim()) {
            return;
        }

        setIsLoading(true);

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsLoading(false);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Optionally clear form
        // setPlaybackId("");
        // setMuxToken("");
    };

    return (
        <div className="max-w-2xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                        <DownloadIcon className="h-5 w-5 text-neon-blue" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Download</h1>
                </div>
                <p className="text-foreground-muted">
                    Descarga videos alojados en MUX ingresando el Playback ID y Token.
                </p>
            </motion.div>

            {/* Download Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass rounded-xl p-8"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleDownload();
                    }}
                    className="space-y-6"
                >
                    {/* Playback ID */}
                    <div>
                        <label
                            htmlFor="playbackId"
                            className="block text-sm font-medium text-foreground-muted mb-2"
                        >
                            Playback ID
                        </label>
                        <div className="relative">
                            <Play className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                            <Input
                                id="playbackId"
                                type="text"
                                placeholder="Ej: a4nOgmxGWg6gULfcBbAa"
                                value={playbackId}
                                onChange={(e) => setPlaybackId(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>
                        <p className="text-xs text-foreground-muted mt-1.5">
                            El ID de reproducción del video en MUX
                        </p>
                    </div>

                    {/* MUX Token */}
                    <div>
                        <label
                            htmlFor="muxToken"
                            className="block text-sm font-medium text-foreground-muted mb-2"
                        >
                            Token MUX
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                            <Input
                                id="muxToken"
                                type="password"
                                placeholder="Tu token de autenticación MUX"
                                value={muxToken}
                                onChange={(e) => setMuxToken(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>
                        <p className="text-xs text-foreground-muted mt-1.5">
                            Token de acceso para la API de MUX
                        </p>
                    </div>

                    {/* Download Button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            variant="neon"
                            className="w-full"
                            disabled={isLoading || !playbackId.trim() || !muxToken.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <DownloadIcon className="h-4 w-4" />
                                    Descargar
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>

            {/* Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 p-4 rounded-lg border border-border bg-background-secondary/50"
            >
                <p className="text-sm text-foreground-muted">
                    <strong className="text-foreground">Nota:</strong> Los videos se
                    descargan directamente desde los servidores de MUX. Asegúrate de tener
                    los permisos necesarios para descargar el contenido.
                </p>
            </motion.div>

            {/* Success Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Descarga Iniciada"
            >
                <div className="text-center py-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mb-4"
                    >
                        <CheckCircle className="h-8 w-8 text-green-500" />
                    </motion.div>
                    <p className="text-foreground mb-2">
                        El video correspondiente al Playback ID:
                    </p>
                    <p className="font-mono text-sm bg-background-secondary px-3 py-2 rounded-lg text-neon-blue mb-4">
                        {playbackId}
                    </p>
                    <p className="text-foreground-muted">
                        ha comenzado a descargarse.
                    </p>
                </div>
                <div className="mt-4">
                    <Button
                        variant="default"
                        className="w-full"
                        onClick={handleCloseModal}
                    >
                        Entendido
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
