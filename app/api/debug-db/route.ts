import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();

    // Try to select the specific columns we are trying to update
    const { data, error } = await supabase
        .from("media")
        .select("title, description, resumen, transcription, live_date, duration_minutes")
        .limit(1);

    // Test INSERT
    const { data: insertData, error: insertError } = await supabase
        .from("media")
        .insert([{ title: "Debug Video", description: "Created by debug script" }])
        .select()
        .single();

    if (insertError) {
        return NextResponse.json({ success: false, phase: "INSERT", error: insertError.message }, { status: 500 });
    }

    const newId = insertData.id;

    // Test UPDATE
    const { error: updateError } = await supabase
        .from("media")
        .update({ description: "Updated by debug script", duration_minutes: 10 })
        .eq("id", newId);

    if (updateError) {
        return NextResponse.json({ success: false, phase: "UPDATE", error: updateError.message }, { status: 500 });
    }

    // Test DELETE
    const { error: deleteError } = await supabase
        .from("media")
        .delete()
        .eq("id", newId);

    if (deleteError) {
        return NextResponse.json({ success: false, phase: "DELETE", error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "CRUD operations successful" });
}
