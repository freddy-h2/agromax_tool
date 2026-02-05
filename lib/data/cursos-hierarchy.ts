import { createClient } from "@supabase/supabase-js";
import Mux from "@mux/mux-node";

// Initialize Supabase Client for the External Project (Server-Side Only)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.PRODUCTION_SUPABASE_SERVICE_ROLE_KEY!;
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID!;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    throw new Error("Missing required environment variables for Supabase or Mux");
}

const externalSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        persistSession: false,
    },
});

const mux = new Mux({
    tokenId: MUX_TOKEN_ID,
    tokenSecret: MUX_TOKEN_SECRET
});

export interface Lesson {
    id: string;
    title: string;
    description: string;
    module_id: string;
    mux_playback_id: string | null;
    duration_minutes: number;
    lesson_type: string;
    order: number;
}

export interface Module {
    id: string;
    title: string;
    description: string;
    course_id: string;
    order: number;
    lessons: Lesson[];
}

export interface Course {
    id: string;
    title: string;
    description: string;
    community_id: string;
    thumbnail_url: string | null;
    modules: Module[];
}

export interface Community {
    id: string;
    name: string;
    description: string;
    courses: Course[];
}

export async function getCursosHierarchy(): Promise<Community[]> {
    console.log("Fetching courses hierarchy...");

    // 1. Fetch all data in parallel
    const [
        { data: communities, error: errCom },
        { data: courses, error: errCur },
        { data: modules, error: errMod },
        { data: lessons, error: errLes }
    ] = await Promise.all([
        externalSupabase.from("communities").select("*").order("name"),
        externalSupabase.from("courses").select("*").order("title"),
        externalSupabase.from("course_modules").select("*").order("order"),
        externalSupabase.from("course_lessons").select("*").order("order")
    ]);

    if (errCom || errCur || errMod || errLes) {
        console.error("Error fetching hierarchy data:", { errCom, errCur, errMod, errLes });
        throw new Error("Failed to fetch course data");
    }

    if (!communities || !courses || !modules || !lessons) {
        return [];
    }

    // 2. Build the hierarchy (Lessons -> Modules -> Courses -> Communities)

    // Group lessons by module_id
    const lessonsByModule: Record<string, Lesson[]> = {};
    lessons.forEach((l: any) => {
        if (!lessonsByModule[l.module_id]) {
            lessonsByModule[l.module_id] = [];
        }
        lessonsByModule[l.module_id].push({
            id: l.id,
            title: l.title, // Note: DB uses 'title'
            description: l.description,
            module_id: l.module_id,
            mux_playback_id: l.mux_playback_id,
            duration_minutes: l.duration_minutes,
            lesson_type: l.lesson_type,
            order: l.order,
        });
    });

    // Group modules by course_id and attach lessons
    const modulesByCourse: Record<string, Module[]> = {};
    modules.forEach((m: any) => {
        if (!modulesByCourse[m.course_id]) {
            modulesByCourse[m.course_id] = [];
        }
        modulesByCourse[m.course_id].push({
            id: m.id,
            title: m.title, // Note: DB uses 'title'
            description: m.description,
            course_id: m.course_id,
            order: m.order,
            lessons: lessonsByModule[m.id] || [],
        });
    });

    // Group courses by community_id and attach modules
    const coursesByCommunity: Record<string, Course[]> = {};
    courses.forEach((c: any) => {
        if (!coursesByCommunity[c.community_id]) {
            coursesByCommunity[c.community_id] = [];
        }
        coursesByCommunity[c.community_id].push({
            id: c.id,
            title: c.title, // Note: DB uses 'title'
            description: c.description,
            community_id: c.community_id,
            thumbnail_url: c.thumbnail_url,
            modules: modulesByCourse[c.id] || [],
        });
    });

    // Build final list of communities with courses
    const hierarchy: Community[] = communities.map((com: any) => ({
        id: com.id,
        name: com.name, // Note: DB uses 'name'
        description: com.description,
        courses: coursesByCommunity[com.id] || []
    }));

    // Filter out empty communities if needed, or keeping them (user request implies showing all communities)
    return hierarchy;
}

export async function getOrphanAssets() {
    console.log("Fetching orphan assets...");

    // 1. Fetch all used mux_asset_ids from Supabase (Read-Only)
    const { data: lessons, error } = await externalSupabase
        .from("course_lessons")
        .select("mux_asset_id")
        .not("mux_asset_id", "is", null);

    if (error) {
        console.error("Error fetching course_lessons:", error);
        return [];
    }

    const usedAssetIds = new Set(lessons.map((l: any) => l.mux_asset_id));

    // 2. Fetch all assets from Mux
    // Note: Mux list API is paginated. For now fetching first page/limit. 
    // In production you might want to paginate through all.
    try {
        const { data: muxAssets } = await mux.video.assets.list({ limit: 100 });

        console.log(`[DEBUG] Found ${lessons.length} linked assets in Supabase.`);
        console.log(`[DEBUG] Found ${muxAssets.length} total assets in Mux.`);

        // 3. Filter assets that are NOT in usedAssetIds
        const orphanAssets = muxAssets.filter(asset => !usedAssetIds.has(asset.id));

        console.log(`[DEBUG] Identified ${orphanAssets.length} orphan assets.`);
        if (orphanAssets.length > 0) {
            console.log(`[DEBUG] Sample orphan ID: ${orphanAssets[0].id}`);
        } else if (muxAssets.length > 0) {
            console.log(`[DEBUG] First Mux Asset ID: ${muxAssets[0].id}`);
            console.log(`[DEBUG] Is it in Supabase? ${usedAssetIds.has(muxAssets[0].id)}`);
        }

        return orphanAssets.map(asset => ({
            id: asset.id,
            playback_id: asset.playback_ids?.[0]?.id,
            status: asset.status,
            created_at: asset.created_at,
            duration: asset.duration,
            aspect_ratio: asset.aspect_ratio
        }));

    } catch (err) {
        console.error("Error fetching Mux assets:", err);
        return [];
    }
}
