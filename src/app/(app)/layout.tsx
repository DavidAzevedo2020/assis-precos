import Link from "next/link";
import { FileText, LayoutDashboard, LogOut } from "lucide-react";
import { getProfile } from "@/lib/dal";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <FileText className="size-5" />
            Assis Preços
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <LayoutDashboard className="size-4" />
              Processos
            </Link>
            {profile?.nome && (
              <span className="text-sm text-muted-foreground">{profile.nome}</span>
            )}
            <form action={logout}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="size-4" />
                Sair
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4">{children}</main>
    </div>
  );
}
