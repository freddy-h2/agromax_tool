import Mux from "@mux/mux-node";

// Initialize Mux with Signing Keys from environment
// We don't need tokenId/tokenSecret for just signing, but we pass them if available or just rely on env.
// Specifically passing signing keys for the jwt resource.
const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID || "placeholder", // Required by SDK constructor validation?
    tokenSecret: process.env.MUX_TOKEN_SECRET || "placeholder",
    jwtSigningKey: process.env.MUX_SIGNING_KEY_ID,
    jwtPrivateKey: process.env.MUX_SIGNING_KEY_SECRET,
});

/**
 * Signs a Mux Playback ID for a specific type (video, thumbnail, etc.)
 * using the Signing Keys configured in environment variables.
 * Returns a Promise as the SDK method is async.
 */
export async function signMuxPlaybackId(
    playbackId: string,
    type: "video" | "thumbnail" | "gif" | "storyboard" = "video"
): Promise<string> {
    const keyId = process.env.MUX_SIGNING_KEY_ID;
    const keySecret = process.env.MUX_SIGNING_KEY_SECRET;

    if (!keyId || !keySecret) {
        console.warn("Missing MUX_SIGNING_KEY_ID or MUX_SIGNING_KEY_SECRET. Returning unsigned playbackId (might fail if asset is signed).");
        // If keys are missing, we can't sign. 
        // Return empty string or throw? empty string means invalid url probably.
        return "";
    }

    try {
        return await mux.jwt.signPlaybackId(playbackId, {
            type,
            expiration: "12h",
        });
    } catch (err) {
        console.error("Error signing Mux Playback ID:", err);
        return "";
    }
}
