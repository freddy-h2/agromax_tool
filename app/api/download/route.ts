import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Credenciales MUX desde variables de entorno
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;
const MUX_BASE_URL = "https://api.mux.com/video/v1";

// Directorio donde se guardarán los videos
const DOWNLOADS_DIR = path.join(process.cwd(), "downloads");

// Helper para crear Basic Auth header
function getAuthHeader(): string {
    const credentials = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64");
    return `Basic ${credentials}`;
}

// Helper para esperar
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
    const { assetId } = await request.json();

    if (!assetId) {
        return new Response(
            JSON.stringify({ error: "Se requiere el Asset ID" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // Verificar credenciales MUX
    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
        return new Response(
            JSON.stringify({
                error: "Credenciales MUX no configuradas",
                details: "Configura MUX_TOKEN_ID y MUX_TOKEN_SECRET en .env.local"
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    // Crear un stream para enviar logs en tiempo real
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendLog = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
                const data = JSON.stringify({ type, message, timestamp: new Date().toISOString() });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            };

            const sendResult = (result: Record<string, unknown>) => {
                const data = JSON.stringify({ type: "result", ...result });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            };

            try {
                // Asegurarse de que el directorio de descargas existe
                if (!existsSync(DOWNLOADS_DIR)) {
                    await mkdir(DOWNLOADS_DIR, { recursive: true });
                }

                sendLog(`Iniciando descarga del asset: ${assetId}`);

                // 1. Habilitar master_access
                sendLog("Paso 1: Habilitando master_access...");
                const enableMasterResponse = await fetch(
                    `${MUX_BASE_URL}/assets/${assetId}/master-access`,
                    {
                        method: "PUT",
                        headers: {
                            "Authorization": getAuthHeader(),
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ master_access: "temporary" }),
                    }
                );

                if (!enableMasterResponse.ok) {
                    const errorText = await enableMasterResponse.text();
                    if (!errorText.includes("Download already exists")) {
                        sendLog(`Error habilitando master_access: ${errorText}`, "error");
                        sendResult({ success: false, error: "Error al habilitar master_access", details: errorText });
                        controller.close();
                        return;
                    }
                    sendLog("Master access ya estaba habilitado", "info");
                } else {
                    sendLog("Master access habilitado correctamente", "success");
                }

                // 2. Polling: Esperar a que el master esté listo
                sendLog("Paso 2: Esperando que el archivo master esté listo...");
                let masterUrl: string | null = null;
                let attempts = 0;
                const maxAttempts = 60;

                while (attempts < maxAttempts) {
                    const assetResponse = await fetch(
                        `${MUX_BASE_URL}/assets/${assetId}`,
                        {
                            headers: {
                                "Authorization": getAuthHeader(),
                            },
                        }
                    );

                    if (!assetResponse.ok) {
                        sendLog(`Error al obtener información del asset: ${assetResponse.status}`, "error");
                        sendResult({ success: false, error: "Error al obtener información del asset" });
                        controller.close();
                        return;
                    }

                    const assetData = await assetResponse.json();
                    const masterInfo = assetData.data?.master || {};
                    const status = masterInfo.status;

                    if (status === "ready") {
                        masterUrl = masterInfo.url;
                        sendLog("Master listo, URL obtenida", "success");
                        break;
                    } else if (status === "errored") {
                        sendLog("Error procesando el master en MUX", "error");
                        sendResult({ success: false, error: "Error procesando el master en MUX" });
                        controller.close();
                        return;
                    }

                    sendLog(`Estado: ${status || "preparing"}. Esperando...`, "warning");
                    await sleep(2000);
                    attempts++;
                }

                if (!masterUrl) {
                    sendLog("Timeout esperando el master", "error");
                    sendResult({ success: false, error: "Timeout esperando el master" });
                    controller.close();
                    return;
                }

                // 3. Descargar el archivo
                sendLog("Paso 3: Descargando archivo...");
                sendLog("Esto puede tardar varios minutos dependiendo del tamaño del video...", "warning");

                const videoResponse = await fetch(masterUrl);

                if (!videoResponse.ok) {
                    sendLog(`Error al descargar el video: ${videoResponse.status}`, "error");
                    sendResult({ success: false, error: "Error al descargar el video" });
                    controller.close();
                    return;
                }

                sendLog("Recibiendo datos del video...");
                const videoBuffer = await videoResponse.arrayBuffer();

                // Generar nombre de archivo
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const fileName = `${assetId}_master_${timestamp}.mp4`;
                const filePath = path.join(DOWNLOADS_DIR, fileName);

                sendLog("Guardando archivo en disco...");
                await writeFile(filePath, Buffer.from(videoBuffer));

                const fileSizeInMB = (videoBuffer.byteLength / (1024 * 1024)).toFixed(2);
                sendLog(`¡ÉXITO! Video guardado como: ${fileName}`, "success");
                sendLog(`Tamaño: ${fileSizeInMB} MB`, "success");

                sendResult({
                    success: true,
                    message: "Video descargado exitosamente",
                    fileName,
                    filePath,
                    size: videoBuffer.byteLength,
                });

            } catch (error) {
                sendLog(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`, "error");
                sendResult({ success: false, error: "Error al procesar la descarga" });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

// GET: Listar videos descargados
export async function GET() {
    try {
        const { readdir, stat } = await import("fs/promises");

        if (!existsSync(DOWNLOADS_DIR)) {
            return new Response(JSON.stringify({ files: [] }), {
                headers: { "Content-Type": "application/json" },
            });
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

        return new Response(JSON.stringify({ files: videoFiles }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("[Download] Error listing files:", error);
        return new Response(JSON.stringify({ files: [], error: "Error al listar archivos" }), {
            headers: { "Content-Type": "application/json" },
        });
    }
}
