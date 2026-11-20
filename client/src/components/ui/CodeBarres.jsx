// Code-barres décoratif, en bas des tickets complets (DESIGN.md). Les largeurs de barres sont fixes.
const BARRES = [
  2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 1, 3, 2, 1, 4, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 4, 1, 2, 3, 1, 2, 1,
  1, 2, 3, 1, 4, 1, 2, 2, 1, 1, 3, 2, 1, 2, 4, 1, 1, 3, 1, 2, 1, 3, 2, 1, 1, 4, 1, 2, 2, 1, 3,
];

// Position de départ de chaque barre (calculée une fois)
const POSITIONS = BARRES.reduce(
  (acc, largeur, i) => [...acc, i === 0 ? 0 : acc[i - 1] + BARRES[i - 1]],
  [],
);
const TOTAL = POSITIONS[POSITIONS.length - 1] + BARRES[BARRES.length - 1];

export default function CodeBarres({ className = '' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${TOTAL} 34`}
      preserveAspectRatio="none"
      className={`mx-auto mt-5 h-8.5 w-50 fill-encre ${className}`}
    >
      {BARRES.map((largeur, i) =>
        i % 2 === 0 ? <rect key={i} x={POSITIONS[i]} y="0" width={largeur} height="34" /> : null,
      )}
    </svg>
  );
}
