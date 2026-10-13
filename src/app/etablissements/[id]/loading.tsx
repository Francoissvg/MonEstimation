// Affiché instantanément pendant le chargement d'une page de l'établissement : le menu
// reste en place et l'utilisateur voit tout de suite que son clic a été pris en compte.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10" aria-busy="true">
      <span className="sr-only">Chargement…</span>
      <div className="h-7 w-48 animate-pulse rounded-lg bg-brand-line/60" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-brand-line/40" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-brand-line/40" />
        ))}
      </div>
      <div className="mt-6 h-64 animate-pulse rounded-2xl bg-brand-line/30" />
    </main>
  );
}
