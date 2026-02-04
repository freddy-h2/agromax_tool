import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { spawn } from "child_process";

const DOWNLOADS_DIR = path.join(process.cwd(), "downloads");
const THUMBNAILS_DIR = path.join(process.cwd(), "public", "thumbnails");

// Common ffmpeg locations on Windows
const FFMPEG_PATHS = [
    "ffmpeg", // PATH
    "C:\\Users\\Usuario\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe",
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
];

// Find ffmpeg executable
async function findFfmpeg(): Promise<string | null> {
    for (const ffmpegPath of FFMPEG_PATHS) {
        if (ffmpegPath === "ffmpeg") {
            // Check if ffmpeg is in PATH
            return new Promise((resolve) => {
                const proc = spawn("ffmpeg", ["-version"], { shell: true });
                proc.on("close", (code) => resolve(code === 0 ? "ffmpeg" : null));
                proc.on("error", () => resolve(null));
                setTimeout(() => {
                    proc.kill();
                    resolve(null);
                }, 2000);
            });
        } else if (existsSync(ffmpegPath)) {
            return ffmpegPath;
        }
    }
    return null;
}

// Generate thumbnail using ffmpeg
async function generateThumbnail(videoPath: string, thumbnailPath: string): Promise<boolean> {
    const ffmpegPath = await findFfmpeg();

    if (!ffmpegPath) {
        console.log("[Thumbnail] ffmpeg not found");
        return false;
    }

    return new Promise((resolve) => {
        const ffmpeg = spawn(ffmpegPath, [
            "-y",
            "-i", `"${videoPath}"`,
            "-ss", "00:00:01",
            "-vframes", "1",
            "-vf", "scale=320:-1",
            "-q:v", "2",
            `"${thumbnailPath}"`
        ], { shell: true });

        ffmpeg.on("close", (code) => {
            resolve(code === 0);
        });

        ffmpeg.on("error", (err) => {
            console.log("[Thumbnail] ffmpeg error:", err);
            resolve(false);
        });

        // Timeout after 15 seconds
        setTimeout(() => {
            ffmpeg.kill();
            resolve(false);
        }, 15000);
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

    // If ffmpeg fails, return error
    return NextResponse.json({
        error: "Could not generate thumbnail",
        hint: "ffmpeg not found or failed. Restart VS Code to update PATH."
    }, { status: 500 });
}
