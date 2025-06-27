// src/hooks/useResumenReserva.js

export function useResumenReserva(pantallas = [], duracion = 1, tarifas = {}, fechaInicio = null) {
  const esDiciembre = fechaInicio && new Date(fechaInicio).getMonth() === 11;

  let descuento = 0;
  if (!esDiciembre) {
    if (duracion > 26) descuento = 0.1;
    else if (duracion > 13) descuento = 0.034;
  }

  let baseTotal = 0;
  let totalConDescuento = 0;

  pantallas.forEach(p => {
    const segundos = p.segundos;
    const base = esDiciembre
      ? 2000000
      : tarifas?.[segundos] || p.base || 0;

    const total = base * duracion * (1 - descuento);
    baseTotal += base * duracion;
    totalConDescuento += total;
  });

  const iva = Math.round(totalConDescuento * 0.19);
  const total = totalConDescuento + iva;
  const ahorro = baseTotal - totalConDescuento;

  return {
    descuento,
    baseTotal,
    totalConDescuento,
    iva,
    total,
    ahorro
  };
}
