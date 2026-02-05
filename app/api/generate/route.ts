import { OpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { transcription, field, currentContent } = await request.json();

        // Use currentContent to refine if provided
        let contextAddition = "";
        if (currentContent) {
            contextAddition = `\n\nContenido actual (para referencia/mejora): "${currentContent.substring(0, 1000)}"`;
        }

        if (!transcription) {
            return NextResponse.json(
                { error: "Se requiere la transcripción para generar contenido." },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "La API Key de OpenAI no está configurada." },
                { status: 500 }
            );
        }

        let systemPrompt = "Eres un experto en agronomía, ganadería y marketing digital. Tu objetivo es ayudar a crear contenido atractivo y educativo para una plataforma de videos agrícolas.";
        let userPrompt = "";

        // Truncate transcription to avoid token limits if necessary (naive approach)
        const contentContext = transcription.substring(0, 15000);

        switch (field) {
            case "title":
                systemPrompt += " Genera un título atractivo, corto (máximo 60 caracteres) y optimizado para SEO/YouTube. Debe ser en español.";
                userPrompt = `Genera 1 opción de título para un video sobre el siguiente tema. El título debe ser llamativo pero profesional.
                
                Transcripción del video:
                Transcripción del video:
                "${contentContext}"${contextAddition}`;
                break;

            case "description":
                systemPrompt += " Genera una descripción detallada para YouTube/Plataforma educativa. Debe incluir palabras clave, ser persuasiva e invitar a ver el video. Usa emojis moderadamente.";
                userPrompt = `Genera una descripción de 2-3 párrafos para este video.
                
                 transcripción:
                "${contentContext}"`;
                break;

            case "resumen":
                systemPrompt += " Genera un resumen estructurado en formato Markdown. Usa headers (###), listas (items) y negritas para resaltar puntos clave.";
                userPrompt = `Crea un resumen educativo del video basado en la siguiente transcripción. Incluye:
                - Puntos clave (bullet points)
                - Conclusiones principales
                - Si aplica, mención de razas, técnicas o herramientas específicas.
                
                Transcripción:
                "${contentContext}"`;
                break;

            default:
                return NextResponse.json({ error: "Campo no válido" }, { status: 400 });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o", // Or gpt-3.5-turbo if prefered for cost
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
        });

        const generatedText = completion.choices[0].message.content?.replace(/^"|"$/g, '').trim();

        return NextResponse.json({ result: generatedText });

    } catch (error: unknown) {
        console.error("OpenAI Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Error al generar contenido con IA", details: message },
            { status: 500 }
        );
    }
}
