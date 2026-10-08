"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
}

export async function createNote(formData: FormData) {
  const { supabase, user } = await authenticatedClient();
  const content = String(formData.get("content") ?? "").trim();
  if (!content || content.length > 10000) redirect("/notes?error=content");
  const { error } = await supabase.from("notes").insert({ user_id: user.id, content });
  if (error) redirect("/notes?error=save");
  revalidatePath("/notes");
  redirect("/notes");
}

export async function deleteNote(formData: FormData) {
  const { supabase, user } = await authenticatedClient();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) redirect("/notes?error=delete");
  const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", user.id);
  if (error) redirect("/notes?error=delete");
  revalidatePath("/notes");
  redirect("/notes");
}
