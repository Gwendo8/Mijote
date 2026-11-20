// Confirmation d'un enregistrement : tampon vert « ENREGISTRÉ » posé de travers, avec un message écrit.
// Jamais la couleur seule : le texte dit ce qui s'est passé.
export default function Confirmation({ children = 'Enregistré' }) {
  return (
    <p role="status" className="flex items-center gap-3 font-text text-lecture">
      <span
        aria-hidden="true"
        className="animate-tamponner inline-block rounded-coin border-2 border-vert px-2 py-1 text-mention font-extrabold uppercase tracking-[0.06em] text-vert"
      >
        Enregistré
      </span>
      <span>{children}</span>
    </p>
  );
}
