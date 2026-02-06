import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            asset_id, playback_id, filename, duration,
            video_created_at, title, description, summary,
            transcription, community_id, course_id, module_id
        } = body;

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("mux_uploads_history")
            .insert({
                asset_id,
                playback_id,
                filename,
                duration,
                video_created_at,
                title,
                description,
                summary,
                transcription,
                community_id,
                course_id,
                module_id
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error saving history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
