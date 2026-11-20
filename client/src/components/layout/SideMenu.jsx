import { NavLink } from 'react-router';
import { ShieldCheck, User } from 'lucide-react';
import { MAIN_NAV } from './navigation.js';

const lien = ({ isActive }) =>
  `flex min-h-10 items-center gap-3 rounded-coin px-3 text-ui font-bold ${
    isActive ? 'bg-encre text-papier' : 'text-encre-2'
  }`;

// Menu latéral du PC (1024 px et plus) : logo et entrées en haut ; administration, compte et
// mention des sources des données en bas.
export default function SideMenu({ isAdmin }) {
  return (
    <nav
      aria-label="Menu latéral"
      className="fixed inset-y-0 left-0 hidden w-55 flex-col border-r-[1.5px] border-dashed border-encre bg-papier px-3.5 py-6 lg:flex"
    >
      <p className="largeur-large mb-5 px-2.5 text-ecran font-extrabold">Mijote</p>
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
      <p className="mt-4 px-3 text-[10px] text-encre-2">
        Données : Ciqual (ANSES), Open Food Facts
      </p>
    </nav>
  );
}
