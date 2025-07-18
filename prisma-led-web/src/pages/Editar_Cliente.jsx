import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo_prisma.png';
import api from '../services/api';
import { useAppData } from '../hooks/useAppData';
import { postCiudad } from '../services/ciudadService';
import Swal from 'sweetalert2';
import Select from 'react-select';


export default function Editar_Cliente() {
  const { ciudades} = useAppData();
  const opcionesCiudades = [
    ...ciudades.map(c => ({ label: c, value: c })),
    { label: 'Otra ciudad...', value: 'Otra ciudad...' }
  ];
  const navigate = useNavigate();
  const { cliente, setDatos } = useAppData();
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

  useEffect(() => {
    if (cliente) {
      setForm({
        razon_social: cliente.razon_social || '',
        nit: String(cliente.nit) || '',
        correo: cliente.correo || '',
        ciudad: cliente.ciudad || '',
        direccion: cliente.direccion || '',
        telefono: String(cliente.telefono) || '',
        nombre_contacto: cliente.nombre_contacto || '',
        usuario: cliente.correo || '',
        password: ''
      });
    }
  }, [cliente]);

 useEffect(() => {
    if (cliente && cliente.ciudad && !ciudades.includes(cliente.ciudad)) {
      setOtraCiudad(true);
    } else {
      setOtraCiudad(false);
    }
  }, [cliente, ciudades]);




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
    if (form.razon_social.length < 3 || form.razon_social.length > 50) return "La razón social debe tener al menos 3 caracteres y máximo 50";
    if (!nitRegex.test(form.nit)) return "El NIT debe contener solo números y puede tener un '-' antes del último dígito";
    console.log(form.nit.length);
    if( form.nit.length != 9) return "El NIT debe tener 9 digitos";
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
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    const error = validarFormulario();
      if (error) {
        setMensaje(error);
        await Swal.fire({
          title: 'Error de validación',
          text: error,
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
        return;
      }


    const payload = {
      razon_social: form.razon_social,
      nit: String(form.nit),
      correo: form.correo,
      ciudad: form.ciudad,
      direccion: form.direccion,
      telefono: String(form.telefono),
      nombre_contacto: form.nombre_contacto
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }
    console.log("payload" , payload);
    try {
      if (otraCiudad && form.ciudad.trim()) {
        try {
          await postCiudad(form.ciudad.trim());

          // Actualizar context para que la ciudad aparezca inmediatamente
          setDatos(prev => ({
            ...prev,
            ciudades: [...prev.ciudades, form.ciudad.trim()]
          }));
        } catch (error) {
          console.error("Error al registrar nueva ciudad", error);
        }
      }

      await api.put(`/cliente`, payload);
      const refreshed = await api.get('/cliente');
      setDatos((prev) => ({ ...prev, cliente: refreshed.data }));
      await Swal.fire({
              title: '¡Actualización exitosa!',
              text: 'Tu cuenta ha sido actualizada correctamente.',
              icon: 'success',
              confirmButtonText: 'Cerrar'
            });
      setTimeout(() => navigate('/cliente'), 2000);
    } catch (error) {
      const msg = error.response?.data?.msg || 'Error al registrar';
            await Swal.fire({
              title: 'Error al registrar',
              text: msg,
              icon: 'error',
              confirmButtonText: 'Cerrar'
            });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Columna izquierda */}
      <div className="space-y-4 border border-gray-200 p-4 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Razón Social</label>
          <input name="razon_social" type="text" value={form.razon_social} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nit</label>
          <input name="nit" type="text" value={form.nit} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Correo electrónico</label>
          <input name="correo" type="email" value={form.correo} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
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
          {otraCiudad && (
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">Otra ciudad</label>
              <input
                type="text"
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
                placeholder="Escribe tu ciudad"
                className="w-full border rounded px-3 py-2"
              />
            </div>
          )}



        </div>

        
        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <input name="direccion" type="text" value={form.direccion} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Teléfono de contacto</label>
          <input name="telefono" type="text" value={form.telefono} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de contacto</label>
          <input name="nombre_contacto" type="text" value={form.nombre_contacto} onChange={handleChange} className="w-full border border-gray-300 rounded px-3 py-2" />
        </div>
      </div>

      {/* Columna derecha */}
      <div className="space-y-4 border border-gray-200 p-4 rounded h-fit flex flex-col items-center">
        <img src={logo} alt="Logo PrismaLED" className="h-16 sm:h-20 mb-2" />

        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Usuario</label>
            <input type="text" value={form.usuario} disabled className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
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
        </div>
        {mensaje && <p className="text-sm text-center text-red-600 mt-2">{mensaje}</p>}
      </div>
    </form>
  );
}
  