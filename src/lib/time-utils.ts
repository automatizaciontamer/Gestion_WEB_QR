
import { ConfiguracionHorarios, Pausa } from './types';

export const DEFAULT_HORARIOS: ConfiguracionHorarios = {
  lunes: { habilitado: true, desde: "08:00", hasta: "17:00" },
  martes: { habilitado: true, desde: "08:00", hasta: "17:00" },
  miercoles: { habilitado: true, desde: "08:00", hasta: "17:00" },
  jueves: { habilitado: true, desde: "08:00", hasta: "17:00" },
  viernes: { habilitado: true, desde: "08:00", hasta: "16:00" },
  sabado: { habilitado: false, desde: "00:00", hasta: "00:00" },
  domingo: { habilitado: false, desde: "00:00", hasta: "00:00" },
};

/**
 * Calcula las horas efectivas entre dos fechas considerando el horario laboral y las pausas.
 * @param start Timestamp de inicio
 * @param end Timestamp de fin
 * @param config Configuración de horarios
 * @param pauses Lista de pausas (solo se restan las aprobadas)
 */
export function calculateEffectiveHours(
  start: number,
  end: number,
  config: ConfiguracionHorarios = DEFAULT_HORARIOS,
  pauses: Pausa[] = []
): number {
  if (start >= end) return 0;

  let totalMs = 0;
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Iterar día por día
  let current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dayName = getDayName(current.getDay());
    const dayConfig = config[dayName as keyof ConfiguracionHorarios];

    if (dayConfig.habilitado) {
      const workStart = new Date(current);
      const [startH, startM] = dayConfig.desde.split(':').map(Number);
      workStart.setHours(startH, startM, 0, 0);

      const workEnd = new Date(current);
      const [endH, endM] = dayConfig.hasta.split(':').map(Number);
      workEnd.setHours(endH, endM, 0, 0);

      const overlapStart = Math.max(start, workStart.getTime());
      const overlapEnd = Math.min(end, workEnd.getTime());

      if (overlapEnd > overlapStart) {
        totalMs += (overlapEnd - overlapStart);
      }
    }

    current.setDate(current.getDate() + 1);
  }

  const totalHours = totalMs / (1000 * 60 * 60);

  // Restar pausas aprobadas que caen dentro del horario laboral
  const approvedPauses = pauses.filter(p => p.aprobada === true && p.fin);
  
  let pauseHours = 0;
  for (const pause of approvedPauses) {
    const pStart = pause.inicio;
    const pEnd = pause.fin!;
    
    // Calcular cuánto de esta pausa cae dentro del horario laboral
    pauseHours += calculateEffectiveHours(pStart, pEnd, config, []);
  }

  return Math.max(0, totalHours - pauseHours);
}


function getDayName(dayIndex: number): string {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[dayIndex];
}
