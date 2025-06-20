import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo_prisma.png';
import api from '../services/api';
import { getUserFromToken } from '../services/decodeToken';

export default function Editar_Cliente() {
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState('');
  const [otraCiudad, setOtraCiudad] = useState(false);
  const [form, setForm] = useState({
    razon_social: '',
    nit: '',
    correo: '',
    ciudad: '',
    direccion: '',
    telefono: '',
    nombre_contacto: '',
    usuario: '',
    password: ''
  });

  const ciudadesColombia = [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta",
    "Bucaramanga", "Soacha", "Ibagué", "Villavicencio", "Santa Marta",
    "Pereira", "Manizales", "Neiva", "Armenia", "Otra ciudad..."
  ];

  useEffect(() => {
    const user = getUserFromToken();
    if (user && user.id) {
      api.get(`/auth/usuario/${user.id}`)
        .then(res => {
          const data = res.data;
          setForm(prev => ({
            ...prev,
            razon_social: data.razon_social || '',
            nit: data.nit || '',
            correo: data.correo || '',
            ciudad: ciudadesColombia.includes(data.ciudad) ? data.ciudad : '',
            direccion: data.direccion || '',
            telefono: data.telefono || '',
            nombre_contacto: data.nombre || '',
            usuario: data.correo || ''
          }));
          if (!ciudadesColombia.includes(data.ciudad)) {
            setOtraCiudad(true);
            setForm(prev => ({ ...prev, ciudad: data.ciudad }));
          }
        })
        .catch(() => setMensaje('No se pudo cargar la información del usuario'));
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validarFormulario = () => {
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nitRegex = /^\d+-?\d$/;
    const telefonoRegex = /^\+?\d[\d\s]*$/;
    const passwordRegex = /^(?=.*[!@#$%^&*()_\-+=])(?=.{8,})/;

    if (!form.razon_social || !form.nit || !form.correo || !form.ciudad ||
        !form.direccion || !form.telefono || !form.nombre_contacto) {
      return "Todos los campos son obligatorios";
    }

    if (!correoRegex.test(form.correo)) return "El correo no tiene un formato válido";
    if (!nitRegex.test(form.nit)) return "El NIT debe contener solo números y puede tener un '-' antes del último dígito";
    if (form.ciudad.length < 3) return "La ciudad debe tener al menos 3 caracteres";
    if (!telefonoRegex.test(form.telefono)) return "El teléfono debe contener solo números, puede iniciar con '+' y contener espacios";
    if (form.password && !passwordRegex.test(form.password)) return "La contraseña debe tener al menos 8 caracteres y un carácter especial";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    const error = validarFormulario();
    if (error) return setMensaje(error);

    const user = getUserFromToken();
    const payload = {
      razon_social: form.razon_social,
      nit: form.nit,
      correo: form.correo,
      ciudad: form.ciudad,
      direccion: form.direccion,
      telefono: form.telefono,
      nombre_contacto: form.nombre_contacto
    };

    if (form.password.trim()) payload.password = form.password;

    try {
      await api.put(`/cliente/${user.id}`, payload);
      setMensaje('Datos actualizados correctamente');
      setTimeout(() => navigate('/cliente'), 2000);
    } catch (error) {
      setMensaje('Error al actualizar los datos');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Columna izquierda */}
      <div className="space-y-4 border border-gray-200 p-4 rounded">
        <div><label className="block text-sm font-medium mb-1">Razón Social</label>
          <input name="razon_social" type="text" value={form.razon_social} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div><label className="block text-sm font-medium mb-1">Nit</label>
          <input name="nit" type="text" value={form.nit} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div><label className="block text-sm font-medium mb-1">Correo electrónico</label>
          <input name="correo" type="email" value={form.correo} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div><label className="block text-sm font-medium mb-1">Ciudad</label>
          <select name="ciudad" className="w-full border border-gray-300 rounded px-3 py-2"
            value={ciudadesColombia.includes(form.ciudad) ? form.ciudad : "Otra ciudad..."}
            onChange={(e) => {
              if (e.target.value === "Otra ciudad...") {
                setOtraCiudad(true);
                setForm({ ...form, ciudad: '' });
              } else {
                setOtraCiudad(false);
                setForm({ ...form, ciudad: e.target.value });
              }
            }}
          >
            <option value="">Seleccione una ciudad</option>
            {ciudadesColombia.map((ciudad, idx) => (
              <option key={idx} value={ciudad}>{ciudad}</option>
            ))}
          </select>
        </div>

        {otraCiudad && (
          <div>
            <label className="block text-sm font-medium mb-1">Otra ciudad</label>
            <input name="ciudad" type="text" value={form.ciudad} onChange={handleChange} placeholder="Escribe tu ciudad" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
        )}

        <div><label className="block text-sm font-medium mb-1">Dirección</label>
          <input name="direccion" type="text" value={form.direccion} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div><label className="block text-sm font-medium mb-1">Teléfono de contacto</label>
          <input name="telefono" type="text" value={form.telefono} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div><label className="block text-sm font-medium mb-1">Nombre de contacto</label>
          <input name="nombre_contacto" type="text" value={form.nombre_contacto} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
      </div>

      {/* Columna derecha */}
      <div className="space-y-4 border border-gray-200 p-4 rounded h-fit flex flex-col items-center">
        <img src={logo} alt="Logo PrismaLED" className="h-16 sm:h-20 mb-2" />
        <div className="w-full space-y-4">
          <div><label className="block text-sm font-medium mb-1">Usuario</label>
            <input type="text" value={form.usuario} disabled className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100" />
          </div>
          <div><label className="block text-sm font-medium mb-1">Nueva contraseña</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Solo si deseas cambiarla" className="w-full border border-gray-300 rounded px-3 py-2" />
          </div>
          <button type="submit" className="w-full bg-black text-white py-2 rounded hover:bg-gray-800">
            Modificar
          </button>
          <button
            type="button"
            onClick={() => navigate('/cliente')}
            className="w-full bg-violeta-medio text-white py-2 rounded hover:bg-violeta-oscuro transition"
          >
            Regresar sin cambios
          </button>
          {mensaje && <p className="text-sm text-center text-red-600 mt-2">{mensaje}</p>}
        </div>
      </div>
    </form>
  );
}
