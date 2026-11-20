import { Outlet } from 'react-router';

// Cadre des écrans publics (connexion, inscription, mot de passe) : un ticket centré sur le comptoir.
export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-comptoir px-4 py-8 text-encre">
      <div className="mx-auto w-full max-w-md">
        <Outlet />
      </div>
    </main>
  );
}
