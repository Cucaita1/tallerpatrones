// ==========================================
// STORE CENTRAL - Une todos los patrones
// ==========================================
import { FlightStateName, FlightStates, FlightState } from "./patterns/Flightstate";
import { Passenger } from "./patterns/FlightObserver";
import { FlightLogger } from "./patterns/FlightLogger";

// Un vuelo observable con estado (State + Observer juntos)
export interface FlightRecord {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  gate: string;
  delayMinutes: number;
  state: FlightStateName;
  passengerIds: string[]; // IDs de pasajeros asignados
}

// Repositorio global de vuelos y pasajeros
// (en producción esto vendría de una API/DB)
let flights: FlightRecord[] = [
  {
    id: "f1",
    flightNumber: "AV-204",
    origin: "BOG",
    destination: "MED",
    departureTime: "08:30",
    gate: "A12",
    delayMinutes: 0,
    state: "SCHEDULED",
    passengerIds: ["p1", "p2"],
  },
  {
    id: "f2",
    flightNumber: "AV-310",
    origin: "BOG",
    destination: "CLO",
    departureTime: "11:00",
    gate: "B7",
    delayMinutes: 0,
    state: "BOARDING",
    passengerIds: ["p3"],
  },
  {
    id: "f3",
    flightNumber: "LA-512",
    origin: "BOG",
    destination: "GRU",
    departureTime: "14:45",
    gate: "C3",
    delayMinutes: 0,
    state: "SCHEDULED",
    passengerIds: [],
  },
];

let passengers: Passenger[] = [
  new Passenger("p1", "Carlos Ramírez", "carlos@email.com"),
  new Passenger("p2", "Laura Gómez", "laura@email.com"),
  new Passenger("p3", "Andrés Torres", "andres@email.com"),
  new Passenger("p4", "Sofía Herrera", "sofia@email.com"),
];

// ---------- Funciones de acceso ----------

export function getFlights(): FlightRecord[] {
  return [...flights];
}

export function getPassengers(): Passenger[] {
  return [...passengers];
}

export function getPassengerById(id: string): Passenger | undefined {
  return passengers.find((p) => p.id === id);
}

export function getFlightById(id: string): FlightRecord | undefined {
  return flights.find((f) => f.id === id);
}

// ---------- Cambiar estado de vuelo (State + Observer) ----------
export function changeFlightState(
  flightId: string,
  newState: FlightStateName,
  delayMinutes?: number
): { success: boolean; message: string } {
  const logger = FlightLogger.getInstance();
  const flight = flights.find((f) => f.id === flightId);
  if (!flight) return { success: false, message: "Vuelo no encontrado" };

  const currentState = FlightStates[flight.state];
  if (!currentState.allowedTransitions.includes(newState)) {
    return {
      success: false,
      message: `No se puede pasar de ${currentState.label} a ${FlightStates[newState].label}`,
    };
  }

  const prevState = flight.state;
  flight.state = newState;
  if (delayMinutes !== undefined) flight.delayMinutes = delayMinutes;
  if (newState !== "DELAYED") flight.delayMinutes = 0;

  const stateObj = FlightStates[newState];
  const stateMessage = stateObj.onEnter(flight.flightNumber);

  // Observer: notificar a todos los pasajeros asignados
  flight.passengerIds.forEach((pid) => {
    const passenger = passengers.find((p) => p.id === pid);
    if (passenger) passenger.notify(flight.flightNumber, stateMessage);
  });

  logger.log(
    "STATE_CHANGE",
    `✈️ ${flight.flightNumber}: ${FlightStates[prevState].label} → ${stateObj.label}. Notificados: ${flight.passengerIds.length} pasajeros.`
  );

  flights = [...flights]; // trigger reactivity
  return { success: true, message: stateMessage };
}

// ---------- Editar datos del vuelo ----------
export function updateFlight(
  flightId: string,
  updates: Partial<Pick<FlightRecord, "flightNumber" | "origin" | "destination" | "departureTime" | "gate" | "delayMinutes">>
): boolean {
  const logger = FlightLogger.getInstance();
  const idx = flights.findIndex((f) => f.id === flightId);
  if (idx === -1) return false;

  flights[idx] = { ...flights[idx], ...updates };
  logger.log("INFO", `Vuelo ${flights[idx].flightNumber} actualizado.`);

  // Notificar a pasajeros del cambio
  flights[idx].passengerIds.forEach((pid) => {
    const p = passengers.find((p) => p.id === pid);
    if (p)
      p.notify(
        flights[idx].flightNumber,
        `Los datos de tu vuelo han sido actualizados. Puerta: ${flights[idx].gate} | Salida: ${flights[idx].departureTime}`
      );
  });

  return true;
}

// ---------- Asignar/desasignar pasajero a vuelo ----------
export function assignPassenger(flightId: string, passengerId: string): boolean {
  const logger = FlightLogger.getInstance();
  const flight = flights.find((f) => f.id === flightId);
  const passenger = passengers.find((p) => p.id === passengerId);
  if (!flight || !passenger) return false;
  if (flight.passengerIds.includes(passengerId)) return false;

  flight.passengerIds = [...flight.passengerIds, passengerId];
  passenger.notify(
    flight.flightNumber,
    `Has sido asignado al vuelo ${flight.flightNumber} (${flight.origin} → ${flight.destination}). Puerta: ${flight.gate}`
  );
  logger.log("ASSIGN", `👤 ${passenger.name} asignado a vuelo ${flight.flightNumber}`);
  return true;
}

export function unassignPassenger(flightId: string, passengerId: string): boolean {
  const logger = FlightLogger.getInstance();
  const flight = flights.find((f) => f.id === flightId);
  const passenger = passengers.find((p) => p.id === passengerId);
  if (!flight || !passenger) return false;

  flight.passengerIds = flight.passengerIds.filter((id) => id !== passengerId);
  passenger.notify(
    flight.flightNumber,
    `Has sido removido del vuelo ${flight.flightNumber}.`
  );
  logger.log("ASSIGN", `👤 ${passenger.name} removido del vuelo ${flight.flightNumber}`);
  return true;
}

// ---------- Agregar vuelo ----------
export function addFlight(data: Omit<FlightRecord, "id" | "passengerIds" | "state" | "delayMinutes">): FlightRecord {
  const logger = FlightLogger.getInstance();
  const newFlight: FlightRecord = {
    ...data,
    id: `f${Date.now()}`,
    state: "SCHEDULED",
    delayMinutes: 0,
    passengerIds: [],
  };
  flights = [...flights, newFlight];
  logger.log("INFO", `➕ Nuevo vuelo creado: ${newFlight.flightNumber} (${newFlight.origin} → ${newFlight.destination})`);
  return newFlight;
}

// ---------- Agregar pasajero ----------
export function addPassenger(name: string, email: string): Passenger {
  const logger = FlightLogger.getInstance();
  const p = new Passenger(`p${Date.now()}`, name, email);
  passengers = [...passengers, p];
  logger.log("INFO", `➕ Nuevo pasajero registrado: ${name}`);
  return p;
}