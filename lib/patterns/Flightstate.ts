// ==========================================
// STATE PATTERN - Estados de un Vuelo
// ==========================================
// Cada estado define qué transiciones son válidas y qué mensaje emite

export type FlightStateName =
  | "SCHEDULED"
  | "BOARDING"
  | "DELAYED"
  | "CANCELLED"
  | "DEPARTED";

export interface FlightState {
  name: FlightStateName;
  label: string;
  color: string;
  allowedTransitions: FlightStateName[];
  onEnter(flightNumber: string): string;
}

export const FlightStates: Record<FlightStateName, FlightState> = {
  SCHEDULED: {
    name: "SCHEDULED",
    label: "Programado",
    color: "#3b82f6",
    allowedTransitions: ["BOARDING", "DELAYED", "CANCELLED"],
    onEnter: (fn) => `🗓️ Vuelo ${fn} programado y en horario.`,
  },
  BOARDING: {
    name: "BOARDING",
    label: "Abordando",
    color: "#a855f7",
    allowedTransitions: ["DEPARTED", "DELAYED", "CANCELLED"],
    onEnter: (fn) => `🚪 Vuelo ${fn}: ¡Abordaje iniciado! Dirígase a la puerta.`,
  },
  DELAYED: {
    name: "DELAYED",
    label: "Retrasado",
    color: "#f97316",
    allowedTransitions: ["BOARDING", "CANCELLED", "SCHEDULED"],
    onEnter: (fn) => `⚠️ Vuelo ${fn} retrasado. Se notificará nueva hora pronto.`,
  },
  CANCELLED: {
    name: "CANCELLED",
    label: "Cancelado",
    color: "#ef4444",
    allowedTransitions: ["SCHEDULED"],
    onEnter: (fn) => `❌ Vuelo ${fn} CANCELADO. Diríjase al mostrador para reprogramar.`,
  },
  DEPARTED: {
    name: "DEPARTED",
    label: "Despegado",
    color: "#22c55e",
    allowedTransitions: [],
    onEnter: (fn) => `✈️ Vuelo ${fn} ha despegado. ¡Buen viaje!`,
  },
};