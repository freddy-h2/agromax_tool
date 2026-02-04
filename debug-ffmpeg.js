const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const DOWNLOADS_DIR = path.join(process.cwd(), "downloads");
const THUMBNAILS_DIR = path.join(process.cwd(), "public", "thumbnails");
const videoName = "BNqaqyl4edPLEmyegCNfze2BgwQgjijYIYqeaidHDq00_master_2026-02-04T05-12-49-532Z.mp4";
const videoPath = path.join(DOWNLOADS_DIR, videoName);
const thumbnailPath = path.join(THUMBNAILS_DIR, "debug_test.jpg");

console.log("Video Path:", videoPath);
console.log("Spaces in path:", videoPath.includes(" "));

// Mimic the route.ts behavior
const ffmpegPath = "ffmpeg";

console.log("Spawning ffmpeg with shell: true and unquoted paths...");

const ffmpeg = spawn(ffmpegPath, [
    "-y",
    "-i", `"${videoPath}"`,
    "-ss", "00:00:01",
    "-vframes", "1",
    "-vf", "scale=320:-1",
    "-q:v", "2",
    `"${thumbnailPath}"`
], { shell: true });

ffmpeg.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

ffmpeg.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

ffmpeg.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    if (code !== 0) {
        console.log("FAILURE CONFIRMED: ffmpeg failed likely due to spaces in path.");
    } else {
        console.log("SUCCESS: ffmpeg worked.");
    }
});
