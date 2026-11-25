import { NavLink } from 'react-router';
import { ShieldCheck, User } from 'lucide-react';
import { MAIN_NAV } from './navigation.js';
import Anneau from '../ui/Anneau.jsx';

const lien = ({ isActive }) =>
  `flex min-h-11.5 items-center gap-3 rounded-coin px-3 text-lecture font-semibold hover:bg-fond ${
    isActive ? '!bg-tomate-clair text-tomate-fonce' : 'text-encre-2'
  }`;

// Menu latéral du PC (1024 px et plus) : logo et entrées en haut ; administration, compte et
// mention des sources des données en bas.
export default function SideMenu({ isAdmin }) {
  return (
    <nav
      aria-label="Menu latéral"
      className="fixed inset-y-0 left-0 hidden w-62 flex-col border-r border-trait bg-surface px-4 py-6 lg:flex"
    >
      <p className="mb-5 flex items-center gap-2.5 px-2.5 pb-3 text-[24px] font-extrabold tracking-tight">
        <Anneau centre="vide" kcal={300} proteins={30} carbs={50} fats={12} taille={30} />
        Mijote
      </p>
      <ul className="flex flex-col gap-0.5">
        {MAIN_NAV.map(({ to, label, labelPc, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} className={lien}>
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              {labelPc ?? label}
            </NavLink>
          </li>
        ))}
      </ul>
      <ul className="mt-auto flex flex-col gap-0.5">
        {isAdmin && (
          <li>
            <NavLink to="/admin" className={lien}>
              <ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" />
              Administration
            </NavLink>
          </li>
        )}
        <li>
          <NavLink to="/profil" className={lien}>
            <User size={18} strokeWidth={1.8} aria-hidden="true" />
            Mon compte
          </NavLink>
        </li>
      </ul>
      <p className="mt-4 px-3 text-[12px] text-encre-2">
        Données : Ciqual (ANSES), Open Food Facts, USDA FoodData Central
      </p>
    </nav>
  );
}
