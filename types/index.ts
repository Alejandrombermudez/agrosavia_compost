export interface Pila {
  id: string;
  nombre?: string;
  composicion?: string;
  estado?: string;
  fecha_inicio?: string;
  creado_el?: string;
}

export interface Registro {
  id: string;
  Fecha: string;
  TemperaturaA: number | null;
  TemperaturaB: number | null;
  TemperaturaC: number | null;
  TemperaturaD: number | null;
  TemperaturaE: number | null;
  PromedioTemperatura: number | null;
  pH: number | null;
  Humedad: number | null;
  Comentario?: string;
}

export interface PilaDetalle {
  meta: Pila;
  registros: Registro[];
}

export interface Stats {
  avg: number;
  min: number;
  max: number;
  std: number;
  count: number;
}

export type ChartTab = "temp" | "ph" | "hum";
