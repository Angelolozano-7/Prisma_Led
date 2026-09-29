/**
 * Hook de acceso al AppDataContext.
 * Evita consumir directamente el contexto en cada componente.
 */

import { useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';

export const useAppData = () => useContext(AppDataContext);
