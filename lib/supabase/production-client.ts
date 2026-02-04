import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para el proyecto de producción (Agromax).
 * Solo debe usarse en el servidor (API routes, Server Components).
 *
 * - VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY: obligatorios.
 * - PRODUCTION_SUPABASE_SERVICE_ROLE_KEY: opcional. Si está definido, se usa para
 *   bypassear RLS y poder leer course_modules, courses, communities (que con anon
 *   suelen devolver 0 filas por políticas RLS). Obtenerla en Supabase → Project
 *   Settings → API → service_role (secret). No exponer al cliente.
 */
export function createProductionClient() {
    const url = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!url) {
        throw new Error("Falta VITE_SUPABASE_URL en .env");
    }

    const key = serviceRoleKey || anonKey;
    if (!key) {
        throw new Error(
            "Configura VITE_SUPABASE_PUBLISHABLE_KEY en .env. Para ver comunidad/curso/módulo añade PRODUCTION_SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API → service_role)."
        );
    }

    return createClient(url, key);
}
