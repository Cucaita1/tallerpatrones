export interface FlightObserver {
  id: string;
  name: string;
  notify(flightNumber: string, message: string): void;
}

export class Passenger implements FlightObserver {
  id: string;
  name: string;
  private notifications: string[] = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  notify(flightNumber: string, message: string): void {
    this.notifications.push(`📱 [${flightNumber}] ${message}`);
  }

  getNotifications(): string[] {
    return [...this.notifications];
  }
}

export class Flight {
  private observers: FlightObserver[] = [];
  private flightNumber: string;
  private isDelayed: boolean = false;
  private delayMinutes: number = 0;

  constructor(flightNumber: string) {
    this.flightNumber = flightNumber;
  }

  subscribe(observer: FlightObserver): void {
    this.observers.push(observer);
  }

  unsubscribe(observerId: string): void {
    this.observers = this.observers.filter((o) => o.id !== observerId);
  }

  private notifyAll(message: string): void {
    this.observers.forEach((observer) => {
      observer.notify(this.flightNumber, message);
    });
  }

  setDelay(minutes: number): void {
    this.isDelayed = true;
    this.delayMinutes = minutes;
    this.notifyAll(`⚠️ Su vuelo se retrasa ${minutes} minutos. Nueva salida estimada actualizada.`);
  }

  cancelDelay(): void {
    this.isDelayed = false;
    this.delayMinutes = 0;
    this.notifyAll(`✅ El retraso fue cancelado. Vuelo en horario normal.`);
  }

  getInfo() {
    return {
      flightNumber: this.flightNumber,
      isDelayed: this.isDelayed,
      delayMinutes: this.delayMinutes,
      passengerCount: this.observers.length,
    };
  }

  getObservers(): FlightObserver[] {
    return [...this.observers];
  }
}