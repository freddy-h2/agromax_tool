"use client";

import { Home, Sparkles } from "lucide-react";

interface DashboardClientProps {
    userEmail: string;
}

export default function DashboardClient({ userEmail }: DashboardClientProps) {
    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Home className="h-5 w-5 text-white" />
                    <h1 className="text-2xl font-bold text-white">Inicio</h1>
                </div>
            </div>

            {/* Welcome Card */}
            <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-8">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl border border-[#333] bg-black">
                        <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-white mb-2">
                            ¡Bienvenido a Agromax - Video tool!
                        </h2>
                        <p className="text-[#888] mb-4">
                            Esta es tu plataforma centralizada para gestionar, descargar y
                            publicar videos de MUX. Utiliza la cinta de opciones para navegar entre
                            las diferentes secciones.
                        </p>

                        {/* User email display */}
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-black border border-[#333]">
                            <span className="text-sm text-[#888]">
                                Sesión iniciada como:
                            </span>
                            <span className="text-sm font-medium text-white">
                                {userEmail}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats / Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-6">
                    <h3 className="text-sm font-medium text-[#888] mb-1">
                        Módulo
                    </h3>
                    <p className="text-lg font-semibold text-white">Download</p>
                    <p className="text-sm text-[#888] mt-2">
                        Descarga videos de MUX usando playback ID
                    </p>
                </div>
                <div className="rounded-xl border border-[#333] bg-[#0a0a0a] p-6">
                    <h3 className="text-sm font-medium text-[#888] mb-1">
                        Módulo
                    </h3>
                    <p className="text-lg font-semibold text-white">Upload</p>
                    <p className="text-sm text-[#888] mt-2">
                        Sube y publica nuevos videos
                    </p>
                </div>
            </div>
        </div>
    );
}
