import { useId, useState } from 'react';
import { TicketLigne, TicketPartie, TicketTotal } from '../ui/Ticket.jsx';
import { formatGrammes, formatKcal, parseDecimal, portionValues } from '../../utils/foods.js';

// « Pour une portion » : on tape des grammes, les calories et les protéines se calculent.
export default function CalculPortion({ food, initial = '100' }) {
  const id = useId();
  const [text, setText] = useState(initial);
  const { kcal, proteinsG } = portionValues(food, parseDecimal(text) ?? NaN);

  return (
    <>
      <TicketPartie>Pour une portion</TicketPartie>
      <div className="my-2 flex items-center gap-2.5">
        <label htmlFor={id} className="sr-only">
          Poids de la portion, en grammes
        </label>
        <input
          id={id}
          value={text}
          onChange={(event) => setText(event.target.value)}
          inputMode="decimal"
          autoComplete="off"
          className="min-h-11 w-24 rounded-coin border-[1.5px] border-trait bg-surface px-3 font-heading text-lecture text-encre focus:border-2 focus:border-focus lg:text-ui"
        />
        <span aria-hidden="true" className="text-ui text-encre-2">
          g
        </span>
      </div>
      <div aria-live="polite">
        <TicketTotal libelle="Total" valeur={formatKcal(kcal === null ? null : Math.round(kcal))} />
        <TicketLigne
          nom="dont protéines"
          valeur={formatGrammes(proteinsG === null ? null : Math.round(proteinsG * 10) / 10)}
        />
      </div>
    </>
  );
}
