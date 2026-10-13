import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getEstablishment } from "@/lib/establishment.server";
import { getVocabulary } from "@/lib/vocabulary";
import { Sidebar } from "./sidebar";
import { HelpLink } from "@/components/help-link";
import { VocabularyProvider } from "@/components/vocabulary-provider";

export default async function EstablishmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const establishment = await getEstablishment(id);

  if (!establishment) {
    notFound();
  }

  return (
    <VocabularyProvider vocabulary={getVocabulary(establishment.type)}>
      <div className="flex min-h-screen w-full flex-1 flex-col lg:flex-row">
        <Sidebar
          establishmentId={establishment.id}
          nom={establishment.nom}
          type={establishment.type}
          email={user.email ?? ""}
        />
        <div className="min-w-0 flex-1 bg-brand-bg">
          {/* Sur téléphone, l'aide est dans le menu en tiroir. */}
          <div className="hidden justify-end border-b border-brand-line/70 bg-brand-bg px-6 py-2 print:hidden lg:flex">
            <HelpLink />
          </div>
          {children}
        </div>
      </div>
    </VocabularyProvider>
  );
}
