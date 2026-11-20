import { createContext } from 'react';

// Qui est connecté : { status: 'loading' | 'authenticated' | 'anonymous' | 'error', user, setUser, retry }
export const SessionContext = createContext(null);
