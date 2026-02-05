import { getCursosHierarchy, getOrphanAssets } from "@/lib/data/cursos-hierarchy";
import CursosTabs from "./cursos-tabs";

export const dynamic = 'force-dynamic';

export default async function CursosPage() {
    // Server-side data fetching
    const [hierarchy, orphanAssets] = await Promise.all([
        getCursosHierarchy(),
        getOrphanAssets()
    ]);

    return <CursosTabs data={hierarchy} orphanAssets={orphanAssets} />;
}
