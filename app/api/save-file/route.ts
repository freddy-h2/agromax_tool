import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
    try {
        const { filename, content } = await request.json();

        if (!filename || !content) {
            return NextResponse.json({ error: "Missing filename or content" }, { status: 400 });
        }

        // Ensure "Archivos" directory exists at project root
        const dirPath = path.join(process.cwd(), "Archivos");
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, filename);

        // Remove invalid characters from content if necessary, but UTF-8 should be fine.
        // Write file
        await fs.promises.writeFile(filePath, content, "utf8");

        return NextResponse.json({ success: true, filePath });

    } catch (error) {
        console.error("Error saving file:", error);
        return NextResponse.json(
            { error: "Error saving file locally", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
