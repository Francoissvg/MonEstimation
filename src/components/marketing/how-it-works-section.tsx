import { STEPS } from "./steps";

// Section "Comment ça marche" : utilisée telle quelle sur la page d'accueil
// (ancre #comment-ca-marche) et sur les pages de connexion / inscription, pour
// que le contenu reste strictement identique partout où il apparaît.
export function HowItWorksSection() {
  return (
    <section id="comment-ca-marche" className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">Déroulement</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">Comment ça marche</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-brand-muted">
          Cinq étapes, dans l&apos;ordre où vous les utilisez au quotidien.
        </p>
      </div>

      <div className="mt-12 space-y-16">
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className={`flex flex-col items-center gap-8 lg:flex-row lg:gap-14 ${
              i % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            <div className="w-full lg:w-1/2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent text-sm font-semibold text-white">
                {step.n}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-brand-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">{step.body}</p>
            </div>
            <div className="w-full lg:w-1/2">
              <step.Mockup />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
