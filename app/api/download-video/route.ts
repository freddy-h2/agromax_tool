import { createClient } from "@/lib/supabase/server";
import Mux from "@mux/mux-node";
import { NextRequest, NextResponse } from "next/server";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        const { videoId } = await request.json();

        if (!videoId) {
            return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
        }

        const supabase = await createClient();

        // 1. Fetch mux_asset_id from Supabase
        const { data: video, error } = await supabase
            .from("media")
            .select("mux_asset_id")
            .eq("id", videoId)
            .single();

        if (error || !video || !video.mux_asset_id) {
            return NextResponse.json({ error: "Video/Asset ID not found" }, { status: 404 });
        }

        const assetId = video.mux_asset_id;

        // 2. Retrieve Asset details from Mux
        const asset = await mux.video.assets.retrieve(assetId);

        // 3. Check Master Access status
        if (asset.master?.status === "ready") {
            // 4. If ready, return the signed URL (or simple URL if not protected, but signed is safer)
            // The user requested: "Devuelve la { url: '...' } firmada de Mux"
            // Assuming default expiration behavior or creating a signed URL if required.
            // If master access is temporary, the URL is usually just accessible.
            return NextResponse.json({ url: asset.master.url, status: "ready" });
        } else {
            // 4. If not ready, update master_access to temporary
            if (asset.master?.status !== "preparing") {
                await mux.video.assets.updateMasterAccess(assetId, {
                    master_access: "temporary",
                });
            }
            return NextResponse.json({ status: "processing" }, { status: 202 });
        }

    } catch (err: any) {
        console.error("Mux API Error:", err);
        return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
    }
}
