export interface CheckInStrategy {
  checkIn(passengerName: string): string;
  getMethodName(): string;
}

export class OnlineCheckIn implements CheckInStrategy {
  checkIn(passengerName: string): string {
    return `✅ ${passengerName} realizó check-in ONLINE exitosamente. Boarding pass enviado al email.`;
  }
  getMethodName(): string { return "Online"; }
}

export class KioskCheckIn implements CheckInStrategy {
  checkIn(passengerName: string): string {
    return `✅ ${passengerName} realizó check-in en KIOSCO. Boarding pass impreso.`;
  }
  getMethodName(): string { return "Kiosko"; }
}

export class CounterCheckIn implements CheckInStrategy {
  checkIn(passengerName: string): string {
    return `✅ ${passengerName} realizó check-in en MOSTRADOR. Equipaje registrado.`;
  }
  getMethodName(): string { return "Mostrador"; }
}

export class AirlineCheckInSystem {
  private strategy: CheckInStrategy;

  constructor(strategy: CheckInStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: CheckInStrategy) {
    this.strategy = strategy;
  }

  executeCheckIn(passengerName: string): string {
    return this.strategy.checkIn(passengerName);
  }

  getCurrentMethod(): string {
    return this.strategy.getMethodName();
  }
}