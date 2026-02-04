import { createClient } from "@/lib/supabase/server";
import Mux from "@mux/mux-node";
import { NextRequest, NextResponse } from "next/server";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

const WHISPER_SERVICE_URL = process.env.WHISPER_SERVICE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
    try {
        const { videoId } = await request.json();

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Obtener mux_asset_id y verificar que existe
        const { data: video, error: fetchError } = await supabase
            .from("media")
            .select("id, mux_asset_id")
            .eq("id", videoId)
            .single();

        if (fetchError || !video?.mux_asset_id) {
            return NextResponse.json(
                { error: "Video o Asset ID no encontrado" },
                { status: 404 }
            );
        }

        // 2. Obtener URL de descarga desde Mux
        const asset = await mux.video.assets.retrieve(video.mux_asset_id);

        if (asset.master?.status !== "ready") {
            if (asset.master?.status !== "preparing") {
                await mux.video.assets.updateMasterAccess(video.mux_asset_id, {
                    master_access: "temporary",
                });
            }
            return NextResponse.json(
                { error: "El video aún está procesándose. Intenta de nuevo en unos minutos." },
                { status: 202 }
            );
        }

        const videoUrl = asset.master!.url;
        if (!videoUrl) {
            return NextResponse.json(
                { error: "No se pudo obtener la URL del video" },
                { status: 500 }
            );
        }

        // 3. Llamar al microservicio Whisper
        const whisperRes = await fetch(`${WHISPER_SERVICE_URL}/transcribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ video_url: videoUrl }),
        });

        if (!whisperRes.ok) {
            const errData = await whisperRes.json().catch(() => ({}));
            const details = errData.detail || whisperRes.statusText;
            console.error("Whisper service error:", details);
            return NextResponse.json(
                {
                    error: "Error en el servicio de transcripción",
                    details: typeof details === "string" ? details : JSON.stringify(details),
                },
                { status: 502 }
            );
        }

        const { transcription } = await whisperRes.json();

        // 4. Guardar transcripción en Supabase
        const { error: updateError } = await supabase
            .from("media")
            .update({ transcription })
            .eq("id", videoId);

        if (updateError) {
            return NextResponse.json(
                { error: "Error al guardar la transcripción", transcription },
                { status: 500 }
            );
        }

        return NextResponse.json({ transcription, success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error interno";
        console.error("Transcribe API Error:", err);
        return NextResponse.json(
            { error: "Error interno del servidor", details: message },
            { status: 500 }
        );
    }
}
