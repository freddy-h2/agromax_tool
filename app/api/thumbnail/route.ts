import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

const DOWNLOADS_DIR = path.join(process.cwd(), "downloads");
const THUMBNAILS_DIR = path.join(process.cwd(), "public", "thumbnails");

// Generate thumbnail using ffmpeg CLI (more reliable than fluent-ffmpeg)
async function generateThumbnail(videoPath: string, thumbnailPath: string): Promise<boolean> {
    return new Promise((resolve) => {
        // Use ffmpeg to extract a frame at 1 second
        const ffmpeg = spawn("ffmpeg", [
            "-y",
            "-i", videoPath,
            "-ss", "00:00:01",
            "-vframes", "1",
            "-vf", "scale=320:-1",
            "-q:v", "2",
            thumbnailPath
        ]);

        ffmpeg.on("close", (code) => {
            resolve(code === 0);
        });

        ffmpeg.on("error", () => {
            resolve(false);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
            ffmpeg.kill();
            resolve(false);
        }, 10000);
    });
}

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

    // Ensure thumbnails directory exists
    if (!existsSync(THUMBNAILS_DIR)) {
        await mkdir(THUMBNAILS_DIR, { recursive: true });
    }

    const thumbnailName = fileName.replace(".mp4", ".jpg");
    const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);

    // Check if thumbnail already exists
    if (existsSync(thumbnailPath)) {
        const imageBuffer = await readFile(thumbnailPath);
        return new NextResponse(imageBuffer, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "public, max-age=31536000",
            },
        });
    }

    // Generate thumbnail
    const success = await generateThumbnail(videoPath, thumbnailPath);

    if (success && existsSync(thumbnailPath)) {
        const imageBuffer = await readFile(thumbnailPath);
        return new NextResponse(imageBuffer, {
            headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "public, max-age=31536000",
            },
        });
    }

    // If ffmpeg fails, return a placeholder response
    return NextResponse.json({
        error: "Could not generate thumbnail",
        hint: "Make sure ffmpeg is installed on your system"
    }, { status: 500 });
}
