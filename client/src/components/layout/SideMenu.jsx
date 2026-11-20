import { NavLink } from 'react-router';
import { ShieldCheck, User } from 'lucide-react';
import { MAIN_NAV } from './navigation.js';

// Menu latéral du PC (1024 px et plus) : logo, entrées, compte, admin, et la mention des sources des données.
export default function SideMenu({ isAdmin }) {
  const entries = [
    ...MAIN_NAV,
    { to: '/profil', label: 'Compte', icon: User },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  return (
    <nav
      aria-label="Menu latéral"
      className="fixed inset-y-0 left-0 hidden w-55 flex-col border-r-[1.5px] border-dashed border-encre bg-papier px-3 py-6 lg:flex"
    >
      <p className="largeur-large mb-6 px-3 text-ticket-titre-pc font-extrabold">Mijote</p>
      <ul className="flex flex-col gap-1">
        {entries.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-coin px-3 font-bold ${
                  isActive ? 'bg-encre text-papier' : 'text-encre'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <p className="mt-auto px-3 font-text text-ui text-encre-2">
        Données : Ciqual (ANSES), Open Food Facts
      </p>
    </nav>
  );
}
