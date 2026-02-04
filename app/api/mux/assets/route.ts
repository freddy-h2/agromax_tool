import { NextResponse } from "next/server";
import { mux } from "@/lib/mux";

export async function GET() {
    try {
        const assets = await mux.video.assets.list({
            limit: 100,
        });

        // Filter only ready assets
        const readyAssets = assets.data.filter(asset => asset.status === "ready");

        return NextResponse.json({
            assets: readyAssets.map(asset => ({
                id: asset.id,
                playbackId: asset.playback_ids?.[0]?.id,
                status: asset.status,
                createdAt: asset.created_at,
                duration: asset.duration,
                aspectRatio: asset.aspect_ratio,
                maxStoredResolution: asset.max_stored_resolution,
            }))
        });
    } catch (error) {
        console.error("[Mux Assets] Error listing assets:", error);
        return NextResponse.json(
            { error: "Error al obtener videos de Mux" },
            { status: 500 }
        );
    }
}
