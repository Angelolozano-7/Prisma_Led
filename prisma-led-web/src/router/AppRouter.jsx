import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PageLoaderWrapper from '../components/PageLoaderWrapper';

// Layouts
import Layout1 from '../layouts/Layout1';
import Layout2 from '../layouts/Layout2';
import Layout3 from '../layouts/Layout3';

// Páginas principales
import HomePage from '../pages/HomePage';

// Layout 1: autenticación
import Login from '../pages/Login';
import Recovery from '../pages/Recovery';

// Layout 2: cliente autenticado
import ClientHome from '../pages/Client_Home';
import EditarReserva from '../pages/Editar_Reserva';
import HistorialReservas from '../pages/Historial_Reservas';
import PreVisualizacion from '../pages/Pre_Visualizacion';
import Disponibilidad from '../pages/Disponibilidad';
import PreOrden from '../pages/Pre_Orden';
import PreOrdenDoc from '../pages/Pre_Orden_Doc';
import Reserva from '../pages/Reserva';

// Layout 3: edición perfil
import EditarCliente from '../pages/Editar_Cliente';
import Registro from '../pages/Registro';

//  Ruta protegida
import PrivateRoute from '../components/PrivateRoute';

export default function AppRouter() {
  return (
    <BrowserRouter>
      
        <Routes>

          {/* Rutas públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<Layout1 />}>
            <Route path="login" element={<Login />} />
            <Route path="recovery" element={<Recovery />} />
          </Route>
          <Route path="/auth" element={<Layout3 />}>
            <Route path="registro" element={<Registro />} />
          </Route>

          {/* Rutas protegidas con Layout2 */}
          <Route
            path="/cliente"
            element={
              <PrivateRoute>
                <Layout2 />
              </PrivateRoute>
            }
          >
            <Route index element={<ClientHome />} />
            <Route path="historial-reservas" element={<HistorialReservas />} />
            <Route path="pre-visualizacion" element={<PreVisualizacion />} />
            <Route path="disponibilidad" element={<Disponibilidad />} />
            <Route path="pre-orden" element={<PreOrden />} />
            <Route path="pre-orden-doc" element={<PreOrdenDoc />} />
            <Route path="reserva" element={<Reserva />} />
            <Route path="editar-reserva" element={<EditarReserva />} />
          </Route>

          {/* Rutas protegidas con Layout3 */}
          <Route
            path="/perfil"
            element={
              <PrivateRoute>
                <Layout3 />
              </PrivateRoute>
            }
          >
            <Route path="editar" element={<EditarCliente />} />
          </Route>

        </Routes>
      
    </BrowserRouter>
  );
}
