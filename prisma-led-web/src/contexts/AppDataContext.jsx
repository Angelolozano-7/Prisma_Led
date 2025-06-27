import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { getUserFromToken } from '../services/decodeToken';

const AppDataContext = createContext();

export const AppDataProvider = ({ children }) => {
  const [datos, setDatos] = useState({
    tarifas: [],
    pantallas: [],
    categorias: [],
    cliente: null
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      const user = getUserFromToken();
      if (!user?.id) {
        setLoading(false);
        return; // No cargar si no hay usuario
      }

      try {
        const [tarifasRes, pantallasRes, categoriasRes, clienteRes] = await Promise.all([
          api.get('/tarifas'),
          api.get('/pantallas'), // debes tener este endpoint
          api.get('/categorias'),
          api.get('/cliente')
        ]);
        console.log('Datos cargados: ');
        setDatos({
          tarifas: tarifasRes.data || [],
          pantallas: pantallasRes.data || [],
          categorias: categoriasRes.data || [],
          cliente: clienteRes.data || null
        });
      } catch (error) {

        console.error('Error al cargar datos globales:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  return (
    <AppDataContext.Provider value={{ ...datos, loading, setDatos }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
