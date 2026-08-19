/**
 * Marca do FloodGuard: escudo (proteção civil) com a lâmina d'água dentro.
 * Mesmo desenho do favicon em index.html — se um mudar, mudar o outro.
 * `currentColor` para herdar a cor de quem usa.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <path
        d="M16 3 5 7.5V16c0 7 4.8 11.4 11 13 6.2-1.6 11-6 11-13V7.5L16 3z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 17.5c2.2 0 2.2 2.2 4.3 2.2s2.2-2.2 4.3-2.2 2.2 2.2 4.3 2.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
