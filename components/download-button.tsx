"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Loader2, Check } from "lucide-react";

interface DownloadButtonProps {
    videoId: string;
    minimal?: boolean;
    className?: string;
}

export function DownloadButton({ videoId, minimal = false, className = "" }: DownloadButtonProps) {
    const [status, setStatus] = useState<"idle" | "processing" | "ready" | "error">("idle");
    const [loading, setLoading] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const checkDownloadStatus = async () => {
        try {
            const response = await fetch("/api/download-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId }),
            });

            const data = await response.json();

            if (data.status === "ready" && data.url) {
                setStatus("ready");
                setLoading(false);
                if (intervalRef.current) clearInterval(intervalRef.current);

                // Trigger download
                const link = document.createElement("a");
                link.href = data.url;
                link.download = ""; // Use default filename from URL or header
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (data.status === "processing") {
                setStatus("processing");
                // Keep polling
            } else {
                setStatus("error");
                setLoading(false);
                if (intervalRef.current) clearInterval(intervalRef.current);
                alert(data.error || "Error preparing download");
            }
        } catch (e) {
            console.error(e);
            setStatus("error");
            setLoading(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    };

    const handleDownload = () => {
        setLoading(true);
        setStatus("processing");
        checkDownloadStatus(); // Initial check

        // Start polling every 3 seconds
        intervalRef.current = setInterval(checkDownloadStatus, 3000);
    };

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className={`transition-colors flex items-center justify-center gap-2 font-medium
                ${minimal ? "h-8 w-8 rounded-md p-0" : "p-2 rounded-lg text-sm"}
                ${loading
                    ? "text-neon-purple bg-neon-purple/10 cursor-not-allowed"
                    : "text-foreground-muted hover:text-neon-blue hover:bg-white/5"
                } ${className}`}
            title="Descargar Video (Master)"
        >
            {loading ? (
                minimal ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Preparando...</span>
                    </>
                )
            ) : status === "ready" ? (
                minimal ? (
                    <Check className="h-4 w-4 text-green-500" />
                ) : (
                    <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Listo</span>
                    </>
                )
            ) : (
                minimal ? (
                    <Download className="h-4 w-4" />
                ) : (
                    <Download className="h-4 w-4" />
                )
            )}
        </button>
    );
}

