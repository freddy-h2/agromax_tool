import { Navbar } from "@/components/navbar";
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
        <div className="min-h-screen bg-black">
            <Navbar userEmail={user.email} />
            <main className="pt-8">
                <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">{children}</div>
            </main>
        </div>
    );
}
