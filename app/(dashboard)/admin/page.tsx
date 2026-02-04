import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch existing videos for the list
    const { data: videos } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });

    return <AdminClient videos={videos || []} />;
}
