import { NextRequest, NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { transcribeVideo } from "@/lib/services/transcribe";
import { generateAIContent } from "@/lib/services/ai-content";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max duration for serverless function

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uploadId, filename } = body;

        if (!uploadId) {
            return NextResponse.json({ error: "Missing uploadId" }, { status: 400 });
        }

        // 1. Get Asset ID from Upload ID
        let assetId: string | undefined;
        let attempts = 0;

        // Polling loop for asset creation
        while (!assetId && attempts < 30) { // Extended attempts
            const updatedUpload = await mux.video.uploads.retrieve(uploadId);
            if (updatedUpload.asset_id) {
                assetId = updatedUpload.asset_id;
            } else {
                await new Promise(r => setTimeout(r, 2000));
                attempts++;
            }
        }

        if (!assetId) {
            return NextResponse.json({ error: "Timeout waiting for Mux Asset ID" }, { status: 408 });
        }

        // 2. Wait for READY status (and Master Ready)
        let ready = false;
        attempts = 0;
        let assetData: Mux.Video.Asset | null = null;

        while (!ready && attempts < 150) { // Wait up to 5 mins
            assetData = await mux.video.assets.retrieve(assetId);

            if (assetData.status === "ready" && assetData.master?.status === "ready") {
                ready = true;
            } else if (assetData.status === "errored") {
                return NextResponse.json({ error: "Mux processing failed" }, { status: 500 });
            } else {
                await new Promise(r => setTimeout(r, 2000));
                attempts++;
            }
        }

        if (!ready || !assetData) {
            return NextResponse.json({ error: "Timeout waiting for Video Ready" }, { status: 408 });
        }

        const playbackId = assetData.playback_ids?.[0]?.id;
        const duration = assetData.duration;
        const createdAt = assetData.created_at;

        // 3. Transcribe
        const txResult = await transcribeVideo(assetId);

        // If transcription fails, we can still return partial data, but let's try to proceed
        const transcription = txResult.transcription || "No transcription available";

        // 4. AI Generation
        let title = filename?.replace(".mp4", "") || "Untitled Video";
        let description = "";
        let summary = "";

        if (transcription && transcription !== "No transcription available") {
            try {
                const [aiTitle, aiDesc, aiSummary] = await Promise.all([
                    generateAIContent(transcription, "title"),
                    generateAIContent(transcription, "description"),
                    generateAIContent(transcription, "resumen"),
                ]);
                title = aiTitle || title;
                description = aiDesc || "";
                summary = aiSummary || "";
            } catch (aiError) {
                console.error("AI Generation failed:", aiError);
                // Continue with raw data
            }
        }

        // 5. Return Data
        return NextResponse.json({
            asset_id: assetId,
            playback_id: playbackId,
            filename: filename,
            duration: duration,
            created_at: new Date(Number(createdAt) * 1000).toISOString(),
            uploaded_at_mux: new Date().toISOString(),
            description,
            summary,
            transcription,
            title
        });

    } catch (error: any) {
        console.error("Process Video Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
