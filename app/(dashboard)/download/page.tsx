"use client";

import { useState } from "react";
import { Download as DownloadIcon, Play, Key, Loader2, CheckCircle, XCircle, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface DownloadResult {
    success: boolean;
    message?: string;
    fileName?: string;
    filePath?: string;
    size?: number;
    error?: string;
    details?: string;
}

export default function DownloadPage() {
    const [playbackId, setPlaybackId] = useState("");
    const [muxToken, setMuxToken] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);

    const handleDownload = async () => {
        if (!playbackId.trim() || !muxToken.trim()) {
            return;
        }

        setIsLoading(true);
        setDownloadResult(null);

        try {
            const response = await fetch("/api/download", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    playbackId: playbackId.trim(),
                    muxToken: muxToken.trim(),
                }),
            });

            const result = await response.json();
            setDownloadResult(result);
            setIsModalOpen(true);
        } catch (error) {
            setDownloadResult({
                success: false,
                error: "Error de conexión",
                details: error instanceof Error ? error.message : "No se pudo conectar con el servidor",
            });
            setIsModalOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="max-w-2xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <DownloadIcon className="h-5 w-5 text-white" />
                    <h1 className="text-2xl font-bold text-white">Download</h1>
                </div>
                <p className="text-[#888]">
                    Descarga videos alojados en MUX. Los archivos se guardan en la carpeta <code>/downloads</code> del proyecto.
                </p>
            </div>

            {/* Download Form */}
            <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-8">
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
                            className="block text-sm font-medium text-[#888] mb-2"
                        >
                            Playback ID
                        </label>
                        <div className="relative">
                            <Play className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
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
                        <p className="text-xs text-[#666] mt-1.5">
                            El ID de reproducción del video en MUX
                        </p>
                    </div>

                    {/* MUX Token */}
                    <div>
                        <label
                            htmlFor="muxToken"
                            className="block text-sm font-medium text-[#888] mb-2"
                        >
                            Token MUX
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
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
                        <p className="text-xs text-[#666] mt-1.5">
                            Token de acceso para la API de MUX
                        </p>
                    </div>

                    {/* Download Button */}
                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading || !playbackId.trim() || !muxToken.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Descargando...
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
            </div>

            {/* Info Card */}
            <div className="mt-6 p-4 rounded-lg border border-[#333] bg-[#0a0a0a]">
                <div className="flex items-start gap-3">
                    <FolderOpen className="h-5 w-5 text-white mt-0.5" />
                    <div>
                        <p className="text-sm text-white font-medium">
                            Ubicación de descargas
                        </p>
                        <p className="text-xs text-[#888] mt-1">
                            Los videos se guardan en: <code>agromax_tool/downloads/</code>
                        </p>
                    </div>
                </div>
            </div>

            {/* Result Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={downloadResult?.success ? "Descarga Exitosa" : "Error en Descarga"}
            >
                <div className="text-center py-4">
                    {downloadResult?.success ? (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <p className="text-white mb-2">Video descargado exitosamente</p>
                            <div className="space-y-2 text-left bg-black rounded-lg p-4 mt-4 border border-[#333]">
                                <p className="text-sm">
                                    <span className="text-[#888]">Archivo:</span>{" "}
                                    <span className="text-white font-mono text-xs">{downloadResult.fileName}</span>
                                </p>
                                {downloadResult.size && (
                                    <p className="text-sm">
                                        <span className="text-[#888]">Tamaño:</span>{" "}
                                        <span className="text-white">{formatBytes(downloadResult.size)}</span>
                                    </p>
                                )}
                                <p className="text-sm">
                                    <span className="text-[#888]">Ubicación:</span>{" "}
                                    <span className="text-[#888] text-xs">/downloads/</span>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
                                <XCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <p className="text-white mb-2">{downloadResult?.error || "Error desconocido"}</p>
                            {downloadResult?.details && (
                                <p className="text-sm text-[#888] bg-black rounded-lg p-3 mt-2 border border-[#333]">
                                    {downloadResult.details}
                                </p>
                            )}
                        </>
                    )}
                </div>
                <div className="mt-4">
                    <Button
                        variant="outline"
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
