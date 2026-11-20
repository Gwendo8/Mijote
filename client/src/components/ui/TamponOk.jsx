// Tampon « OK envoyé » : anneau gris, cercle vert au centre, posé de travers. Confirme l'envoi d'un e-mail.
export default function TamponOk() {
  return (
    <span
      aria-hidden="true"
      className="animate-tamponner flex size-14 shrink-0 items-center justify-center rounded-full bg-pointilles"
    >
      <span className="largeur-etroite flex size-10 flex-col items-center justify-center rounded-full border-2 border-vert bg-papier leading-none font-extrabold text-vert">
        <span className="text-libelle">OK</span>
        <span className="text-[8px] font-bold">envoyé</span>
      </span>
    </span>
  );
}
