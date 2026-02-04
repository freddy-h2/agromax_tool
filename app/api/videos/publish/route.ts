import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        // Authenticated client
        const supabase = await createClient();
        const body = await request.json();

        // Check authentication (optional but recommended before insert)
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: "No autorizado" },
                { status: 401 }
            );
        }

        // Insertar en la tabla published_videos
        const { data, error } = await supabase
            .from('published_videos')
            .insert([
                {
                    title: body.title,
                    description: body.description,
                    resumen: body.resumen,
                    // asset_id y transcription removidos para coincidir con esquema actual
                    mux_playback_id: body.playbackId, // Si existe
                    duration_minutes: body.duration,
                    live_date: body.liveDate || new Date().toISOString(),
                }
            ])
            .select();

        if (error) {
            console.error("Error Supabase:", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error("Error general:", error);
        return NextResponse.json(
            { success: false, error: "Error al publicar el video" },
            { status: 500 }
        );
    }
}
