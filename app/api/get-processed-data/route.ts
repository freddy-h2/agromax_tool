import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Mux from "@mux/mux-node";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const uploadId = searchParams.get("upload_id");

        if (!uploadId) {
            return NextResponse.json({ error: "Missing upload_id" }, { status: 400 });
        }

        // 1. Get Mux Asset ID from Upload ID
        const upload = await mux.video.uploads.retrieve(uploadId);

        if (!upload.asset_id) {
            return NextResponse.json({ error: "Asset not ready yet" }, { status: 404 });
        }

        const assetId = upload.asset_id;

        // 2. Query Supabase 'media' table for this asset_id
        // The workflow saves it there.
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("media")
            .select("*")
            .eq("mux_asset_id", assetId)
            .single();

        if (error || !data) {
            // Fallback: If not in DB yet (maybe workflow failed to save but mux is ready?), return basic mux info
            return NextResponse.json({
                mux_asset_id: assetId,
                mux_playback_id: null // We could fetch it from Mux if needed, but let's assume UI handles empty
            });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("Error getting processed data:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
