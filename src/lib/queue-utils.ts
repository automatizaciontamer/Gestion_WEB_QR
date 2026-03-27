import { doc, writeBatch, Firestore } from 'firebase/firestore';
import { Tarea } from './types';
import { calculateEffectiveHours, addWorkingHours } from './time-utils';

/**
 * Recalcula la cola de tareas para un usuario específico, asegurando que sean secuenciales
 * y respeten los horarios laborales de la empresa.
 */
export const recalculateUserQueue = async (
  db: Firestore,
  userId: string,
  allTareas: Tarea[],
  empresaHorarios: any
) => {
  if (!db || !allTareas) return;
  
  const userTasks = allTareas.filter(t => t.usuarioAsignadoId === userId && t.estado !== 'finalizada');
  if (userTasks.length === 0) return;

  // Ordenar: en_progreso primero, luego el resto por fechaInicioAsignada o createdAt
  const sortedTasks = [...userTasks].sort((a, b) => {
    if (a.estado === 'en_progreso') return -1;
    if (b.estado === 'en_progreso') return 1;
    
    // Usar fechaInicioAsignada si existe, sino createdAt
    const startA = a.fechaInicioAsignada || a.createdAt;
    const startB = b.fechaInicioAsignada || b.createdAt;
    return startA - startB;
  });

  const batch = writeBatch(db);
  let runningEndTime = Date.now();
  let hasChanges = false;

  for (const task of sortedTasks) {
    let newStart = runningEndTime;
    
    // Si la tarea ya está en progreso, calculamos su fin estimado basándonos en lo que falta
    if (task.estado === 'en_progreso') {
      const spent = calculateEffectiveHours(task.startedAt || task.createdAt, Date.now(), empresaHorarios || undefined, task.pausas);
      const remaining = Math.max(0, task.tiempoDestinado - spent);
      runningEndTime = addWorkingHours(Date.now(), remaining, empresaHorarios || undefined);
      
      if (task.fechaFinAsignada !== runningEndTime) {
        batch.update(doc(db, 'tareas', task.id), { fechaFinAsignada: runningEndTime });
        hasChanges = true;
      }
    } else {
      // Para pendientes/pausadas, el inicio es el runningEndTime del anterior
      const newEnd = addWorkingHours(newStart, task.tiempoDestinado, empresaHorarios || undefined);
      
      if (task.fechaInicioAsignada !== newStart || task.fechaFinAsignada !== newEnd) {
        batch.update(doc(db, 'tareas', task.id), { 
          fechaInicioAsignada: newStart,
          fechaFinAsignada: newEnd 
        });
        hasChanges = true;
      }
      runningEndTime = newEnd;
    }
  }

  if (hasChanges) {
    await batch.commit();
  }
};
