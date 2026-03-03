export interface LogEntry {
  timestamp: string;
  type: "CHECK_IN" | "DELAY" | "NOTIFICATION" | "INFO";
  message: string;
}

export class FlightLogger {
  private static instance: FlightLogger | null = null;
  private logs: LogEntry[] = [];

  private constructor() {
    this.log("INFO", "🚀 Sistema de log inicializado (instancia única)");
  }

  static getInstance(): FlightLogger {
    if (!FlightLogger.instance) {
      FlightLogger.instance = new FlightLogger();
    }
    return FlightLogger.instance;
  }

  log(type: LogEntry["type"], message: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString("es-ES"),
      type,
      message,
    };
    this.logs.push(entry);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.log("INFO", "🗑️ Logs limpiados");
  }

  getInstanceId(): string {
    return "SINGLETON-001";
  }
}