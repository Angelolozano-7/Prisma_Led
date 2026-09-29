/**
 * Contexto global de datos maestros y del cliente.
 *
 * Carga tarifas, pantallas, categorías, cliente y ciudades cuando existe una
 * sesión válida, y mantiene estos datos disponibles para toda la aplicación.
 */

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

  const syncToken = () => {
    setToken(localStorage.getItem('token'));
  };

  useEffect(() => {
    syncToken();
  }, []);

  useEffect(() => {
    const cargarDatos = async () => {
      const user = getUserFromToken();
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const [tarifasRes, pantallasRes, categoriasRes, clienteRes,ciudadesRes] = await Promise.all([
          api.get('/tarifas'),
          api.get('/pantallas'),
          api.get('/categorias'),
          api.get('/cliente'),
          api.get('/ciudades'),
        ]);
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
