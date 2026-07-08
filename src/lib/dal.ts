import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

/**
 * Verificação "segura" de sessão — consulta o Supabase Auth diretamente
 * (não apenas o cookie). Use em Server Components, Server Actions e Route
 * Handlers antes de acessar dados do usuário. Memoizada por requisição via
 * React `cache`.
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { userId: user.id, email: user.email };
});

export const getProfile = cache(async () => {
  const session = await verifySession();

  const [profile] = await db
    .select({
      id: profiles.id,
      nome: profiles.nome,
      cargo: profiles.cargo,
    })
    .from(profiles)
    .where(eq(profiles.id, session.userId));

  return profile ?? null;
});
