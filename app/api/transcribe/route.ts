import { createClient } from "@/lib/supabase/server";
import { createProductionClient } from "@/lib/supabase/production-client";
import Mux from "@mux/mux-node";
import { NextRequest, NextResponse } from "next/server";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

const WHISPER_SERVICE_URL = process.env.WHISPER_SERVICE_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
    try {
        const { videoId, table = "media" } = await request.json();

        console.log(`[transcribe] Request received for videoId: ${videoId}, table: ${table}`);

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
        }

        // Validar tablas permitidas para evitar inyecciones o errores
        const allowedTables = ["media", "course_lessons"];
        if (!allowedTables.includes(table)) {
            return NextResponse.json({ error: "Invalid table" }, { status: 400 });
        }

        let supabase;
        if (table === "course_lessons") {
            supabase = createProductionClient();
            console.log("[transcribe] Using Production Client (Service Role)");
        } else {
            supabase = await createClient();
            console.log("[transcribe] Using Standard User Client");
        }

        // 1. Obtener mux_asset_id y verificar que existe
        const { data: video, error: fetchError } = await supabase
            .from(table)
            .select("id, mux_asset_id")
            .eq("id", videoId)
            .single();

        if (fetchError) {
            console.error(`[transcribe] Fetch error for ${table} / ${videoId}:`, fetchError);
        }

        if (fetchError || !video?.mux_asset_id) {
            return NextResponse.json(
                { error: "Video o Asset ID no encontrado", details: fetchError },
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

        // 4. Guardar transcripción en Supabase (Solo si la tabla es 'media', course_lessons es read-only)
        if (table === "media") {
            const { error: updateError } = await supabase
                .from(table)
                .update({ transcription })
                .eq("id", videoId);

            if (updateError) {
                console.error(`[transcribe] DB Update Error for ${table} / ${videoId}:`, updateError);
                // Return success anyway so client can proceed with the transcription we have
                return NextResponse.json({
                    success: true,
                    warning: "Transcripción generada pero no se pudo guardar en base de datos.",
                    transcription
                });
            }
        } else {
            console.log(`[transcribe] Skipping DB update for table: ${table} (Read-only mode)`);
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
