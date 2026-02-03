"use client";

import { motion } from "framer-motion";
import { Upload as UploadIcon, Construction } from "lucide-react";

export default function UploadPage() {
    return (
        <div className="max-w-2xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
                        <UploadIcon className="h-5 w-5 text-neon-purple" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Upload</h1>
                </div>
                <p className="text-foreground-muted">
                    Publicación de videos a la plataforma.
                </p>
            </motion.div>

            {/* Placeholder Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass rounded-xl p-12 text-center"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-blue/20 border border-neon-purple/30 mb-6"
                >
                    <Construction className="h-10 w-10 text-neon-purple" />
                </motion.div>

                <h2 className="text-2xl font-semibold text-foreground mb-3">
                    Aquí se suben videos
                </h2>

                <p className="text-foreground-muted max-w-md mx-auto">
                    Esta sección estará disponible próximamente. Podrás subir y publicar
                    nuevos videos a la plataforma de MUX.
                </p>

                {/* Coming soon badge */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-purple/10 border border-neon-purple/30"
                >
                    <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
                    <span className="text-sm font-medium text-neon-purple">
                        Próximamente
                    </span>
                </motion.div>
            </motion.div>
        </div>
    );
}
