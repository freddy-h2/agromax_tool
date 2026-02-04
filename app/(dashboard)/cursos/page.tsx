import { getCursosHierarchy } from "@/lib/data/cursos-hierarchy";
import CursosTabs from "./cursos-tabs";

export const dynamic = 'force-dynamic';

export default async function CursosPage() {
    // Server-side data fetching
    const hierarchy = await getCursosHierarchy();

    return <CursosTabs data={hierarchy} />;
}
