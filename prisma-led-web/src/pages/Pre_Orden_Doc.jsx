export default function PreOrdenDoc() {
  return (
    <div className="flex flex-col items-center text-center px-4 w-full max-w-3xl mx-auto space-y-6">

      <h2 className="bg-violeta-medio text-white font-bold py-2 px-6 rounded-t w-full">Prereserva #00001</h2>
      <div className="w-full border border-black p-4 text-left space-y-2">
        <p className="font-semibold text-center">Información cliente</p>
        <div className="flex justify-between text-sm">
          <span>Razón Social:</span><span>NIT:</span>
        </div>
        <p className="text-sm">Correo electrónico:</p>
        <hr />
        <p className="text-sm font-semibold text-center">Descripción prereserva</p>
        <ul className="list-disc ml-6 text-sm">
          <li>Fecha: 7/01/2001 - 14/01/2001 – Categoría: Bebidas Alcohólicas</li>
          <li>Pantalla 4B - 1 semana → $1.450.000</li>
          <li>Pantalla 4A - 1 semana → $1.450.000</li>
        </ul>
        <div className="text-right font-bold text-sm mt-2">
          <p>Subtotal: $2.900.000</p>
          <p>IVA: $551.000</p>
          <p>Total: $3.451.000</p>
        </div>
      </div>

      <p className="text-sm text-center">
        Toda la información adicional fue enviada al correo @
      </p>

      <button className="bg-violeta-medio text-white px-6 py-2 rounded hover:bg-violeta-oscuro">
        Aceptar
      </button>
    </div>
  );
}
