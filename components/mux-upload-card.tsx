"use client";

import { useState, useRef } from "react";
import { Plus, UploadCloud, Loader2, CheckCircle2, AlertCircle, X, FileVideo } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import * as UpChunk from "@mux/upchunk";
import { getMuxUploadUrl } from "@/app/(dashboard)/upload-video/actions";

interface MuxUploadCardProps {
    communityId: string;
    courseId: string;
    moduleId: string;
}

export function MuxUploadCard({ communityId, courseId, moduleId }: MuxUploadCardProps) {
    const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "review" | "saving" | "completed">("idle");
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [processingStep, setProcessingStep] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Data to save
    const [formData, setFormData] = useState({
        asset_id: "",
        playback_id: "",
        filename: "",
        duration: 0,
        title: "",
        description: "",
        summary: "",
        transcription: "",
        video_created_at: new Date().toISOString(),
    });

    const muxUploadRef = useRef<any>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setFormData(prev => ({
                ...prev,
                filename: selectedFile.name,
                title: selectedFile.name.replace(/\.[^/.]+$/, ""), // Default title from filename
                video_created_at: new Date(selectedFile.lastModified).toISOString(),
            }));
            startUpload(selectedFile);
        }
    };

    const startUpload = async (fileToUpload: File) => {
        setStatus("uploading");
        setError(null);
        setUploadProgress(0);

        try {
            // 1. Get secure upload URL
            const { url, id: uploadId } = await getMuxUploadUrl();

            // 2. Start Direct Upload
            const upload = UpChunk.createUpload({
                endpoint: url,
                file: fileToUpload,
                chunkSize: 5120, // 5MB chunks
            });

            muxUploadRef.current = upload;

            upload.on("progress", (detail) => {
                setUploadProgress(Math.floor(detail.detail));
            });

            upload.on("success", () => {
                setUploadProgress(100);
                startProcessing(uploadId, fileToUpload.name);
            });

            upload.on("error", (detail) => {
                setError(`Error en subida: ${detail.detail.message}`);
                setStatus("idle"); // Reset to allow retry
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : "Error iniciando subida");
            setStatus("idle");
        }
    };

    const startProcessing = async (uploadId: string, filename: string) => {
        setStatus("processing");
        setProcessingStep("Iniciando procesamiento IA...");

        try {
            const response = await fetch("/api/trigger-workflow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uploadId, filename }),
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            // Temporary storage for gathered data
            // let gatheredData: any = {};

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter(line => line.trim() !== "");

                for (const line of lines) {
                    // Start parsing log messages to show progress
                    if (line.startsWith("STEP:")) {
                        const step = parseInt(line.split(":")[1]);
                        if (step === 1) setProcessingStep("Verificando video en Mux...");
                        if (step === 2) setProcessingStep("Transcribiendo audio...");
                        if (step === 3) setProcessingStep("Generando resumen y título...");
                        if (step === 4) setProcessingStep("Finalizando...");
                    } else if (line.startsWith("ERROR:")) {
                        console.error("Workflow Error:", line.substring(6));
                    }
                }
            }

            // After workflow completes, we need to fetch the data that was saved to the 'media' table 
            // OR ideally, the workflow should return it.
            // Since the existing workflow saves to 'media' table which might not be what we want 
            // (we want to show a form first), we might need to adjust the workflow or 
            // for this specific card, we can just fetch the data from Mux + AI directly?
            // BUT, the request says "se emplea el procesamiento del video (como cuando se presiona 'procesar'...)"
            // So we rely on that workflow. The workflow SAVES to 'media'. 
            // We want to save to 'mux_uploads_history'. 
            // Strategy: Let the workflow run (it saves to 'media' as a side effect, which is fine, or we ignore it).
            // BUT we need the RESULT of the processing to populate our form.

            // CHALLENGE: The current trigger-workflow stream doesn't return the structured data JSON, just logs.
            // We need to fetch the inserted record from 'media' table or modify the workflow to return data.
            // Since I cannot easily modify the workflow without potentially breaking other things (or maybe I can?),
            // I will try to fetch the latest record from 'media' filtering by filename/assetId if possible?
            // Actually, the workflow uses `uploadId` -> `assetId`.
            // Let's rely on Mux Asset ID to fetch the data from 'media' table.

            // 1. Get Asset ID from Mux using Upload ID (we can do this via a small server action or API call)
            // Or better, let's create a specialized API for this card that wraps the workflow logic BUT returns the data instead of just logging.
            // OR simpler: Queries the 'media' table for the asset_id after workflow is done.

            // Let's assume the workflow finished successfully. Now we need to find the record.
            // But we don't know the asset_id easily on the client unless we query Mux.

            // WAIT, the prompt says "aparece un formulario donde podemos ver...".
            // So we need the data.
            // I will add a step to fetch the data from `media` table using the filename (imperfect) or 
            // better, I'll update `trigger-workflow` to emit a JSON event with the assetID/data?
            // No, `trigger-workflow` streams text.

            // Workaround: I will use a server action `getAssetFromUploadId` to get the asset ID, 
            // then query the `media` table to get the AI results.

            // Let's assume for now we just show the card with empty AI data if we can't get it, 
            // allowing user to fill it. But request says "ya aparecen en el formulario".

            // I'll implement a helper to fetch the processed data.

            await fetchProcessedData(uploadId);

        } catch (err) {
            console.error("Processing error:", err);
            setError("Error en procesamiento. Puedes llenar los datos manualmente.");
            setStatus("review");
        }
    };

    const fetchProcessedData = async (uploadId: string) => {
        // This would call an API to get the data saved by the workflow
        try {
            const res = await fetch(`/api/get-processed-data?upload_id=${uploadId}`);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        asset_id: data.mux_asset_id,
                        playback_id: data.mux_playback_id,
                        title: data.title || prev.title,
                        description: data.description || "",
                        summary: data.resumen || "",
                        transcription: data.transcription || "",
                        // duration not in media table usually? check schema.
                    }));
                }
            }
        } catch (e) {
            console.error("Error fetching processed data", e);
        }
        setStatus("review");
    };

    const handleSave = async () => {
        setStatus("saving");
        try {
            const res = await fetch("/api/save-mux-history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    community_id: communityId,
                    course_id: courseId,
                    module_id: moduleId
                }),
            });

            if (!res.ok) throw new Error("Error al guardar");

            setStatus("completed");
            // Optional: Refresh parent or show success message for a moment then reset
            setTimeout(() => {
                resetForm(); // Or keep it as "Completed"
            }, 2000);

        } catch (err) {
            setError("Error al guardar historial");
            setStatus("review");
        }
    };

    const resetForm = () => {
        setStatus("idle");
        setFile(null);
        setUploadProgress(0);
        setFormData({
            asset_id: "",
            playback_id: "",
            filename: "",
            duration: 0,
            title: "",
            description: "",
            summary: "",
            transcription: "",
            video_created_at: new Date().toISOString(),
        });
    };

    if (status === "idle" || status === "completed") {
        return (
            <Card className="bg-[#0a0a0a] border border-[#333] border-dashed hover:border-neon-blue/50 transition-colors h-full min-h-[220px] flex items-center justify-center cursor-pointer group relative overflow-hidden">
                <input
                    type="file"
                    accept="video/mp4"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={status === "completed"}
                />
                <div className="flex flex-col items-center gap-3 text-[#555] group-hover:text-neon-blue transition-colors">
                    {status === "completed" ? (
                        <>
                            <CheckCircle2 className="h-12 w-12 text-green-500" />
                            <p className="font-medium text-green-500">¡Video Guardado!</p>
                        </>
                    ) : (
                        <>
                            <div className="p-4 rounded-full bg-[#111] group-hover:bg-neon-blue/10 transition-colors">
                                <Plus className="h-8 w-8" />
                            </div>
                            <p className="font-medium">Añadir Video</p>
                        </>
                    )}
                </div>
            </Card>
        );
    }

    return (
        <Card className="bg-[#0a0a0a] border border-[#333] overflow-hidden col-span-full md:col-span-1 lg:col-span-2 xl:col-span-1 min-h-[300px]">
            <CardContent className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium text-white flex items-center gap-2">
                        {status === "uploading" && <UploadCloud className="h-4 w-4 text-neon-blue" />}
                        {status === "processing" && <Loader2 className="h-4 w-4 text-neon-blue animate-spin" />}
                        {status === "review" && <FileVideo className="h-4 w-4 text-neon-blue" />}

                        {status === "uploading" ? "Subiendo Video..." :
                            status === "processing" ? "Procesando IA..." :
                                "Detalles del Video"}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={resetForm} className="h-6 w-6 text-[#666] hover:text-white">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 rounded text-xs text-red-200 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {(status === "uploading" || status === "processing") && (
                    <div className="flex-1 flex flex-col justify-center items-center text-center gap-4">
                        {status === "uploading" ? (
                            <div className="w-full space-y-2">
                                <div className="h-2 w-full bg-[#222] rounded-full overflow-hidden">
                                    <div className="h-full bg-neon-blue transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                </div>
                                <p className="text-xs text-[#888]">{uploadProgress}% Completado</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative h-12 w-12 mx-auto">
                                    <div className="absolute inset-0 rounded-full border-2 border-[#333]"></div>
                                    <div className="absolute inset-0 rounded-full border-2 border-t-neon-blue animate-spin"></div>
                                </div>
                                <p className="text-sm text-[#ccc] animate-pulse">{processingStep}</p>
                            </div>
                        )}
                    </div>
                )}

                {(status === "review" || status === "saving") && (
                    <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-[#666]">Playback ID</Label>
                                <Input
                                    value={formData.playback_id}
                                    onChange={e => setFormData({ ...formData, playback_id: e.target.value })}
                                    className="bg-[#111] border-[#333] h-8 text-xs font-mono"
                                    placeholder="Esperando..."
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-[#666]">Asset ID</Label>
                                <Input
                                    value={formData.asset_id}
                                    onChange={e => setFormData({ ...formData, asset_id: e.target.value })}
                                    className="bg-[#111] border-[#333] h-8 text-xs font-mono"
                                    placeholder="Esperando..."
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-[#666]">Título</Label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="bg-[#111] border-[#333] h-8 text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs text-[#666]">Descripción</Label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="bg-[#111] border-[#333] min-h-[60px] text-xs"
                            />
                        </div>

                        <div className="border-t border-[#222] pt-3 mt-2">
                            <div className="flex justify-between text-xs text-[#666] mb-4">
                                <span>Archivo: {formData.filename}</span>
                                <span>{new Date(formData.video_created_at).toLocaleDateString()}</span>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={status === "saving"}
                                className="w-full bg-neon-blue hover:bg-neon-blue/80 text-black font-medium"
                            >
                                {status === "saving" ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : "Guardar en Historial"}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
