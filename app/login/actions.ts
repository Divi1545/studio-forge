"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";

export async function loginAction(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  const ok = await login(password);

  if (!ok) {
    redirect("/login?error=1");
  }

  redirect("/explore");
}
