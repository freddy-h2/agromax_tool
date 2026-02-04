import { NextRequest, NextResponse } from "next/server";
import { mux } from "@/lib/mux";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const assetId = searchParams.get("assetId");

    if (!assetId) {
        return NextResponse.json({ error: "Asset ID required" }, { status: 400 });
    }

    try {
        const asset = await mux.video.assets.retrieve(assetId);

        // Check for static renditions (MP4 downloads)
        // Mux requires enabling "MP4 support" on the asset for this to appear
        const staticRenditions = asset.static_renditions;

        if (!staticRenditions || staticRenditions.status !== "ready" || !staticRenditions.files) {
            return NextResponse.json({
                error: "Downloads not enabled or not ready for this video. Enable MP4 support in Mux dashboard."
            }, { status: 404 });
        }

        // Find the 'high' quality, or fallback to 'medium' or 'low'
        const file = staticRenditions.files.find(f => f.name === "high.mp4") ||
            staticRenditions.files.find(f => f.name === "medium.mp4") ||
            staticRenditions.files[0];

        if (!file) {
            return NextResponse.json({ error: "No download file found" }, { status: 404 });
        }

        // Redirect the user to the Mux download URL
        return NextResponse.redirect((file as any).url || "");

    } catch (error) {
        console.error("[Mux Download] Error:", error);
        return NextResponse.json(
            { error: "Error al procesar la descarga" },
            { status: 500 }
        );
    }
}
