import { ServicioMonitoreo } from './ServicioMonitoreo';

const INTERVALO_MIN = 30;
const INTERVALO_MAX = 3600;

export function validarIntervalo(segundos: number): void {
  if (!Number.isInteger(segundos) || segundos < INTERVALO_MIN || segundos > INTERVALO_MAX)
    throw new Error(`El intervalo debe ser un entero entre ${INTERVALO_MIN} y ${INTERVALO_MAX} segundos`);
}

export class Planificador {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private servicio: ServicioMonitoreo) {}

  iniciar(intervaloSegundos: number): void {
    validarIntervalo(intervaloSegundos);
    this.detener();
    this.timer = setInterval(() => {
      this.servicio.verificarTodos().catch((err) =>
        console.error('[Planificador] Error en verificación periódica:', err)
      );
    }, intervaloSegundos * 1000);
  }

  detener(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  estaActivo(): boolean {
    return this.timer !== null;
  }
}
