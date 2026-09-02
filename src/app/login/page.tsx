"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "./actions";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { SiteHeader } from "@/components/marketing/site-header";

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex-1 bg-brand-bg">
      <SiteHeader hide="login" />

      <div className="mx-auto w-full max-w-sm px-4 py-12">
        <h1 className="text-xl font-semibold tracking-tight text-brand-ink">Connexion</h1>
        <p className="mt-1 text-sm text-brand-muted">Accédez à vos établissements et vos recettes.</p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>

          {state.error ? <p className="text-sm text-brand-danger">{state.error}</p> : null}

          <button type="submit" disabled={pending} className={`w-full ${primaryButtonClass}`}>
            {pending ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-muted">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-brand-accent hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>

      <HowItWorksSection />
    </main>
  );
}
