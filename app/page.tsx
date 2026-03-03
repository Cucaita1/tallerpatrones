"use client";

import { useState, useCallback } from "react";
import {
  AirlineCheckInSystem,
  OnlineCheckIn,
  KioskCheckIn,
  CounterCheckIn,
} from "@/lib/patterns/CheckInStrategy";
import { FlightLogger } from "@/lib/patterns/FlightLogger";
import { Flight, Passenger } from "@/lib/patterns/FlightObserver";

const logger = FlightLogger.getInstance();

const flight = new Flight("AV-204");
const passengers = [
  new Passenger("p1", "Carlos Ramírez"),
  new Passenger("p2", "Laura Gómez"),
  new Passenger("p3", "Andrés Torres"),
];
passengers.forEach((p) => flight.subscribe(p));

const checkInSystem = new AirlineCheckInSystem(new OnlineCheckIn());

export default function Home() {
  const [selectedStrategy, setSelectedStrategy] = useState<
    "online" | "kiosk" | "counter"
  >("online");
  const [passengerName, setPassengerName] = useState("");
  const [checkInResult, setCheckInResult] = useState<string | null>(null);
  const [logs, setLogs] = useState(logger.getLogs());
  const [flightInfo, setFlightInfo] = useState(flight.getInfo());
  const [passengerNotifs, setPassengerNotifs] = useState<
    Record<string, string[]>
  >({});
  const [delayMinutes, setDelayMinutes] = useState(30);

  const refreshLogs = () => setLogs(logger.getLogs());

  const handleStrategyChange = (s: "online" | "kiosk" | "counter") => {
    setSelectedStrategy(s);
    const strategyMap = {
      online: new OnlineCheckIn(),
      kiosk: new KioskCheckIn(),
      counter: new CounterCheckIn(),
    };
    checkInSystem.setStrategy(strategyMap[s]);
    logger.log("INFO", `🔄 Estrategia de check-in cambiada a: ${strategyMap[s].getMethodName()}`);
    refreshLogs();
  };

  const handleCheckIn = () => {
    if (!passengerName.trim()) return;
    const result = checkInSystem.executeCheckIn(passengerName);
    setCheckInResult(result);
    logger.log("CHECK_IN", result);
    refreshLogs();
  };

  const handleDelay = () => {
    flight.setDelay(delayMinutes);
    logger.log(
      "DELAY",
      `✈️ Vuelo ${flight.getInfo().flightNumber} retrasado ${delayMinutes} minutos`
    );
    const notifs: Record<string, string[]> = {};
    passengers.forEach((p) => {
      notifs[p.name] = p.getNotifications();
    });
    setPassengerNotifs(notifs);
    setFlightInfo(flight.getInfo());
    refreshLogs();
  };

  const handleCancelDelay = () => {
    flight.cancelDelay();
    logger.log("INFO", `✅ Retraso cancelado del vuelo ${flight.getInfo().flightNumber}`);
    const notifs: Record<string, string[]> = {};
    passengers.forEach((p) => {
      notifs[p.name] = p.getNotifications();
    });
    setPassengerNotifs(notifs);
    setFlightInfo(flight.getInfo());
    refreshLogs();
  };

  const logTypeColor: Record<string, string> = {
    CHECK_IN: "#22c55e",
    DELAY: "#f97316",
    NOTIFICATION: "#3b82f6",
    INFO: "#a3a3a3",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e5e5e5", fontFamily: "'Courier New', monospace", padding: "2rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ fontSize: "0.75rem", letterSpacing: "0.3em", color: "#6366f1", marginBottom: "0.5rem", textTransform: "uppercase" }}>
          Sistema de Aerolínea — Design Patterns
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
          ✈️ AeroPatterns
        </h1>
        <p style={{ color: "#71717a", marginTop: "0.5rem", fontSize: "0.9rem" }}>
          Strategy · Singleton · Observer
        </p>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

        {/* ---- STRATEGY PANEL ---- */}
        <div style={{ background: "#111118", border: "1px solid #27272a", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <span style={{ background: "#6366f1", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.1em" }}>STRATEGY</span>
            <h2 style={{ margin: 0, fontSize: "1rem", color: "#fff" }}>Check-In</h2>
          </div>

          <p style={{ color: "#71717a", fontSize: "0.8rem", marginBottom: "1rem" }}>
            Selecciona el método de check-in. El sistema intercambia la estrategia en tiempo de ejecución.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
            {(["online", "kiosk", "counter"] as const).map((s) => {
              const labels = { online: "🌐 Online", kiosk: "🖥️ Kiosko", counter: "🧳 Mostrador" };
              return (
                <button
                  key={s}
                  onClick={() => handleStrategyChange(s)}
                  style={{
                    background: selectedStrategy === s ? "#6366f1" : "#1c1c27",
                    color: selectedStrategy === s ? "#fff" : "#a1a1aa",
                    border: `1px solid ${selectedStrategy === s ? "#6366f1" : "#3f3f46"}`,
                    borderRadius: "8px",
                    padding: "0.6rem 1rem",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.85rem",
                    transition: "all 0.2s",
                  }}
                >
                  {labels[s]}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Nombre del pasajero..."
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              background: "#1c1c27", border: "1px solid #3f3f46",
              borderRadius: "8px", color: "#fff", padding: "0.6rem 0.8rem",
              fontSize: "0.85rem", marginBottom: "0.75rem", outline: "none",
            }}
          />

          <button
            onClick={handleCheckIn}
            style={{
              width: "100%", background: "#6366f1", color: "#fff",
              border: "none", borderRadius: "8px", padding: "0.7rem",
              cursor: "pointer", fontWeight: 700, fontSize: "0.85rem",
            }}
          >
            Hacer Check-In
          </button>

          {checkInResult && (
            <div style={{ marginTop: "1rem", background: "#0f2d0f", border: "1px solid #22c55e", borderRadius: "8px", padding: "0.75rem", fontSize: "0.8rem", color: "#22c55e" }}>
              {checkInResult}
            </div>
          )}
        </div>

        {/* ---- OBSERVER PANEL ---- */}
        <div style={{ background: "#111118", border: "1px solid #27272a", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <span style={{ background: "#f97316", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.1em" }}>OBSERVER</span>
            <h2 style={{ margin: 0, fontSize: "1rem", color: "#fff" }}>Notificaciones de Vuelo</h2>
          </div>

          <p style={{ color: "#71717a", fontSize: "0.8rem", marginBottom: "1rem" }}>
            Al anunciar un retraso, todos los pasajeros suscritos son notificados automáticamente.
          </p>

          {/* Flight status */}
          <div style={{ background: "#1c1c27", borderRadius: "8px", padding: "0.75rem", marginBottom: "1rem", fontSize: "0.82rem" }}>
            <div style={{ color: "#a1a1aa" }}>Vuelo: <span style={{ color: "#fff", fontWeight: 700 }}>{flightInfo.flightNumber}</span></div>
            <div style={{ color: "#a1a1aa" }}>Estado: <span style={{ color: flightInfo.isDelayed ? "#f97316" : "#22c55e", fontWeight: 700 }}>{flightInfo.isDelayed ? `⚠️ Retrasado ${flightInfo.delayMinutes} min` : "✅ En horario"}</span></div>
            <div style={{ color: "#a1a1aa" }}>Pasajeros suscritos: <span style={{ color: "#fff" }}>{flightInfo.passengerCount}</span></div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
            <input
              type="number"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              min={1}
              style={{ width: "70px", background: "#1c1c27", border: "1px solid #3f3f46", borderRadius: "8px", color: "#fff", padding: "0.5rem", fontSize: "0.85rem", outline: "none" }}
            />
            <span style={{ color: "#71717a", fontSize: "0.8rem" }}>minutos</span>
            <button onClick={handleDelay} style={{ flex: 1, background: "#7c2d12", color: "#fed7aa", border: "1px solid #f97316", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}>
              ⚠️ Anunciar Retraso
            </button>
            <button onClick={handleCancelDelay} style={{ background: "#14532d", color: "#86efac", border: "1px solid #22c55e", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", fontSize: "0.82rem" }}>
              ✅
            </button>
          </div>

          {/* Passenger notifications */}
          {Object.keys(passengerNotifs).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {Object.entries(passengerNotifs).map(([name, notifs]) => (
                <div key={name} style={{ background: "#1c1c27", borderRadius: "6px", padding: "0.6rem 0.75rem", fontSize: "0.78rem" }}>
                  <div style={{ color: "#f97316", fontWeight: 700, marginBottom: "0.25rem" }}>👤 {name}</div>
                  {notifs.map((n, i) => <div key={i} style={{ color: "#a1a1aa" }}>{n}</div>)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---- SINGLETON LOG PANEL (full width) ---- */}
        <div style={{ gridColumn: "1 / -1", background: "#111118", border: "1px solid #27272a", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ background: "#22c55e", color: "#000", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.1em" }}>SINGLETON</span>
              <h2 style={{ margin: 0, fontSize: "1rem", color: "#fff" }}>Sistema de Log — Instancia Única</h2>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#71717a" }}>ID: <code style={{ color: "#22c55e" }}>{FlightLogger.getInstance().getInstanceId()}</code></span>
              <button
                onClick={() => { logger.clearLogs(); refreshLogs(); }}
                style={{ background: "#1c1c27", border: "1px solid #3f3f46", borderRadius: "6px", color: "#a1a1aa", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.75rem" }}
              >
                Limpiar
              </button>
            </div>
          </div>

          <p style={{ color: "#71717a", fontSize: "0.8rem", marginBottom: "1rem" }}>
            FlightLogger.getInstance() siempre retorna la misma instancia. Todos los módulos del sistema escriben en este único log.
          </p>

          <div style={{ background: "#0a0a0f", border: "1px solid #27272a", borderRadius: "8px", padding: "1rem", maxHeight: "200px", overflowY: "auto" }}>
            {logs.length === 0 ? (
              <div style={{ color: "#3f3f46", fontSize: "0.8rem" }}>Sin registros...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ display: "flex", gap: "1rem", fontSize: "0.78rem", marginBottom: "0.3rem", alignItems: "baseline" }}>
                  <span style={{ color: "#52525b", minWidth: "65px" }}>{log.timestamp}</span>
                  <span style={{ color: logTypeColor[log.type], minWidth: "90px", fontWeight: 700, fontSize: "0.7rem" }}>[{log.type}]</span>
                  <span style={{ color: "#d4d4d8" }}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pattern explanations */}
      <div style={{ maxWidth: "1100px", margin: "1.5rem auto 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        {[
          { tag: "STRATEGY", color: "#6366f1", title: "Método de Check-In", desc: "Define una familia de algoritmos intercambiables. El sistema no depende del método concreto, solo de la interfaz CheckInStrategy." },
          { tag: "SINGLETON", color: "#22c55e", title: "Logger Único", desc: "Garantiza que FlightLogger tenga solo una instancia en toda la app. El constructor es privado; se accede via getInstance()." },
          { tag: "OBSERVER", color: "#f97316", title: "Notificaciones", desc: "El vuelo (Subject) mantiene lista de pasajeros (Observers). Al retrasarse, llama notify() en todos automáticamente." },
        ].map(({ tag, color, title, desc }) => (
          <div key={tag} style={{ background: "#111118", border: `1px solid ${color}33`, borderRadius: "10px", padding: "1rem" }}>
            <div style={{ color, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.4rem" }}>{tag}</div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.4rem" }}>{title}</div>
            <div style={{ color: "#71717a", fontSize: "0.78rem", lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </main>
  );
}