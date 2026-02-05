import { NextResponse } from "next/server";
import { createProductionClient } from "@/lib/supabase/production-client";

export type ProductionLessonRow = {
    id: string;
    module_id: string;
    title: string;
    description: string | null;
    lesson_type: string;
    content_url: string | null;
    order: number;
    duration_minutes: number | null;
    mux_asset_id: string | null;
    mux_playback_id: string | null;
    mux_asset_status: string | null;
    created_at: string;
    course_modules: {
        id: string;
        course_id: string;
        title: string;
        order: number;
        courses: {
            id: string;
            title: string;
            community_id: string;
            communities: {
                id: string;
                name: string;
            } | null;
        } | null;
    } | null;
};

export async function GET(request: Request) {
    const url = new URL(request.url);
    const debugMode = url.searchParams.get("debug") === "1";

    const debug: Record<string, unknown> = {};

    try {
        const supabase = createProductionClient();

        // 1. Lecciones de video con Mux configurado
        const { data: lessonsData, error: lessonsError } = await supabase
            .from("course_lessons")
            .select(
                "id, module_id, title, description, lesson_type, content_url, \"order\", duration_minutes, mux_asset_id, mux_playback_id, mux_asset_status, created_at"
            )
            .eq("lesson_type", "video")
            .not("mux_asset_id", "is", null)
            .order("created_at", { ascending: false });

        if (lessonsError) {
            console.error("[production-lessons] course_lessons error:", lessonsError);
            return NextResponse.json(
                { error: lessonsError.message, details: lessonsError.details },
                { status: 502 }
            );
        }

        const lessons = lessonsData ?? [];
        debug.step1_lessons = {
            total: lessons.length,
            ids: lessons.map((l) => l.id),
            titles: lessons.map((l) => l.title),
            module_ids: lessons.map((l) => l.module_id),
        };
        console.log("[production-lessons] 1. course_lessons:", debug.step1_lessons);
        if (lessons.length === 0) {
            return NextResponse.json(
                { lessons: [], ...(debugMode && { debug }) }
            );
        }

        const moduleIds = [...new Set(lessons.map((l) => l.module_id).filter(Boolean))];
        debug.step2_moduleIds = { count: moduleIds.length, ids: moduleIds };
        console.log("[production-lessons] 2. moduleIds a consultar:", moduleIds.length, moduleIds);

        // 2. Módulos
        const { data: modulesData, error: modulesError } = await supabase
            .from("course_modules")
            .select("id, course_id, title, \"order\"")
            .in("id", moduleIds);

        if (modulesError) {
            console.error("[production-lessons] course_modules error:", modulesError);
            return NextResponse.json(
                { error: modulesError.message },
                { status: 502 }
            );
        }

        const modules = modulesData ?? [];
        debug.step3_modules = {
            total: modules.length,
            ids: modules.map((m) => m.id),
            titles: modules.map((m) => m.title),
            course_ids: modules.map((m) => m.course_id),
        };
        console.log("[production-lessons] 3. course_modules:", debug.step3_modules);
        const modulesById = Object.fromEntries(modules.map((m) => [m.id, m]));
        const courseIds = [...new Set(modules.map((m) => m.course_id).filter(Boolean))];
        debug.step4_courseIds = { count: courseIds.length, ids: courseIds };
        console.log("[production-lessons] 4. courseIds a consultar:", courseIds.length, courseIds);

        // 3. Cursos
        const { data: coursesData, error: coursesError } = await supabase
            .from("courses")
            .select("id, title, community_id")
            .in("id", courseIds);

        if (coursesError) {
            console.error("[production-lessons] courses error:", coursesError);
            return NextResponse.json(
                { error: coursesError.message },
                { status: 502 }
            );
        }

        const courses = coursesData ?? [];
        debug.step5_courses = {
            total: courses.length,
            ids: courses.map((c) => c.id),
            titles: courses.map((c) => c.title),
            community_ids: courses.map((c) => c.community_id),
        };
        console.log("[production-lessons] 5. courses:", debug.step5_courses);
        const coursesById = Object.fromEntries(courses.map((c) => [c.id, c]));
        const communityIds = [...new Set(courses.map((c) => c.community_id).filter(Boolean))];
        debug.step6_communityIds = { count: communityIds.length, ids: communityIds };
        console.log("[production-lessons] 6. communityIds a consultar:", communityIds.length, communityIds);

        // 4. Comunidades
        const { data: communitiesData, error: communitiesError } = await supabase
            .from("communities")
            .select("id, name")
            .in("id", communityIds);

        if (communitiesError) {
            console.error("[production-lessons] communities error:", communitiesError);
            return NextResponse.json(
                { error: communitiesError.message },
                { status: 502 }
            );
        }

        const communities = communitiesData ?? [];
        debug.step7_communities = {
            total: communities.length,
            ids: communities.map((c) => c.id),
            names: communities.map((c) => c.name),
        };
        console.log("[production-lessons] 7. communities:", debug.step7_communities);
        const communitiesById = Object.fromEntries(communities.map((c) => [c.id, c]));

        // 5. Armar respuesta con la misma forma que espera el cliente
        const lessonsWithContext: ProductionLessonRow[] = lessons.map((lesson) => {
            const mod = modulesById[lesson.module_id];
            const course = mod ? coursesById[mod.course_id] : null;
            const community = course ? communitiesById[course.community_id] : null;

            return {
                ...lesson,
                order: (lesson as { order?: number }).order ?? 0,
                course_modules: mod
                    ? {
                          id: mod.id,
                          course_id: mod.course_id,
                          title: mod.title,
                          order: mod.order ?? 0,
                          courses: course
                              ? {
                                    id: course.id,
                                    title: course.title,
                                    community_id: course.community_id,
                                    communities: community
                                        ? { id: community.id, name: community.name }
                                        : null,
                                }
                              : null,
                      }
                    : null,
            };
        });

        debug.step8_resultado = {
            totalLessons: lessonsWithContext.length,
            conContextoCompleto: lessonsWithContext.filter(
                (l) => l.course_modules?.courses?.communities?.name
            ).length,
            sinModulo: lessonsWithContext.filter((l) => !l.course_modules).length,
            sinCurso: lessonsWithContext.filter(
                (l) => l.course_modules && !l.course_modules.courses
            ).length,
            sinComunidad: lessonsWithContext.filter(
                (l) =>
                    l.course_modules?.courses && !l.course_modules.courses.communities
            ).length,
        };
        console.log("[production-lessons] 8. RESULTADO FINAL:", debug.step8_resultado);

        return NextResponse.json({
            lessons: lessonsWithContext,
            ...(debugMode && { debug }),
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        console.error("[production-lessons]", err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
