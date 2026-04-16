// ==========================================
// SINGLETON PATTERN - Sistema de Log
// ==========================================

export type LogType = "CHECK_IN" | "DELAY" | "STATE_CHANGE" | "ASSIGN" | "INFO";

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
}

export class FlightLogger {
  private static instance: FlightLogger | null = null;
  private logs: LogEntry[] = [];

  private constructor() {
    this.log("INFO", "🚀 Sistema de log inicializado (instancia única Singleton)");
  }

  static getInstance(): FlightLogger {
    if (!FlightLogger.instance) {
      FlightLogger.instance = new FlightLogger();
    }
    return FlightLogger.instance;
  }

  log(type: LogType, message: string): void {
    this.logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toLocaleTimeString("es-ES"),
      type,
      message,
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logs].reverse(); // más reciente primero
  }

  clearLogs(): void {
    this.logs = [];
    this.log("INFO", "🗑️ Logs limpiados");
  }

  getInstanceId(): string {
    return "SINGLETON-001";
  }
}