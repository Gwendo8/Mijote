import Puce from '../ui/Puce.jsx';

// Choix du créneau (Petit-déj, Midi…) : une rangée de puces, une seule active.
export default function ChoixCreneau({ slots, value, onChange }) {
  return (
    <div role="group" aria-label="Créneau" className="flex flex-wrap gap-2">
      {slots.map((slot) => (
        <Puce key={slot.id} actif={slot.id === value} onClick={() => onChange(slot.id)}>
          {slot.name}
        </Puce>
      ))}
    </div>
  );
}
