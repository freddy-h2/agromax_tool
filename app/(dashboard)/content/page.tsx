import { createClient } from "@/lib/supabase/server";
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

    const { data: videos } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });

    return <ContentClient videos={videos || []} />;
}
