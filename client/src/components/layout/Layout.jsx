import { Outlet } from 'react-router';
import { useSession } from '../../hooks/auth/useSession.js';
import SideMenu from './SideMenu.jsx';
import TabBar from './TabBar.jsx';

// Cadre des écrans connectés : onglets en bas sur téléphone, menu latéral sur PC.
// Chaque écran pose son propre titre avec EnTetePage (bouton du compte inclus sur téléphone).
export default function Layout() {
  const { user } = useSession();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-fond text-encre">
      <SideMenu isAdmin={isAdmin} />
      <main className="mx-auto max-w-360 px-4 pt-13 pb-28 md:max-w-180 lg:max-w-300 lg:px-8 lg:pt-8 lg:pb-10 lg:[margin-left:max(15.5rem,calc((100vw-18.75rem)/2-37.5rem+15.5rem))]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
