"use server";

import { createProductionClient } from "@/lib/supabase/production-client";
import { revalidatePath } from "next/cache";

export async function publishVideo(video: any) {
    const supabase = createProductionClient();

    try {
        const { error } = await supabase
            .from("past_livestreams")
            .insert([{
                title: video.title,
                description: video.description,
                mux_playback_id: video.mux_playback_id,
                live_date: video.live_date,
                duration_minutes: video.duration_minutes,
                livestream_config_id: video.live_stream_config_id,
                resumen: video.resumen,
                created_at: video.created_at,
            }]);

        if (error) throw error;

        revalidatePath("/content");
        return { success: true };
    } catch (error: any) {
        console.error("Error publishing video:", error);
        return { success: false, error: error.message };
    }
}

export async function unpublishVideo(videoId: string) {
    const supabase = createProductionClient();

    try {
        const { error } = await supabase
            .from("past_livestreams")
            .delete()
            .eq("id", videoId);

        if (error) throw error;

        revalidatePath("/content");
        return { success: true };
    } catch (error: any) {
        console.error("Error unpublishing video:", error);
        return { success: false, error: error.message };
    }
}
