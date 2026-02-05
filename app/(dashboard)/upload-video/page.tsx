"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileVideo, CheckCircle2, ChevronRight, Terminal, Loader2, AlertCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import * as UpChunk from "@mux/upchunk";
import { getMuxUploadUrl } from "./actions";

interface LogEntry {
    time: string;
    message: string;
    type: "info" | "success" | "error";
}

export default function UploadVideoPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [progressStep, setProgressStep] = useState(0);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Track the Mux Upload instance for cancellation
    const muxUploadRef = useRef<any>(null); // Type is UpChunk associated

    const steps = [
        "Subir a Mux (Direct Upload)",
        "Procesamiento (Cloud)",
        "Transcripción (Whisper)",
        "Generación IA",
        "Finalizado"
    ];

    const addLog = (message: string, type: "info" | "success" | "error" = "info") => {
        setLogs(prev => [...prev, {
            time: new Date().toLocaleTimeString(),
            message,
            type
        }]);
        setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            // Reset state for new upload
            setUploadProgress(0);
            setLogs([]);
            setProgressStep(0);
            setIsUploading(false);
            setIsProcessing(false);
            muxUploadRef.current = null;
            if (abortControllerRef.current) {
                abortControllerRef.current = null;
            }
        }
    };

    const handleCancel = () => {
        if (muxUploadRef.current) {
            muxUploadRef.current.abort();
            muxUploadRef.current = null;
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setIsUploading(false);
        setIsProcessing(false);
        setUploadProgress(0);
        addLog("Operación cancelada por el usuario.", "error");
    };

    // Note: 'resetForm' removed as requested, using file input to reset.

    const startProcessingWorkflow = async (uploadId: string, filename: string) => {
        if (isProcessing) return; // Prevent double trigger
        setIsProcessing(true);
        addLog("Subida completada. Iniciando procesamiento en servidor...", "success");
        setProgressStep(1);

        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch("/api/trigger-workflow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uploadId, filename }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter(line => line.trim() !== "");

                for (const line of lines) {
                    if (line.startsWith("STEP:")) {
                        setProgressStep(parseInt(line.split(":")[1]));
                    } else if (line.startsWith("ERROR:")) {
                        addLog(line.substring(6), "error");
                    } else if (line.startsWith("SUCCESS:")) {
                        addLog(line.substring(8), "success");
                    } else {
                        addLog(line, "info");
                    }
                }
            }

            addLog("Flujo finalizado.", "info");
            // Mark last step as potentially done if we reached here
            setProgressStep(steps.length); // All steps done

        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                addLog("Procesamiento abortado.", "info");
                return;
            }
            const msg = error instanceof Error ? error.message : "Error desconocido";
            addLog(`Error en workflow: ${msg}`, "error");
        } finally {
            setIsProcessing(false);
            abortControllerRef.current = null;
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);
        setLogs([]);
        setProgressStep(0);
        addLog("Solicitando enlace seguro a Mux...", "info");

        try {
            // 1. Get secure upload URL
            const { url, id } = await getMuxUploadUrl();
            addLog("Enlace recibido. Comenzando subida directa...", "info");

            // 2. Start Direct Upload
            const upload = UpChunk.createUpload({
                endpoint: url,
                file: file,
                chunkSize: 5120, // 5MB chunks
            });

            muxUploadRef.current = upload;

            upload.on("progress", (detail) => {
                setUploadProgress(Math.floor(detail.detail));
            });

            upload.on("success", () => {
                setUploadProgress(100);
                setIsUploading(false);
                muxUploadRef.current = null;
                startProcessingWorkflow(id, file.name);
            });

            upload.on("error", (detail) => {
                setIsUploading(false);
                muxUploadRef.current = null;
                // Only log if not aborted by user logic (UpChunk might fire error on abort)
                addLog(`Error en subida: ${detail.detail.message}`, "error");
            });

        } catch (error: unknown) {
            setIsUploading(false);
            const msg = error instanceof Error ? error.message : "Error desconocido";
            addLog(`Error inicializando: ${msg}`, "error");
        }
    };

    // Derived state for completion
    const isCompleted = progressStep >= steps.length;

    return (
        <div className="max-w-5xl mx-auto pb-20 pt-8 px-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-purple-400">
                    Subida Directa
                </h1>
                <p className="text-foreground-muted mt-2">
                    Sube a Mux directamente desde tu navegador. Sin intermediarios.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* UPload Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="h-full border-white/5 bg-black/20 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle>Archivo de Video</CardTitle>
                            <CardDescription>Drag & Drop o Click para seleccionar.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-neon-blue/50 transition-colors group relative overflow-hidden">
                                <div className="absolute inset-0 bg-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                {!file && (
                                    <input
                                        type="file"
                                        accept="video/mp4"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={isUploading || isProcessing}
                                    />
                                )}

                                <div className="flex flex-col items-center justify-center gap-4 relative z-0">
                                    <div className="p-4 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-300">
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                                        ) : isUploading ? (
                                            <Loader2 className="h-8 w-8 text-neon-blue animate-spin" />
                                        ) : (
                                            <UploadCloud className="h-8 w-8 text-neon-blue" />
                                        )}
                                    </div>
                                    <div className="space-y-1 relative">
                                        <div className="flex items-center gap-2 justify-center">
                                            <p className="font-medium text-foreground">
                                                {file ? file.name : "Selecciona MP4"}
                                            </p>
                                            {file && !isUploading && !isProcessing && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFile(null);
                                                        setUploadProgress(0);
                                                        setLogs([]);
                                                        setProgressStep(0);
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded-full text-foreground-muted hover:text-red-400 transition-colors z-20"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-foreground-muted">
                                            {file && `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* PROGRESS BAR */}
                            {(isUploading || uploadProgress > 0) && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span>Subiendo a Mux...</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-neon-blue transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ACTION BUTTONS */}
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    {(isUploading || isProcessing) && (
                                        <Button
                                            onClick={handleCancel}
                                            variant="destructive"
                                            className="w-1/3"
                                        >
                                            Cancelar
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleUpload}
                                        disabled={!file || isUploading || isProcessing || isCompleted}
                                        className={`flex-1 ${isUploading || isProcessing ? "bg-neon-blue/80" : isCompleted ? "bg-green-600" : "bg-neon-blue"} text-black hover:bg-neon-blue/90`}
                                    >
                                        {isCompleted ? (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Proceso Completado
                                            </>
                                        ) : isUploading ? (
                                            <>Enviando bytes...</>
                                        ) : isProcessing ? (
                                            <>Procesando IA...</>
                                        ) : (
                                            <>
                                                <UploadCloud className="mr-2 h-4 w-4" />
                                                Subir video a MUX y generar contenido
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Steps Indicator */}
                            <div className="space-y-3 pt-4">
                                {steps.map((step, index) => {
                                    const isDone = index < progressStep;
                                    const isCurrent = index === progressStep;

                                    return (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs border ${isDone || (isCompleted && index === steps.length - 1)
                                                ? "bg-neon-blue text-black border-neon-blue"
                                                : isCurrent && (isUploading || isProcessing)
                                                    ? "border-neon-blue text-neon-blue animate-pulse"
                                                    : "border-white/10 text-foreground-muted"
                                                }`}>
                                                {isDone || (isCompleted && index === steps.length - 1) ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                                            </div>
                                            <span className={`text-sm ${isDone || isCurrent ? "text-foreground font-medium" : "text-foreground-muted"
                                                }`}>
                                                {step}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Logs Terminal */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="h-full border-white/5 bg-[#0a0a0a] font-mono text-sm shadow-xl shadow-black/50 flex flex-col">
                        <CardHeader className="border-b border-white/5 pb-3">
                            <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-neon-blue" />
                                <CardTitle className="text-sm font-medium font-mono text-foreground-muted">Workflow Logs</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 relative min-h-[400px]">
                            <div className="absolute inset-0 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                <AnimatePresence initial={false}>
                                    {logs.map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex gap-3 text-xs border-l-2 pl-3 py-1 ${log.type === 'error' ? 'border-red-500 text-red-400' :
                                                log.type === 'success' ? 'border-green-500 text-green-400' :
                                                    'border-blue-500/30 text-slate-300'
                                                }`}
                                        >
                                            <span className="opacity-40 min-w-[60px]">{log.time}</span>
                                            <span>{log.message}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {logs.length === 0 && !isUploading && (
                                    <div className="h-full flex flex-col items-center justify-center text-foreground-muted/30 gap-3">
                                        <Terminal className="h-8 w-8" />
                                        <p>Esperando iniciar...</p>
                                    </div>
                                )}
                                <div ref={logsEndRef} />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
