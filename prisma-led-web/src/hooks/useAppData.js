import { useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext';

export const useAppData = () => useContext(AppDataContext);
