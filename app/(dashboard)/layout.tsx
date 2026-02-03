import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-background">
            <Sidebar userEmail={user.email} />
            <main className="ml-64 min-h-screen">
                <div className="p-8">{children}</div>
            </main>
        </div>
    );
}
