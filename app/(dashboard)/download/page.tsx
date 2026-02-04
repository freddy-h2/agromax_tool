"use client";

import { useState, useRef } from "react";
import { Download as DownloadIcon, Film, Loader2, CheckCircle, XCircle, FolderOpen, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface LogEntry {
    type: "info" | "success" | "error" | "warning";
    message: string;
    timestamp: string;
}

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
    const [assetId, setAssetId] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [showConsole, setShowConsole] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleDownload = async () => {
        if (!assetId.trim()) {
            return;
        }

        // Mostrar la consola con animación
        setShowConsole(true);
        setIsLoading(true);
        setDownloadResult(null);
        setLogs([]);

        try {
            const response = await fetch("/api/download", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    assetId: assetId.trim(),
                }),
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error("No se pudo leer la respuesta");
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split("\n\n").filter(line => line.startsWith("data: "));

                for (const line of lines) {
                    const jsonStr = line.replace("data: ", "");
                    try {
                        const data = JSON.parse(jsonStr);

                        if (data.type === "result") {
                            setDownloadResult(data);
                            setIsModalOpen(true);
                        } else {
                            setLogs(prev => [...prev, {
                                type: data.type,
                                message: data.message,
                                timestamp: data.timestamp,
                            }]);
                            setTimeout(scrollToBottom, 100);
                        }
                    } catch {
                        // Ignorar líneas que no son JSON válido
                    }
                }
            }
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

    const getLogColor = (type: string) => {
        switch (type) {
            case "success": return "text-green-400";
            case "error": return "text-red-400";
            case "warning": return "text-yellow-400";
            default: return "text-[#888]";
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <DownloadIcon className="h-5 w-5 text-white" />
                    <h1 className="text-2xl font-bold text-white">Download</h1>
                </div>
                <p className="text-[#888]">
                    Descarga videos de MUX usando el Asset ID. Los archivos master se guardan en <code>/downloads</code>
                </p>
            </div>

            {/* Main content - Animated layout */}
            <div className="flex gap-6 justify-center">
                {/* Left column - Download Form */}
                <div
                    className={`transition-all duration-500 ease-in-out ${showConsole
                            ? "w-1/2 translate-x-0"
                            : "w-full max-w-lg"
                        }`}
                >
                    <div className="space-y-6">
                        <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-8">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleDownload();
                                }}
                                className="space-y-6"
                            >
                                {/* Asset ID */}
                                <div>
                                    <label
                                        htmlFor="assetId"
                                        className="block text-sm font-medium text-[#888] mb-2"
                                    >
                                        Asset ID
                                    </label>
                                    <div className="relative">
                                        <Film className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                                        <Input
                                            id="assetId"
                                            type="text"
                                            placeholder="Ej: BNqaqyl4edPLEmyegCNfze2BgwQgjijYIYqeaidHDq00"
                                            value={assetId}
                                            onChange={(e) => setAssetId(e.target.value)}
                                            className="pl-10"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <p className="text-xs text-[#666] mt-1.5">
                                        El identificador único del asset en MUX
                                    </p>
                                </div>

                                {/* Download Button */}
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading || !assetId.trim()}
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
                            </form>
                        </div>

                        {/* Info Card */}
                        <div className="p-4 rounded-lg border border-[#333] bg-[#0a0a0a]">
                            <div className="flex items-start gap-3">
                                <FolderOpen className="h-5 w-5 text-white mt-0.5" />
                                <div>
                                    <p className="text-sm text-white font-medium">
                                        Ubicación de descargas
                                    </p>
                                    <p className="text-xs text-[#888] mt-1">
                                        <code>agromax_tool/downloads/</code>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column - Log Panel (appears when downloading) */}
                <div
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${showConsole
                            ? "w-1/2 opacity-100"
                            : "w-0 opacity-0"
                        }`}
                >
                    <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-4 h-[400px] flex flex-col">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#333]">
                            <Terminal className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium text-white">Consola de proceso</span>
                            {isLoading && (
                                <span className="ml-auto flex items-center gap-1 text-xs text-yellow-500">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                    En progreso
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1">
                            {logs.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[#555]">
                                    <p>Esperando inicio de descarga...</p>
                                </div>
                            ) : (
                                logs.map((log, index) => (
                                    <div key={index} className="flex gap-2">
                                        <span className="text-[#555] shrink-0">[{formatTime(log.timestamp)}]</span>
                                        <span className={getLogColor(log.type)}>{log.message}</span>
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
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
                                    <span className="text-white font-mono text-xs break-all">{downloadResult.fileName}</span>
                                </p>
                                {downloadResult.size && (
                                    <p className="text-sm">
                                        <span className="text-[#888]">Tamaño:</span>{" "}
                                        <span className="text-white">{formatBytes(downloadResult.size)}</span>
                                    </p>
                                )}
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
