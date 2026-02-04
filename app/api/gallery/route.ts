import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const DOWNLOADS_DIR = path.join(process.cwd(), "downloads");

interface VideoFile {
    id: string;
    fileName: string;
    assetId: string;
    size: number;
    sizeFormatted: string;
    downloadedAt: string;
    downloadedAtFormatted: string;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export async function GET() {
    try {
        if (!existsSync(DOWNLOADS_DIR)) {
            return NextResponse.json({ files: [], total: 0 });
        }

        const files = await readdir(DOWNLOADS_DIR);
        const videoFiles: VideoFile[] = await Promise.all(
            files
                .filter(f => f.endsWith(".mp4"))
                .map(async (fileName) => {
                    const filePath = path.join(DOWNLOADS_DIR, fileName);
                    const stats = await stat(filePath);

                    // Extract asset ID from filename (format: assetId_master_timestamp.mp4)
                    const assetId = fileName.split("_master_")[0] || fileName.replace(".mp4", "");

                    return {
                        id: fileName,
                        fileName,
                        assetId,
                        size: stats.size,
                        sizeFormatted: formatBytes(stats.size),
                        downloadedAt: stats.birthtime.toISOString(),
                        downloadedAtFormatted: formatDate(stats.birthtime),
                    };
                })
        );

        // Sort by download date, newest first
        videoFiles.sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime());

        return NextResponse.json({
            files: videoFiles,
            total: videoFiles.length,
            totalSize: formatBytes(videoFiles.reduce((acc, f) => acc + f.size, 0)),
        });
    } catch (error) {
        console.error("[Gallery] Error listing files:", error);
        return NextResponse.json(
            { files: [], total: 0, error: "Error al listar archivos" },
            { status: 500 }
        );
    }
}
