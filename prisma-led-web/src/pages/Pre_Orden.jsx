export default function PreOrden() {
  return (
    <div className="flex flex-col items-center px-4 text-center w-full max-w-3xl mx-auto">
      <h2 className="bg-violeta-medio text-white font-bold py-2 px-6 rounded-t w-full">Resumen orden</h2>
      <div className="w-full border border-black p-4 space-y-2 text-left">
        <ul className="list-disc ml-6">
          <li>Fecha: 7/01/2001 - 14/01/2001</li>
          <li>Categoría: Bebidas Alcohólicas</li>
        </ul>
        <hr />
        <ul className="list-disc ml-6">
          <li>Pantalla 4A - 1 semana → $1.450.000</li>
          <li>Pantalla 4B - 1 semana → $1.450.000</li>
        </ul>
        <hr />
        <div className="text-right font-bold space-y-1 mt-2">
          <p>Subtotal: $2.900.000</p>
          <p>IVA: $551.000</p>
          <p className="text-lg">Total: $3.451.000</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <button className="bg-violeta-medio text-white px-6 py-2 rounded hover:bg-violeta-oscuro">Modificar</button>
        <button className="bg-violeta-medio text-white px-6 py-2 rounded hover:bg-violeta-oscuro">Confirmar</button>
        <button className="bg-violeta-medio text-white px-6 py-2 rounded hover:bg-violeta-oscuro">Cancelar</button>
      </div>
    </div>
  );
}
