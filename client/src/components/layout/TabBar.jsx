import { NavLink } from 'react-router';
import { MAIN_NAV } from './navigation.js';

// Barre d'onglets du téléphone et de la tablette (cachée à partir de 1024 px, où le menu latéral prend le relais).
export default function TabBar() {
  return (
    <nav
      aria-label="Onglets"
      className="fixed inset-x-0 bottom-0 z-40 flex gap-0.5 border-t border-trait bg-surface px-1.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      {MAIN_NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-coin text-[11px] font-semibold ${
              isActive ? 'text-tomate' : 'text-encre-2'
            }`
          }
        >
          <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
