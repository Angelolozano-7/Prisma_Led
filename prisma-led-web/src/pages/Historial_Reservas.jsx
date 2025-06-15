export default function HistorialReservas() {
  const historial = [
    { id: 1, pantallas: "4A,5A,6A", fecha: "07/01/2001 - 14/01/2001", categoria: "Bebidas Alcohólicas", total: "$2.900.000" },
    { id: 2, pantallas: "4A,5A,6A", fecha: "07/01/2001 - 14/01/2001", categoria: "Bebidas Alcohólicas", total: "$2.900.000" },
    { id: 3, pantallas: "4A,5A,6A", fecha: "07/01/2001 - 14/01/2001", categoria: "Bebidas Alcohólicas", total: "$2.900.000" },
  ];

  return (
    <div className="flex flex-col items-center px-4 w-full max-w-5xl mx-auto text-center">
      <h2 className="bg-violeta-medio text-white font-bold py-2 px-6 rounded-t w-full max-w-2xl">Historial de reservas</h2>
      <div className="w-full max-w-2xl border border-black">
        {historial.map((reserva) => (
          <div key={reserva.id} className="border-t p-4">
            <p>Pantallas: {reserva.pantallas} - Periodo: {reserva.fecha} - {reserva.categoria}</p>
            <p className="font-semibold">{reserva.total}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-6">
        <button className="bg-violeta-medio text-white px-6 py-2 rounded hover:bg-violeta-oscuro">Disponibilidad</button>
        <button className="bg-violeta-medio text-white px-6 py-2 rounded hover:bg-violeta-oscuro">Cancelar</button>
      </div>
    </div>
  );
}
