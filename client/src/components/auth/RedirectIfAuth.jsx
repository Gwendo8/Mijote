import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../../hooks/auth/useSession.js';
import Chargement from '../ui/Chargement.jsx';

// Barrière des écrans publics : déjà connecté, on file vers l'appli.
export default function RedirectIfAuth() {
  const { status } = useSession();
  const location = useLocation();
  if (status === 'loading') return <Chargement />;
  if (status === 'authenticated') return <Navigate to={location.state?.from ?? '/'} replace />;
  return <Outlet />;
}
