import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAIContent(
    transcription: string,
    field: "title" | "description" | "resumen",
    currentContent: string = ""
): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Missing OpenAI API Key");
    }

    let systemPrompt = "Eres un experto en agronomía, ganadería y marketing digital. Tu objetivo es ayudar a crear contenido atractivo y educativo para una plataforma de videos agrícolas.";
    let userPrompt = "";

    // Context + Truncate
    let contextAddition = "";
    if (currentContent) {
        contextAddition = `\n\nContenido actual (para referencia): "${currentContent.substring(0, 1000)}"`;
    }
    const contentContext = transcription.substring(0, 15000);

    switch (field) {
        case "title":
            systemPrompt += " Genera un título atractivo, corto (máximo 60 caracteres) y optimizado para SEO/YouTube. Debe ser en español.";
            userPrompt = `Genera 1 opción de título para un video.
            
            Transcripción:
            "${contentContext}"${contextAddition}`;
            break;

        case "description":
            systemPrompt += " Genera una descripción detallada para YouTube/Plataforma educativa. Usa emojis moderadamente.";
            userPrompt = `Genera una descripción de 2-3 párrafos.
            
            Transcripción:
            "${contentContext}"${contextAddition}`;
            break;

        case "resumen":
            systemPrompt += " Genera un resumen estructurado en formato Markdown (bullets, headers).";
            userPrompt = `Crea un resumen educativo basado en la transcripción.
            
            Transcripción:
            "${contentContext}"${contextAddition}`;
            break;
    }

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
    });

    return completion.choices[0].message.content?.replace(/^"|"$/g, '').trim() || "";
}
