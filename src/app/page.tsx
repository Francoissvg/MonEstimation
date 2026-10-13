import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/etablissements");
  }

  return <LandingPage />;
}
