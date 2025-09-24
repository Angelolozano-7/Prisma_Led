// src/hooks/useResumenReserva.js

const toDate = (d) => new Date(d);
const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
const addWeeks = (date, w) => addDays(date, 7 * w);
const isDecember = (date) => toDate(date).getMonth() === 11;

// Cuenta semanas "de diciembre" recorriendo semana a semana.
// Criterio: si la semana inicia O termina en diciembre, esa semana se considera diciembre.
const countDecemberWeeks = (fechaInicio, duracionSemanas) => {
  if (!fechaInicio || !duracionSemanas) return 0;
  const start = toDate(fechaInicio);
  let dec = 0;
  for (let k = 0; k < duracionSemanas; k++) {
    const weekStart = addWeeks(start, k);
    const weekEnd = addDays(weekStart, 6);
    if (isDecember(weekStart) && isDecember(weekEnd)) dec++;
  }
  return dec;
};

// cupos por segundos (20s=1, 40s=2, 60s=3)
const cuposFromSegundos = (segundos) => {
  if (!segundos) return 0;
  return Math.max(1, Math.round(segundos / 20));
};

const PRECIO_DIC_POR_CUPO = 2_000_000;

export function useResumenReserva(
  pantallas = [],          // [{ segundos, base? }, ...]
  duracion = 1,            // en semanas (si es "mes", usa meses*4)
  tarifas = {},            // {20: $normal, 40: $normal, 60: $normal}
  fechaInicio = null
) {
  // 1) Partimos la duración en semanas de diciembre vs fuera de diciembre
  const semanasDic = countDecemberWeeks(fechaInicio, duracion);
  const semanasFueraDic = Math.max(0, duracion - semanasDic);

  // 2) Descuento por duración TOTAL (se aplica SOLO a semanas fuera de dic)
  let descuento = 0;
  if (duracion > 26) descuento = 0.10;
  else if (duracion > 13) descuento = 0.035; // 3.5%

  // Acumuladores
  let baseTotalSinDescuento = 0; // con reglas reales (dic especial + normal), pero SIN descuento
  let totalConDescuento = 0;     // aplicando descuento sólo a la parte fuera de dic
  let ahorro = 0;

  for (const p of pantallas) {
    const segundos = p?.segundos;
    const baseNormalSemana = tarifas?.[segundos] ?? p?.base ?? 0;
    if (!segundos || !baseNormalSemana || !duracion || !fechaInicio) continue;

    const cupos = cuposFromSegundos(segundos);
    const baseDicSemana = PRECIO_DIC_POR_CUPO * cupos;

    const totalFueraDic = baseNormalSemana * semanasFueraDic; // SIN descuento
    const totalDic = baseDicSemana * semanasDic;               // diciembre nunca lleva descuento

    const totalFueraConDto = totalFueraDic * (1 - descuento);

    baseTotalSinDescuento += totalFueraDic + totalDic;
    totalConDescuento += totalFueraConDto + totalDic;

    // El ahorro es el descuento aplicado sobre la porción FUERA de dic
    ahorro += totalFueraDic * descuento;
  }

  const iva = Math.round(totalConDescuento * 0.19);
  const total = totalConDescuento + iva;

  return {
    // Totales
    baseTotal: baseTotalSinDescuento,  // subtotal antes de descuento (pero con diciembre especial)
    totalConDescuento,                 // subtotal después de descuento (antes de IVA)
    iva,
    total,                             // total final (con IVA)
    ahorro,                            // ahorro por descuentos
    // Desglose útil para UI
    descuento,                         // 0, 0.035 o 0.10
    semanasDic,
    semanasFueraDic,
  };
}

