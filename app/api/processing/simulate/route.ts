import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { fileName } = await request.json();

        // Simular retardo de procesamiento (3 segundos)
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Datos simulados en español
        return NextResponse.json({
            success: true,
            data: {
                title: fileName.replace('.mp4', '').replace(/_/g, ' '),
                transcription: "Esta es una transcripción simulada del video. En este video se discuten las mejores prácticas para el cultivo de maíz en climas áridos, incluyendo técnicas de riego por goteo y selección de semillas resistentes a la sequía. También se menciona la importancia del análisis de suelo previo a la siembra.",
                resumen: "Video educativo sobre técnicas de cultivo de maíz en zonas áridas. Cubre riego eficiente y selección de semillas.",
                duration_minutes: 15.5,
                suggested_tags: ["maíz", "agricultura", "riego", "clima árido"]
            }
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Error en el procesamiento simulado" },
            { status: 500 }
        );
    }
}
