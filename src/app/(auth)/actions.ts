"use server";

import * as z from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { cadastroSchema, loginSchema } from "@/lib/validation/schemas/auth";

export interface AuthFormState {
  errors?: Record<string, string[] | undefined>;
  message?: string;
}

export async function login(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);

  if (error) {
    return { message: "E-mail ou senha inválidos." };
  }

  redirect("/dashboard");
}

export async function cadastrar(
  _prevState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = cadastroSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors };
  }

  const { nome, email, password } = validated.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { message: "Não foi possível criar a conta. Tente novamente." };
  }

  if (!data.user) {
    return {
      message:
        "Cadastro iniciado — verifique seu e-mail para confirmar a conta.",
    };
  }

  await db.insert(profiles).values({ id: data.user.id, nome });

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
