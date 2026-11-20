import { Apple, BookOpen, Calendar, Lightbulb } from 'lucide-react';

// Entrées de la navigation, communes à la barre d'onglets (téléphone) et au menu latéral (PC).
// « Courses » viendra avec la liste de courses (cachée d'ici là).
export const MAIN_NAV = [
  { to: '/recettes', label: 'Recettes', icon: BookOpen },
  { to: '/idees', label: 'Idées', icon: Lightbulb },
  { to: '/planning', label: 'Planning', icon: Calendar },
  { to: '/aliments', label: 'Aliments', icon: Apple },
];
