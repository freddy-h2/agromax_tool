"use server";

import Mux from "@mux/mux-node";

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function getMuxUploadUrl() {
    try {
        const upload = await mux.video.uploads.create({
            cors_origin: "*",
            new_asset_settings: {
                playback_policy: ["public"],
                // mp4_support: "standard", // Deprecated/Not allowed but we use master_access
                master_access: "temporary", // Critical for download
            },
        });

        return { url: upload.url, id: upload.id };
    } catch (error) {
        console.error("Error creating mux upload:", error);
        throw new Error("Failed to create upload URL");
    }
}
