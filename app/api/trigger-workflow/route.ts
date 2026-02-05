import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Mux from "@mux/mux-node";
import { transcribeVideo } from "@/lib/services/transcribe";
import { generateAIContent } from "@/lib/services/ai-content";

export const dynamic = 'force-dynamic';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(request: NextRequest) {
    const encoder = new TextEncoder();

    // STREAMING RESPONSE
    const stream = new ReadableStream({
        async start(controller) {
            const log = (msg: string, type: "INFO" | "SUCCESS" | "ERROR" = "INFO") => {
                const prefix = type === "INFO" ? "" : `${type}:`;
                controller.enqueue(encoder.encode(`${prefix}${msg}\n`));
            };
            const step = (index: number) => {
                controller.enqueue(encoder.encode(`STEP:${index}\n`));
            }

            try {
                const { uploadId, filename } = await request.json();

                if (!uploadId) throw new Error("Missing uploadId");

                step(1); // Proceeding to processing
                log("Verificando estado del archivo en Mux...");

                // 1. Get Asset ID from Upload ID
                let assetId: string | undefined;
                let attempts = 0;
                while (!assetId && attempts < 20) {
                    const updatedUpload = await mux.video.uploads.retrieve(uploadId);
                    if (updatedUpload.asset_id) {
                        assetId = updatedUpload.asset_id;
                    } else {
                        await new Promise(r => setTimeout(r, 2000));
                        attempts++;
                    }
                }

                if (!assetId) throw new Error("Tiempo de espera agotado obteniendo Asset ID");

                log(`Asset identificado: ${assetId}. Esperando que Mux prepare el video...`);

                // 2. Wait for READY status (and Master Ready)
                let ready = false;
                attempts = 0;
                // Wait up to 5 mins
                while (!ready && attempts < 150) {
                    const asset = await mux.video.assets.retrieve(assetId);

                    // We need Master Ready for Whisper download
                    if (asset.status === "ready" && asset.master?.status === "ready") {
                        ready = true;
                    } else {
                        await new Promise(r => setTimeout(r, 2000));
                        attempts++;
                        if (attempts % 10 === 0) log("...procesando video en Mux...");
                    }
                }

                if (!ready) {
                    log("Advertencia: El master del video no está listo. La transcripción podría fallar.");
                } else {
                    log("Video y Master listos.", "SUCCESS");
                }

                // Get Playback ID
                const playbackId = (await mux.video.assets.retrieve(assetId)).playback_ids?.[0]?.id;
                log(`Playback ID obtenido: ${playbackId || 'Ninguno'}`);

                // 3. Save initial record
                const supabase = await createClient();
                const { data: insertedVideo, error: dbError } = await supabase.from("media").insert({
                    title: (filename || "Video sin titulo").replace(".mp4", ""),
                    mux_asset_id: assetId,
                    mux_playback_id: playbackId,
                    // status: "ready"
                }).select().single();

                if (dbError) log(`Error DB: ${dbError.message}`, "ERROR");
                else log("Registro creado en base de datos.");

                // 4. Transcribe
                step(2);
                log("Iniciando transcripción con Whisper...");
                const txResult = await transcribeVideo(assetId);

                if (txResult.error) {
                    throw new Error(`Fallo Whisper: ${txResult.error}`);
                }

                const transcription = txResult.transcription;
                log("Transcripción completada.", "SUCCESS");

                if (insertedVideo) {
                    const { error: txUpdateError } = await supabase.from("media").update({ transcription }).eq("id", insertedVideo.id);
                    if (txUpdateError) log(`Error guardando transcripción: ${txUpdateError.message}`, "ERROR");
                    else log("Transcripción guardada en DB.");
                }

                // 5. AI Generation
                step(3);
                log("Generando metadatos inteligentes...");

                const [title, desc, resumen] = await Promise.all([
                    generateAIContent(transcription, "title"),
                    generateAIContent(transcription, "description"),
                    generateAIContent(transcription, "resumen"),
                ]);

                log("Contenido IA generado.", "SUCCESS");

                if (insertedVideo) {
                    const { error: aiUpdateError } = await supabase.from("media").update({
                        title: title || insertedVideo.title,
                        description: desc,
                        resumen: resumen,
                    }).eq("id", insertedVideo.id);

                    if (aiUpdateError) log(`Error guardando IA: ${aiUpdateError.message}`, "ERROR");
                    else log("Metadatos IA guardados en DB.");
                }

                step(4);
                log("¡Proceso completado!", "SUCCESS");

            } catch (err: unknown) {
                console.error("Workflow Error:", err);
                const msg = err instanceof Error ? err.message : "Error desconocido";
                log(msg, "ERROR");
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}
