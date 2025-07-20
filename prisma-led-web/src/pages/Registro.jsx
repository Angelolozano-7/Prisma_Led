import { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/logo_prisma.png';
import VideoLoader from '../components/VideoLoader';
import Swal from 'sweetalert2';
import { useAppData } from '../hooks/useAppData';
import { postCiudad } from '../services/ciudadService';
import Select from 'react-select';





export default function Registro() {
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [otraCiudad, setOtraCiudad] = useState(false);
  const { ciudades, setDatos } = useAppData();
  const [ciudadesLocal, setCiudadesLocal] = useState([]);
  const opcionesCiudades = [
    ...ciudadesLocal.map(c => ({ label: c, value: c })),
    { label: 'Otra ciudad...', value: 'Otra ciudad...' }
  ];

  const [form, setForm] = useState({
    razon_social: '',
    nit: '',
    correo: '',
    ciudad: '',
    direccion: '',
    telefono: '',
    nombre_contacto: '',
    password: ''
  });

useEffect(() => {
  const fetchCiudades = async () => {
    try {
      const res = await api.get('/ciudades');
      setCiudadesLocal(res.data); // Asegúrate que el backend retorna un array de strings
    } catch (error) {
      console.error("Error al cargar ciudades:", error);
    }
  };

  fetchCiudades();
}, []);
  

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validarFormulario = () => {
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nitRegex = /^\d+-?\d$/;
    const telefonoRegex = /^\+?\d[\d\s]*$/;
    const passwordRegex = /^(?=.*[!@#$%^&*()_\-+=])(?=.{8,})/;

    if (!form.razon_social && !form.nit && !form.correo && !form.ciudad &&
        !form.direccion && !form.telefono && !form.nombre_contacto && !form.password) {
      return "Todos los campos son obligatorios";
    }

    if (!form.razon_social) return "La razón social es obligatoria";
    if (!form.nit) return "El NIT es obligatorio";
    if (!form.ciudad) return "La ciudad es obligatoria";
    if (!form.direccion) return "La dirección es obligatoria";
    if (!form.telefono) return "El teléfono es obligatorio";
    if (!form.nombre_contacto) return "El nombre de contacto es obligatorio";
    if (!form.password) return "La contraseña es obligatoria";
    if (form.razon_social.length < 3 || form.razon_social.length > 50) return "La razón social debe tener al menos 3 caracteres y máximo 50";
    if (!nitRegex.test(form.nit)) return "El NIT debe contener solo números y puede tener un '-' antes del último dígito";
    if( form.nit.length != 11) return "El NIT debe tener 9 digitos + el digito verificador, 000000000-1";
    if (!correoRegex.test(form.correo)) return "El correo no tiene un formato válido";    
    if (form.correo.length < 5 || form.correo.length > 50) return "El correo debe tener al menos 5 caracteres y máximo 50";
    if (form.ciudad.length < 3 || form.ciudad.length > 15 ) return "La ciudad debe tener al menos 3 caracteres y máximo 15";
    if (form.direccion.length < 5 || form.direccion.length > 100) return "La dirección debe tener al menos 5 caracteres y máximo 100";
    if (!telefonoRegex.test(form.telefono)) return "El teléfono debe contener solo números, puede iniciar con '+' y contener espacios";
    if (form.telefono.length < 7 || form.telefono.length > 15) return "El teléfono debe tener entre 7 y 15 dígitos";
    if (form.nombre_contacto.length < 3 || form.nombre_contacto.length > 50) return "El nombre de contacto debe tener al menos 3 caracteres y máximo 50";
    if (!telefonoRegex.test(form.telefono)) return "El teléfono debe contener solo números, puede iniciar con '+' y contener espacios";
    if (form.telefono.length < 7 || form.telefono.length > 15) return "El teléfono debe tener entre 7 y 15 dígitos";
    if (form.nombre_contacto.length < 3 || form.nombre_contacto.length > 50) return "El nombre de contacto debe tener al menos 3 caracteres y máximo 50";
    if (!passwordRegex.test(form.password) ||  form.password.length > 20 ) return "La contraseña debe tener al menos 8 y maximo 20 caracteres y un carácter especial (!@#$%^&*()_\\-+=)";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setCargando(true);

    const error = validarFormulario();
    if (error) {
      setMensaje(error);
      setCargando(false);
      await Swal.fire({
        title: 'Error de validación',
        text: error,
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const payload = { ...form };

    try {
      if (otraCiudad && form.ciudad.trim()) {
        try {
          await postCiudad(form.ciudad.trim());
          setDatos(prev => ({
            ...prev,
            ciudades: [...prev.ciudades, form.ciudad.trim()]
          }));
        } catch (err) {
          console.error("Error registrando ciudad nueva:", err);
        }
      }

      const res = await api.post('/auth/register', payload);
      localStorage.setItem('token', res.data.access_token);

      await Swal.fire({
        title: '¡Registro exitoso!',
        text: 'Tu cuenta ha sido creada correctamente.',
        icon: 'success',
        confirmButtonText: 'Iniciar sesión'
      });

      navigate('/auth/login');
    } catch (error) {
      const msg = error.response?.data?.msg || 'Error al registrar';
      await Swal.fire({
        title: 'Error al registrar',
        text: msg,
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <VideoLoader />;
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Columna izquierda */}
      <div className="space-y-4 border border-gray-200 p-4 rounded">
        <h2 className="text-lg font-semibold">Registro</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Razón Social</label>
          <input name="razon_social" type="text" value={form.razon_social} onChange={handleChange}
            className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nit</label>
          <input name="nit" type="text" value={form.nit} onChange={handleChange}
            className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Correo electrónico</label>
          <input name="correo" type="email" value={form.correo} onChange={handleChange}
            className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ciudad</label>
          <Select
            options={opcionesCiudades}
            value={opcionesCiudades.find(opt => opt.value === form.ciudad) || null}
            onChange={(e) => {
              if (e.value === "Otra ciudad...") {
                setOtraCiudad(true);
                setForm({ ...form, ciudad: '' });
              } else {
                setOtraCiudad(false);
                setForm({ ...form, ciudad: e.value });
              }
            }}
            placeholder="Seleccione una ciudad"
            className="w-full"
            isSearchable
          />
        </div>

        {otraCiudad && (
          <div>
            <label className="block text-sm font-medium mb-1">Otra ciudad</label>
            <input
              name="ciudad"
              type="text"
              value={form.ciudad}
              onChange={handleChange}
              placeholder="Escribe tu ciudad"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        )}


        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <input name="direccion" type="text" value={form.direccion} onChange={handleChange}
            className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input name="telefono" type="text" value={form.telefono} onChange={handleChange}
            className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nombre de contacto</label>
          <input name="nombre_contacto" type="text" value={form.nombre_contacto} onChange={handleChange}
            className="w-full border rounded px-3 py-2" />
        </div>
      </div>

      {/* Columna derecha */}
      <div className="space-y-4 border border-gray-200 p-4 rounded h-fit flex flex-col items-center">
        <img src={logo} alt="Logo PrismaLED" className="h-16 sm:h-20 mb-2" />
        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              className="w-full border rounded px-3 py-2" />
          </div>

          <button type="submit"
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
            Registrarse
          </button>

          <button type="button"
            onClick={() => navigate('/auth/login')}
            className="w-full bg-gray-300 text-black py-2 rounded hover:bg-gray-400">
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}
