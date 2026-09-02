"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "../login/actions";
import { inputClass, labelClass, primaryButtonClass } from "@/lib/ui";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { SiteHeader } from "@/components/marketing/site-header";

const initialState: AuthState = { error: null };

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <main className="flex-1 bg-brand-bg">
      <SiteHeader hide="signup" />

      <div className="mx-auto w-full max-w-sm px-4 py-12">
        <h1 className="text-xl font-semibold tracking-tight text-brand-ink">Créer un compte</h1>
        <p className="mt-1 text-sm text-brand-muted">Gratuit, quelques secondes suffisent.</p>

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
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-brand-muted">6 caractères minimum.</p>
          </div>

          {state.error ? <p className="text-sm text-brand-danger">{state.error}</p> : null}

          <button type="submit" disabled={pending} className={`w-full ${primaryButtonClass}`}>
            {pending ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-muted">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-brand-accent hover:underline">
            Se connecter
          </Link>
        </p>
      </div>

      <HowItWorksSection />
    </main>
  );
}
