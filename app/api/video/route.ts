import { NextRequest, NextResponse } from "next/server";
import { existsSync, statSync, readFileSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";

const DOWNLOADS_DIR = path.join(process.cwd(), "downloads");

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get("file");

    if (!fileName) {
        return NextResponse.json({ error: "File name required" }, { status: 400 });
    }

    const videoPath = path.join(DOWNLOADS_DIR, fileName);

    if (!existsSync(videoPath)) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const stat = statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get("range");

    if (range) {
        // Handle range requests for video seeking
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024 * 2, fileSize - 1); // 2MB chunks max
        const chunkSize = end - start + 1;

        // Read the specific chunk
        const buffer = Buffer.alloc(chunkSize);
        const { openSync, readSync, closeSync } = await import("fs");
        const fd = openSync(videoPath, "r");
        readSync(fd, buffer, 0, chunkSize, start);
        closeSync(fd);

        return new Response(buffer, {
            status: 206,
            headers: {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize.toString(),
                "Content-Type": "video/mp4",
                "Cache-Control": "public, max-age=3600",
            },
        });
    }

    // No range request - for small files only, otherwise suggest range request
    if (fileSize > 10 * 1024 * 1024) {
        // > 10MB, return first chunk only
        const chunkSize = Math.min(1024 * 1024 * 2, fileSize); // 2MB
        const buffer = readFileSync(videoPath).subarray(0, chunkSize);

        return new Response(buffer, {
            status: 206,
            headers: {
                "Content-Range": `bytes 0-${chunkSize - 1}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunkSize.toString(),
                "Content-Type": "video/mp4",
                "Cache-Control": "public, max-age=3600",
            },
        });
    }

    // Small file - read all at once
    const fileBuffer = await readFile(videoPath);

    return new Response(fileBuffer, {
        headers: {
            "Content-Length": fileSize.toString(),
            "Content-Type": "video/mp4",
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
