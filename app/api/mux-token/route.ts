import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Signing Keys (para firmar URLs de playback) - diferentes de las API keys
const MUX_SIGNING_KEY_ID = process.env.MUX_SIGNING_KEY_ID;
const MUX_SIGNING_KEY_SECRET = process.env.MUX_SIGNING_KEY_SECRET;

/**
 * Genera un token JWT firmado para Mux (playback o thumbnail).
 * POST body: { playbackId: string, type?: "video" | "thumbnail" | "gif" | "storyboard" }
 */
export async function POST(request: NextRequest) {
    try {
        if (!MUX_SIGNING_KEY_ID || !MUX_SIGNING_KEY_SECRET) {
            return NextResponse.json(
                { error: "Faltan MUX_SIGNING_KEY_ID o MUX_SIGNING_KEY_SECRET en .env" },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { playbackId, type = "video" } = body as {
            playbackId?: string;
            type?: "video" | "thumbnail" | "gif" | "storyboard";
        };

        if (!playbackId) {
            return NextResponse.json(
                { error: "playbackId es requerido" },
                { status: 400 }
            );
        }

        // Mapeo de tipo a audience de Mux
        const typeToAudience: Record<string, string> = {
            video: "v",
            thumbnail: "t",
            gif: "g",
            storyboard: "s",
        };
        const aud = typeToAudience[type] || "v";

        // Generar el token JWT manualmente
        const token = generateMuxJWT(playbackId, aud, MUX_SIGNING_KEY_ID, MUX_SIGNING_KEY_SECRET);

        // Construir URLs firmadas
        let url = "";
        if (type === "thumbnail") {
            url = `https://image.mux.com/${playbackId}/thumbnail.jpg?token=${token}`;
        } else if (type === "gif") {
            url = `https://image.mux.com/${playbackId}/animated.gif?token=${token}`;
        } else if (type === "storyboard") {
            url = `https://image.mux.com/${playbackId}/storyboard.vtt?token=${token}`;
        }

        return NextResponse.json({
            token,
            playbackId,
            type,
            url: url || undefined,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        console.error("[mux-token] Error:", err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * Genera un JWT firmado con RS256 para Mux
 */
function generateMuxJWT(
    playbackId: string,
    audience: string,
    keyId: string,
    keySecretBase64: string
): string {
    // Header
    const header = {
        alg: "RS256",
        typ: "JWT",
        kid: keyId,
    };

    // Payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: playbackId,
        aud: audience,
        exp: now + 3600, // 1 hora
        kid: keyId,
    };

    // Encode header and payload
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    // 1 Clean the input
    const cleanSecret = keySecretBase64.replace(/^["']|["']$/g, "").trim();

    // 2 Resolve valid PEM
    let privateKeyPem: string;

    // Check if it's already a PEM string (Has headers)
    if (cleanSecret.includes("-----BEGIN")) {
        console.log("[mux-token] Key appears to be raw PEM");
        privateKeyPem = cleanSecret.replace(/\\n/g, "\n");
    } else {
        // Assume it's Base64 encoded (Standard Mux format)
        try {
            const decoded = Buffer.from(cleanSecret, "base64").toString("utf8");
            if (decoded.includes("-----BEGIN")) {
                console.log("[mux-token] Key appears to be Base64 encoded PEM");
                privateKeyPem = decoded.replace(/\\n/g, "\n");
            } else {
                console.warn("[mux-token] Decoded base64 does not contain PEM headers. Trying manual reconstruction.");
                // If standard structure is lost, try to force it as a specific key type
                // Usually Mux uses RSA Private Keys
                privateKeyPem = `-----BEGIN RSA PRIVATE KEY-----\n${cleanSecret}\n-----END RSA PRIVATE KEY-----`;
            }
        } catch (e) {
            console.error("[mux-token] Base64 decode failed:", e);
            // Fallback to wrapping the raw secret
            privateKeyPem = `-----BEGIN RSA PRIVATE KEY-----\n${cleanSecret}\n-----END RSA PRIVATE KEY-----`;
        }
    }

    // 3 Sign
    try {
        // Modern approach using crypto.sign (Node 12+)
        // createPrivateKey verifies the format immediately
        const privateKey = crypto.createPrivateKey({
            key: privateKeyPem,
            format: 'pem',
            type: 'pkcs8' // Mux keys varies, but createPrivateKey is usually smart enough
        });

        const signature = crypto.sign("sha256", Buffer.from(signatureInput), privateKey);
        const encodedSignature = base64UrlEncodeBuffer(signature);
        return `${signatureInput}.${encodedSignature}`;

    } catch (error) {
        console.error("[mux-token] Signing failed. Key preview:", privateKeyPem.substring(0, 50) + "...");
        throw new Error(`Failed to sign JWT: ${(error as any).message}`);
    }
}

/**
 * Base64 URL encode a string
 */
function base64UrlEncode(str: string): string {
    return Buffer.from(str, "utf8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

/**
 * Base64 URL encode a buffer
 */
function base64UrlEncodeBuffer(buffer: Buffer): string {
    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}
