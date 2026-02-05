import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            video_id,
            video_title,
            video_description,
            video_created_at,
            duration_minutes,
            community_name,
            course_title,
            module_title,
            ai_summary,
            transcription
        } = body;

        if (!video_id) {
            return NextResponse.json({ error: "Missing video_id" }, { status: 400 });
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from("video_processing_results")
            .insert({
                video_id,
                video_title,
                video_description,
                video_created_at,
                duration_minutes,
                community_name,
                course_title,
                module_title,
                ai_summary: ai_summary || null, // Ensure null if empty/undefined
                transcription
            })
            .select()
            .single();

        if (error) {
            console.error("[save-db] Insert Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: unknown) {
        console.error("[save-db] Internal Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
