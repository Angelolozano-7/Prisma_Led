import { Link } from 'react-router-dom';

export default function ClientHome() {
  const links = [
    { path: '/cliente/reserva', text: 'Realizar reserva' },
    { path: '/cliente/historial-reservas', text: 'Ver historial reservas' },
    { path: '/cliente/editar-reserva', text: 'Editar reserva' }
  ];

  return (
    <div className="w-full max-w-xl h-[60vh] flex flex-col justify-evenly items-center px-4">
      {links.map(({ path, text }, i) => (
        <Link
          key={i}
          to={path}
          className="w-full text-2xl font-bold text-center px-4 py-3 rounded transition duration-300 shadow-[0_4px_12px_rgba(202,162,255,0.4)] hover:shadow-[0_4px_16px_rgba(151,71,255,0.8)]"
        >
          {text}
        </Link>
      ))}
    </div>
  );
}
