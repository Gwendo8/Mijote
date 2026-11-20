import { createBrowserRouter, Navigate } from 'react-router';
import RedirectIfAuth from './components/auth/RedirectIfAuth.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';
import SessionProvider from './components/auth/SessionProvider.jsx';
import AuthLayout from './components/layout/AuthLayout.jsx';
import Layout from './components/layout/Layout.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import AlimentFormPage from './pages/foods/AlimentFormPage.jsx';
import AlimentPage from './pages/foods/AlimentPage.jsx';
import AlimentsPage from './pages/foods/AlimentsPage.jsx';
import RecetteFormPage from './pages/recipes/RecetteFormPage.jsx';
import RecettePage from './pages/recipes/RecettePage.jsx';
import RecettesPage from './pages/recipes/RecettesPage.jsx';
import NotFoundPage from './pages/not-found/NotFoundPage.jsx';
import PlaceholderPage from './pages/placeholder/PlaceholderPage.jsx';
import ProfilePage from './pages/profile/ProfilePage.jsx';

// Toutes les pages de l'application. Ajouter une route = ajouter une entrée dans children.
// SessionProvider est à la racine : toute l'appli sait qui est connecté.
export const routes = [
  {
    element: <SessionProvider />,
    children: [
      // Écrans publics (déjà connecté : on file vers l'appli)
      {
        element: <RedirectIfAuth />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: '/connexion', element: <LoginPage /> },
              { path: '/inscription', element: <RegisterPage /> },
              { path: '/mot-de-passe-oublie', element: <ForgotPasswordPage /> },
            ],
          },
        ],
      },
      // Le lien reçu par e-mail marche connecté ou non
      {
        element: <AuthLayout />,
        children: [{ path: '/mot-de-passe', element: <ResetPasswordPage /> }],
      },
      // Écrans connectés
      {
        element: <RequireAuth />,
        children: [
          {
            element: <Layout />,
            children: [
              { path: '/', element: <Navigate to="/recettes" replace /> },
              { path: '/recettes', element: <RecettesPage /> },
              { path: '/recettes/importer', element: <RecettesPage mode="importer" /> },
              { path: '/recettes/nouveau', element: <RecetteFormPage /> },
              { path: '/recettes/:id', element: <RecettePage /> },
              { path: '/recettes/:id/modifier', element: <RecetteFormPage /> },
              { path: '/idees', element: <PlaceholderPage titre="Idées" /> },
              { path: '/planning', element: <PlaceholderPage titre="Planning" /> },
              { path: '/aliments', element: <AlimentsPage /> },
              { path: '/aliments/nouveau', element: <AlimentFormPage /> },
              { path: '/aliments/:id', element: <AlimentPage /> },
              { path: '/aliments/:id/modifier', element: <AlimentFormPage /> },
              { path: '/profil', element: <ProfilePage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
      // Administration (réservée aux admins)
      {
        element: <RequireAuth admin />,
        children: [
          {
            element: <Layout />,
            children: [{ path: '/admin', element: <PlaceholderPage titre="Administration" /> }],
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
