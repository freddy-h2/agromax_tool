"use client";

import { motion } from "framer-motion";
import { Home, Sparkles } from "lucide-react";

interface DashboardClientProps {
    userEmail: string;
}

export default function DashboardClient({ userEmail }: DashboardClientProps) {
    return (
        <div className="max-w-4xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/20">
                        <Home className="h-5 w-5 text-neon-blue" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Inicio</h1>
                </div>
            </motion.div>

            {/* Welcome Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass rounded-xl p-8"
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30">
                        <Sparkles className="h-8 w-8 text-neon-blue" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            ¡Bienvenido al Video Manager!
                        </h2>
                        <p className="text-foreground-muted mb-4">
                            Esta es tu plataforma centralizada para gestionar, descargar y
                            publicar videos de MUX. Utiliza el menú lateral para navegar entre
                            las diferentes secciones.
                        </p>

                        {/* User email display */}
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-background-secondary border border-border">
                            <span className="text-sm text-foreground-muted">
                                Sesión iniciada como:
                            </span>
                            <span className="text-sm font-medium text-neon-blue">
                                {userEmail}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats / Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
            >
                <div className="glass rounded-xl p-6">
                    <h3 className="text-sm font-medium text-foreground-muted mb-1">
                        Módulo
                    </h3>
                    <p className="text-lg font-semibold text-foreground">Download</p>
                    <p className="text-sm text-foreground-muted mt-2">
                        Descarga videos de MUX usando playback ID
                    </p>
                </div>
                <div className="glass rounded-xl p-6">
                    <h3 className="text-sm font-medium text-foreground-muted mb-1">
                        Módulo
                    </h3>
                    <p className="text-lg font-semibold text-foreground">Upload</p>
                    <p className="text-sm text-foreground-muted mt-2">
                        Sube y publica nuevos videos
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
