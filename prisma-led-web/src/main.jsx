/**
 * Punto de entrada principal para la aplicación React de prisma-led-web.
 *
 * Renderiza el componente AppRouter dentro de React.StrictMode y aplica los estilos globales.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './router/AppRouter';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
