import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Directorio donde se guardarán los videos
const DOWNLOADS_DIR = path.join(process.cwd(), "downloads");

export async function POST(request: NextRequest) {
    try {
        const { playbackId, muxToken } = await request.json();

        if (!playbackId || !muxToken) {
            return NextResponse.json(
                { error: "Se requiere playbackId y muxToken" },
                { status: 400 }
            );
        }

        // Asegurarse de que el directorio de descargas existe
        if (!existsSync(DOWNLOADS_DIR)) {
            await mkdir(DOWNLOADS_DIR, { recursive: true });
        }

        // Construir la URL del video MUX
        // Para videos públicos: https://stream.mux.com/{playbackId}/high.mp4
        // Para videos privados se necesita un JWT firmado
        const videoUrl = `https://stream.mux.com/${playbackId}/high.mp4`;

        // TODO: Cuando tengas los tokens MUX, descomentar y ajustar:
        // Para videos privados, necesitarás generar un signed URL con JWT
        // const signedUrl = generateSignedMuxUrl(playbackId, muxToken);

        console.log(`[Download] Iniciando descarga de: ${playbackId}`);
        console.log(`[Download] URL: ${videoUrl}`);

        // Intentar descargar el video
        const response = await fetch(videoUrl, {
            headers: {
                // Si el video es privado y requiere token en header:
                // "Authorization": `Bearer ${muxToken}`,
            },
        });

        if (!response.ok) {
            console.error(`[Download] Error al obtener video: ${response.status}`);
            return NextResponse.json(
                {
                    error: `Error al descargar video: ${response.status}`,
                    message: "Verifica que el playbackId sea correcto y el video sea accesible"
                },
                { status: response.status }
            );
        }

        // Obtener el contenido del video
        const videoBuffer = await response.arrayBuffer();

        // Generar nombre de archivo con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `${playbackId}_${timestamp}.mp4`;
        const filePath = path.join(DOWNLOADS_DIR, fileName);

        // Guardar el archivo
        await writeFile(filePath, Buffer.from(videoBuffer));

        console.log(`[Download] Video guardado en: ${filePath}`);

        return NextResponse.json({
            success: true,
            message: "Video descargado exitosamente",
            fileName,
            filePath,
            size: videoBuffer.byteLength,
        });

    } catch (error) {
        console.error("[Download] Error:", error);
        return NextResponse.json(
            {
                error: "Error al procesar la descarga",
                details: error instanceof Error ? error.message : "Error desconocido"
            },
            { status: 500 }
        );
    }
}

// GET: Listar videos descargados
export async function GET() {
    try {
        const { readdir, stat } = await import("fs/promises");

        if (!existsSync(DOWNLOADS_DIR)) {
            return NextResponse.json({ files: [] });
        }

        const files = await readdir(DOWNLOADS_DIR);
        const videoFiles = await Promise.all(
            files
                .filter(f => f.endsWith(".mp4"))
                .map(async (fileName) => {
                    const filePath = path.join(DOWNLOADS_DIR, fileName);
                    const stats = await stat(filePath);
                    return {
                        fileName,
                        size: stats.size,
                        downloadedAt: stats.birthtime,
                    };
                })
        );

        return NextResponse.json({ files: videoFiles });
    } catch (error) {
        console.error("[Download] Error listing files:", error);
        return NextResponse.json({ files: [], error: "Error al listar archivos" });
    }
}
