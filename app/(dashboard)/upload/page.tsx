"use client";

import { Upload as UploadIcon, Construction } from "lucide-react";

export default function UploadPage() {
    return (
        <div className="max-w-2xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <UploadIcon className="h-5 w-5 text-white" />
                    <h1 className="text-2xl font-bold text-white">Upload</h1>
                </div>
                <p className="text-[#888]">
                    Publicación de videos a la plataforma.
                </p>
            </div>

            {/* Placeholder Card */}
            <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl border border-[#333] bg-black mb-6">
                    <Construction className="h-10 w-10 text-white" />
                </div>

                <h2 className="text-2xl font-semibold text-white mb-3">
                    Aquí se suben videos
                </h2>

                <p className="text-[#888] max-w-md mx-auto">
                    Esta sección estará disponible próximamente. Podrás subir y publicar
                    nuevos videos a la plataforma de MUX.
                </p>

                {/* Coming soon badge */}
                <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#333] bg-black">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-sm font-medium text-white">
                        Próximamente
                    </span>
                </div>
            </div>
        </div>
    );
}
