import { Apple, BookOpen, Calendar, Lightbulb } from 'lucide-react';

// Pas d'onglet « Courses » tant que la liste de courses n'existe pas (choix de l'utilisatrice).
// Entrées de la navigation, communes à la barre d'onglets (téléphone) et au menu latéral (PC).
// `labelPc` : le menu du PC a la place d'écrire le nom en entier.
export const MAIN_NAV = [
  { to: '/recettes', label: 'Recettes', icon: BookOpen },
  { to: '/idees', label: 'Idées', labelPc: 'Idées de plats', icon: Lightbulb },
  { to: '/planning', label: 'Planning', icon: Calendar },
  { to: '/aliments', label: 'Aliments', icon: Apple },
];
