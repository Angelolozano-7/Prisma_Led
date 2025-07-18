import { createContext, useEffect, useState } from 'react';
import api from '../services/api';
import { getUserFromToken } from '../services/decodeToken';

export const AppDataContext = createContext();

export const AppDataProvider = ({ children }) => {
  const [datos, setDatos] = useState({
    tarifas: [],
    pantallas: [],
    categorias: [],
    cliente: null,
    ciudades: []
  });

  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token')); // token reactivo

  // Escuchar cambios en localStorage (todas las pestañas)
  useEffect(() => {
    const handleStorage = () => {
      const newToken = localStorage.getItem('token');
      setToken(newToken);
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // También sincronizar el token al montar
  const syncToken = () => {
    setToken(localStorage.getItem('token'));
  };

  useEffect(() => {
    syncToken();
  }, []);

  // Cargar datos cuando cambia el token
  useEffect(() => {
    const cargarDatos = async () => {
      const user = getUserFromToken();
      if (!user?.id) {
        setLoading(false);
        return; // No cargar si no hay usuario
      }

      try {
        const [tarifasRes, pantallasRes, categoriasRes, clienteRes,ciudadesRes] = await Promise.all([
          api.get('/tarifas'),
          api.get('/pantallas'),
          api.get('/categorias'),
          api.get('/cliente'),
          api.get('/ciudades'),
        ]);
        console.log('Datos cargados:');
        setDatos({
          tarifas: tarifasRes.data || [],
          pantallas: pantallasRes.data || [],
          categorias: categoriasRes.data || [],
          cliente: clienteRes.data || null,
          ciudades: ciudadesRes.data || []
        });
      } catch (error) {
        console.error('Error al cargar datos globales:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [token]);

  const agregarCiudad = (nuevaCiudad) => {
    setDatos(prev => ({
      ...prev,
      ciudades: [...prev.ciudades, nuevaCiudad]
    }));
  };
  
  return (
    <AppDataContext.Provider value={{ ...datos, loading, setDatos, agregarCiudad  }}>
      {children}
    </AppDataContext.Provider>
  );
};
