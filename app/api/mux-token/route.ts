import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

/**
 * Genera un token JWT firmado para Mux (playback o thumbnail).
 * POST body: { playbackId: string, type?: "video" | "thumbnail" | "gif" | "storyboard" }
 */
export async function POST(request: NextRequest) {
    try {
        if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
            return NextResponse.json(
                { error: "Faltan MUX_TOKEN_ID o MUX_TOKEN_SECRET en .env" },
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
        const token = generateMuxJWT(playbackId, aud, MUX_TOKEN_ID, MUX_TOKEN_SECRET);

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

    // Decode the private key from base64
    // El secret puede venir con comillas y estar en base64
    let cleanSecret = keySecretBase64.replace(/^["']|["']$/g, "").trim();
    
    // Decodificar de base64 a PEM
    let privateKeyPem: string;
    try {
        privateKeyPem = Buffer.from(cleanSecret, "base64").toString("utf8");
    } catch {
        // Si ya es PEM directamente
        privateKeyPem = cleanSecret;
    }

    // Si no tiene los headers PEM, puede que ya esté en formato correcto
    if (!privateKeyPem.includes("-----BEGIN")) {
        // Intentar como clave cruda (poco probable)
        privateKeyPem = `-----BEGIN RSA PRIVATE KEY-----\n${cleanSecret}\n-----END RSA PRIVATE KEY-----`;
    }

    // Sign with RS256
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(signatureInput);
    sign.end();
    const signature = sign.sign(privateKeyPem);
    const encodedSignature = base64UrlEncodeBuffer(signature);

    return `${signatureInput}.${encodedSignature}`;
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
