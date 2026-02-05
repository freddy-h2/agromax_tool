import Mux from "@mux/mux-node";

// Shared configuration could go here or env vars
const WHISPER_SERVICE_URL = process.env.WHISPER_SERVICE_URL || "http://localhost:8000";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export interface TranscriptionResult {
    transcription: string;
    error?: string;
    details?: unknown;
}

export async function transcribeVideo(muxAssetId: string): Promise<TranscriptionResult> {
    try {
        console.log(`[TranscribeService] Starting transcription for Asset: ${muxAssetId}`);

        // 1. Get download URL from Mux
        const asset = await mux.video.assets.retrieve(muxAssetId);

        // Ensure master access is available
        if (asset.master?.status !== "ready") {
            if (asset.master?.status !== "preparing") {
                await mux.video.assets.updateMasterAccess(muxAssetId, {
                    master_access: "temporary",
                });
                // If we just requested it, it won't be ready immediately.
                // In a real bg job we would wait or retry.
                // For this async flow, we might fail here if not ready.
                // However, for immediate upload workflow, we might wait for the asset to be ready first.
            }
            // Check if url is available even if processing? No, status must be ready.
            if (!asset.master?.url) {
                return { transcription: "", error: "Master URL not ready yet" };
            }
        }

        const videoUrl = asset.master?.url;
        if (!videoUrl) {
            return { transcription: "", error: "Master access URL not found" };
        }

        // 2. Call Whisper Service
        const whisperRes = await fetch(`${WHISPER_SERVICE_URL}/transcribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ video_url: videoUrl }),
        });

        if (!whisperRes.ok) {
            const errData = await whisperRes.json().catch(() => ({}));
            return {
                transcription: "",
                error: "Whisper service failed",
                details: errData
            };
        }

        const data = await whisperRes.json();
        return { transcription: data.transcription || "" };

    } catch (error: unknown) {
        console.error("[TranscribeService] Error:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        return {
            transcription: "",
            error: msg
        };
    }
}
