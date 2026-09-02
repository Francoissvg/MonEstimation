import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";
import { HelpLink } from "@/components/help-link";

export default async function EstablishmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: establishment } = await supabase
    .from("establishments")
    .select("id, nom, type")
    .eq("id", id)
    .single();

  if (!establishment) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-1">
      <Sidebar
        establishmentId={establishment.id}
        nom={establishment.nom}
        type={establishment.type}
        email={user.email ?? ""}
      />
      <div className="flex-1 bg-brand-bg">
        <div className="flex justify-end border-b border-brand-line/70 bg-brand-bg px-6 py-2 print:hidden">
          <HelpLink />
        </div>
        {children}
      </div>
    </div>
  );
}
