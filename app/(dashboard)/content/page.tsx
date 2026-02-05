import { createClient } from "@/lib/supabase/server";
import { createProductionClient } from "@/lib/supabase/production-client";
import { redirect } from "next/navigation";
import { ContentClient } from "./content-client";

export default async function ContentPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch local videos (for "Por subir" / editor)
    const { data: videos } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });

    const enrichedVideos = videos || [];

    // Fetch production livestreams (for "Publicados")
    const productionClient = createProductionClient();
    const { data: pastLivestreams } = await productionClient
        .from("past_livestreams")
        .select("*")
        .order("created_at", { ascending: false });

    const enrichedLivestreams = pastLivestreams || [];

    return <ContentClient videos={enrichedVideos} pastLivestreams={enrichedLivestreams} />;

}
