import { createClient } from "@/lib/supabase/server";
import Mux from "@mux/mux-node";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing video ID" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch video details including credentials
    const { data: video, error } = await supabase
        .from("media")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !video) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (!video.asset_id || !video.token_id || !video.secret_key) {
        return NextResponse.json({ error: "Missing Mux credentials or Asset ID for this video" }, { status: 400 });
    }

    try {
        // Initialize Mux with the specific credentials for this video
        const mux = new Mux({
            tokenId: video.token_id,
            tokenSecret: video.secret_key,
        });

        // Retrieve Asset details
        const asset = await mux.video.assets.retrieve(video.asset_id);

        // Check for static renditions (MP4s)
        const mp4Files = asset.static_renditions?.files;

        if (!mp4Files || mp4Files.length === 0) {
            // Option: You could try to enable it, but for now just error
            return NextResponse.json({
                error: "No MP4 downloads available for this asset. Please enable 'MP4 Support' in Mux settings."
            }, { status: 400 });
        }

        // Find the best quality (usually 'high')
        const highQuality = mp4Files.find((f: any) => f.name === "high.mp4") || mp4Files[0];

        // Redirect to the download URL
        // Note: 'url' in static_renditions is signed if the asset is signed, or public if public.
        // Assuming public for now or that the URL provided by Mux is usable.
        return NextResponse.redirect(highQuality.url);

    } catch (err: any) {
        console.error("Mux API Error:", err);
        return NextResponse.json({ error: "Failed to retrieve download URL from Mux", details: err.message }, { status: 500 });
    }
}
