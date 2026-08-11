export function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-6 text-center gap-4">
      <h1 className="text-4xl font-bold">FloodGuard</h1>
      <p className="text-lg text-slate-300 max-w-2xl">
        Plataforma GovTech B2G de apoio à tomada de decisão da Defesa Civil em
        eventos de alagamento e inundação, com piloto em Blumenau/SC.
      </p>
      <p className="text-sm text-slate-500 max-w-xl">
        Prova de conceito software-only e hardware-agnóstica. Não substitui a
        Defesa Civil.
      </p>
    </div>
  );
}
