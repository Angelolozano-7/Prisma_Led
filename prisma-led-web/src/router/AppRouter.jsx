import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layouts
import Layout1 from '../layouts/Layout1';
import Layout2 from '../layouts/Layout2';
import Layout3 from '../layouts/Layout3';

// Páginas principales (sin layout o layout general)
import HomePage from '../pages/HomePage';


// Layout 1: flujo de autenticación
//clave: /auth
import Login from '../pages/Login';
import Recovery from '../pages/Recovery';
import LoginError from '../pages/Login_Error';


// Layout 2: funcionalidades del cliente autenticado
//clave: /cliente
import ClientHome from '../pages/Client_Home';
import EditarReserva from '../pages/Editar_Reserva';
import HistorialReservas from '../pages/Historial_Reservas';
import PreVisualizacion from '../pages/Pre_Visualizacion';
import Disponibilidad from '../pages/Disponibilidad';
import PreOrden from '../pages/Pre_Orden';
import PreOrdenDoc from '../pages/Pre_Orden_Doc';
import Reserva from '../pages/Reserva'; // Diferente de ReservaPage

// Layout 3: edición de cliente
//clave: /perfil    
import EditarCliente from '../pages/Editar_Cliente';
import Registro from '../pages/Registro';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rutas sin layout especial */}
        <Route path="/" element={<HomePage />} />

        {/* Layout 1: autenticación */}
        <Route path="/auth" element={<Layout1 />}>
          <Route path="login" element={<Login />} />
          <Route path="recovery" element={<Recovery />} />
          <Route path="login-error" element={<LoginError />} />
        </Route>

        {/* Layout 2: vistas de cliente */}
        <Route path="/cliente" element={<Layout2 />}>
          <Route index element={<ClientHome />} />
          <Route path="historial-reservas" element={<HistorialReservas />} />
          <Route path="pre-visualizacion" element={<PreVisualizacion />} />
          <Route path="disponibilidad" element={<Disponibilidad />} />
          <Route path="pre-orden" element={<PreOrden />} />
          <Route path="pre-orden-doc" element={<PreOrdenDoc />} />
          <Route path="reserva" element={<Reserva />} />
          <Route path="editar-reserva" element={<EditarReserva />} />
        </Route>

        {/* Layout 3: edición perfil */}
        <Route path="/perfil" element={<Layout3 />}>
          <Route path="editar" element={<EditarCliente />} />
          <Route path="registro" element={<Registro />} />
        </Route>


      </Routes>
    </BrowserRouter>
  );
}
