// ==========================================
// OBSERVER PATTERN - Pasajeros y Notificaciones
// ==========================================

export interface Notification {
  id: string;
  flightNumber: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Observer interface
export interface FlightObserver {
  id: string;
  name: string;
  email: string;
  notify(flightNumber: string, message: string): void;
  getNotifications(): Notification[];
  markAllRead(): void;
}

// Concrete Observer - Pasajero
export class Passenger implements FlightObserver {
  id: string;
  name: string;
  email: string;
  private notifications: Notification[] = [];

  constructor(id: string, name: string, email: string) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

  notify(flightNumber: string, message: string): void {
    this.notifications.push({
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      flightNumber,
      message,
      timestamp: new Date().toLocaleTimeString("es-ES"),
      read: false,
    });
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  markAllRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
  }
}