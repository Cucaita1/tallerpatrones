"use client";
import { useState, useCallback } from "react";
import {
  AirlineCheckInSystem,
  OnlineCheckIn,
  KioskCheckIn,
  CounterCheckIn,
} from "@/lib/patterns/CheckInStrategy";
import { FlightLogger } from "@/lib/patterns/FlightLogger";
import { FlightStates, FlightStateName } from "@/lib/patterns/Flightstate";
import {
  getFlights,
  getPassengers,
  changeFlightState,
  updateFlight,
  assignPassenger,
  unassignPassenger,
  addFlight,
  addPassenger,
  FlightRecord,
} from "@/lib/store";
import { Passenger } from "@/lib/patterns/FlightObserver";

const logger = FlightLogger.getInstance();
const checkInSystem = new AirlineCheckInSystem(new OnlineCheckIn());

type Tab = "flights" | "passengers" | "checkin" | "logs";

const STATE_COLORS: Record<FlightStateName, string> = {
  SCHEDULED: "#3b82f6",
  BOARDING:  "#a855f7",
  DELAYED:   "#f97316",
  CANCELLED: "#ef4444",
  DEPARTED:  "#22c55e",
};

const LOG_COLORS: Record<string, string> = {
  CHECK_IN:     "#22c55e",
  DELAY:        "#f97316",
  STATE_CHANGE: "#a855f7",
  ASSIGN:       "#3b82f6",
  INFO:         "#52525b",
};

/* ─── inline style helpers ─────────────────────────── */
const card: React.CSSProperties = {
  background: "#0f0f1a",
  border: "1px solid #1e1e2e",
  borderRadius: "10px",
  padding: "1.25rem",
};
const inputStyle: React.CSSProperties = {
  background: "#1a1a2e",
  border: "1px solid #2e2e4e",
  borderRadius: "6px",
  color: "#e4e4e7",
  padding: "0.5rem 0.75rem",
  fontSize: "0.82rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
const labelStyle: React.CSSProperties = {
  fontSize: "0.68rem",
  color: "#52525b",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "0.3rem",
  display: "block",
};
const btn = (bg: string, fg = "#fff"): React.CSSProperties => ({
  background: bg, color: fg, border: "none", borderRadius: "6px",
  padding: "0.45rem 0.9rem", cursor: "pointer", fontSize: "0.8rem",
  fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" as const,
});
const ghostBtn: React.CSSProperties = {
  background: "transparent", color: "#71717a", border: "1px solid #2e2e4e",
  borderRadius: "6px", padding: "0.45rem 0.9rem", cursor: "pointer",
  fontSize: "0.8rem", fontFamily: "inherit",
};
const badge = (color: string): React.CSSProperties => ({
  background: `${color}22`, color, border: `1px solid ${color}55`,
  borderRadius: "4px", padding: "1px 7px", fontSize: "0.68rem",
  fontWeight: 700, letterSpacing: "0.05em", display: "inline-block",
});

/* ─── Component ────────────────────────────────────── */
export default function Home() {
  const [tab, setTab] = useState<Tab>("flights");
  const [flights, setFlights] = useState<FlightRecord[]>(getFlights());
  const [passengers, setPassengers] = useState<Passenger[]>(getPassengers());
  const [logs, setLogs] = useState(logger.getLogs());
  const [selectedFlight, setSelectedFlight] = useState<FlightRecord | null>(null);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<FlightRecord>>({});

  const [newFlight, setNewFlight] = useState({ flightNumber: "", origin: "", destination: "", departureTime: "", gate: "" });
  const [newPassenger, setNewPassenger] = useState({ name: "", email: "" });
  const [checkInMethod, setCheckInMethod] = useState<"online" | "kiosk" | "counter">("online");
  const [checkInPassenger, setCheckInPassenger] = useState("");
  const [checkInResult, setCheckInResult] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setFlights(getFlights());
    setPassengers(getPassengers());
    setLogs(logger.getLogs());
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStateChange = (flightId: string, newState: FlightStateName) => {
    const result = changeFlightState(flightId, newState);
    showToast(result.message, result.success);
    refresh();
    setSelectedFlight(getFlights().find((f) => f.id === flightId) ?? null);
  };

  const handleSaveEdit = () => {
    if (!selectedFlight) return;
    updateFlight(selectedFlight.id, editData);
    showToast("✅ Vuelo actualizado");
    setEditMode(false);
    refresh();
    setSelectedFlight(getFlights().find((f) => f.id === selectedFlight.id) ?? null);
  };

  const handleAssign = (flightId: string, passengerId: string) => {
    const ok = assignPassenger(flightId, passengerId);
    showToast(ok ? "✅ Pasajero asignado" : "Ya estaba asignado", ok);
    refresh();
    setSelectedFlight(getFlights().find((f) => f.id === flightId) ?? null);
  };

  const handleUnassign = (flightId: string, passengerId: string) => {
    unassignPassenger(flightId, passengerId);
    showToast("🚫 Pasajero removido");
    refresh();
    setSelectedFlight(getFlights().find((f) => f.id === flightId) ?? null);
  };

  const handleAddFlight = () => {
    if (!newFlight.flightNumber || !newFlight.origin || !newFlight.destination) {
      showToast("Completa los campos requeridos", false); return;
    }
    addFlight(newFlight);
    setNewFlight({ flightNumber: "", origin: "", destination: "", departureTime: "", gate: "" });
    showToast("✅ Vuelo creado");
    refresh();
  };

  const handleAddPassenger = () => {
    if (!newPassenger.name || !newPassenger.email) {
      showToast("Completa nombre y email", false); return;
    }
    addPassenger(newPassenger.name, newPassenger.email);
    setNewPassenger({ name: "", email: "" });
    showToast("✅ Pasajero registrado");
    refresh();
  };

  const handleCheckIn = () => {
    if (!checkInPassenger.trim()) return;
    const map = { online: new OnlineCheckIn(), kiosk: new KioskCheckIn(), counter: new CounterCheckIn() };
    checkInSystem.setStrategy(map[checkInMethod]);
    const result = checkInSystem.executeCheckIn(checkInPassenger);
    setCheckInResult(result);
    logger.log("CHECK_IN", result);
    refresh();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "flights",    label: "✈️  Vuelos" },
    { id: "passengers", label: "👤 Pasajeros" },
    { id: "checkin",    label: "🎫 Check-In" },
    { id: "logs",       label: "📋 Logs" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#070710", color: "#e4e4e7", fontFamily: "'IBM Plex Mono','Courier New',monospace" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "1rem", right: "1rem", zIndex: 999, background: toast.ok ? "#14532d" : "#7f1d1d", border: `1px solid ${toast.ok ? "#22c55e" : "#ef4444"}`, borderRadius: "8px", padding: "0.6rem 1.2rem", fontSize: "0.82rem", color: "#fff", boxShadow: "0 4px 24px #00000088" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ background: "linear-gradient(180deg,#0f0f1a 0%,#070710 100%)", borderBottom: "1px solid #1e1e2e", padding: "1.25rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "0.62rem", color: "#6366f1", letterSpacing: "0.3em", textTransform: "uppercase" }}>Sistema de Gestión de Aerolínea</div>
          <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>✈️ AeroPatterns</h1>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[["Strategy","#6366f1"],["Singleton","#22c55e"],["Observer","#f97316"],["State","#a855f7"]].map(([p, c]) => (
            <span key={p} style={badge(c)}>{p}</span>
          ))}
        </div>
      </header>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1e1e2e", background: "#0a0a14", padding: "0 2rem", display: "flex" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", borderBottom: tab === t.id ? "2px solid #6366f1" : "2px solid transparent", color: tab === t.id ? "#fff" : "#52525b", padding: "0.75rem 1.25rem", cursor: "pointer", fontSize: "0.82rem", fontFamily: "inherit", fontWeight: tab === t.id ? 700 : 400 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "1.5rem 2rem", maxWidth: "1280px", margin: "0 auto" }}>

        {/* ══ FLIGHTS TAB ══ */}
        {tab === "flights" && (
          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.25rem" }}>

            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Add flight form */}
              <div style={card}>
                <div style={{ fontSize: "0.7rem", color: "#6366f1", letterSpacing: "0.12em", marginBottom: "0.75rem", fontWeight: 700 }}>➕ NUEVO VUELO</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {[
                    { key: "flightNumber", ph: "Nro vuelo (AV-205)" },
                    { key: "origin",       ph: "Origen (BOG)" },
                    { key: "destination",  ph: "Destino (MED)" },
                    { key: "departureTime",ph: "Hora (09:00)" },
                    { key: "gate",         ph: "Puerta (A14)" },
                  ].map(({ key, ph }) => (
                    <input key={key} placeholder={ph} value={(newFlight as any)[key]}
                      onChange={(e) => setNewFlight((p) => ({ ...p, [key]: e.target.value }))}
                      style={inputStyle} />
                  ))}
                  <button onClick={handleAddFlight} style={{ ...btn("#6366f1"), marginTop: "0.15rem" }}>Crear Vuelo</button>
                </div>
              </div>

              {/* Flight list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {flights.map((f) => {
                  const st = FlightStates[f.state];
                  return (
                    <div key={f.id} onClick={() => { setSelectedFlight(f); setEditMode(false); setEditData({}); }}
                      style={{ ...card, cursor: "pointer", borderColor: selectedFlight?.id === f.id ? "#6366f1" : "#1e1e2e", transition: "border-color .15s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 900, color: "#fff", fontSize: "0.9rem" }}>{f.flightNumber}</div>
                          <div style={{ color: "#52525b", fontSize: "0.72rem" }}>{f.origin} → {f.destination} · {f.departureTime} · Gate {f.gate}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={badge(st.color)}>{st.label}</span>
                          <div style={{ fontSize: "0.68rem", color: "#52525b", marginTop: "3px" }}>👥 {f.passengerIds.length}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column – detail */}
            <div>
              {!selectedFlight ? (
                <div style={{ ...card, textAlign: "center", padding: "4rem", color: "#3f3f46" }}>← Selecciona un vuelo</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

                  {/* Info + edit */}
                  <div style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div>
                        <span style={badge(FlightStates[selectedFlight.state].color)}>{FlightStates[selectedFlight.state].label}</span>
                        <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", marginTop: "0.2rem" }}>{selectedFlight.flightNumber}</div>
                      </div>
                      <button onClick={() => { setEditMode(!editMode); setEditData({ ...selectedFlight }); }} style={ghostBtn}>
                        {editMode ? "Cancelar" : "✏️ Editar"}
                      </button>
                    </div>

                    {editMode ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {[
                          { label: "Número de vuelo", key: "flightNumber" },
                          { label: "Origen",          key: "origin" },
                          { label: "Destino",         key: "destination" },
                          { label: "Hora de salida",  key: "departureTime" },
                          { label: "Puerta",          key: "gate" },
                        ].map(({ label, key }) => (
                          <div key={key}>
                            <label style={labelStyle}>{label}</label>
                            <input value={(editData as any)[key] ?? ""} onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
                          </div>
                        ))}
                        <button onClick={handleSaveEdit} style={{ ...btn("#22c55e"), marginTop: "0.25rem" }}>💾 Guardar cambios</button>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                        {[
                          ["Origen",    selectedFlight.origin],
                          ["Destino",   selectedFlight.destination],
                          ["Salida",    selectedFlight.departureTime],
                          ["Puerta",    selectedFlight.gate],
                          ["Retraso",   selectedFlight.delayMinutes ? `${selectedFlight.delayMinutes} min` : "—"],
                          ["Pasajeros", String(selectedFlight.passengerIds.length)],
                        ].map(([k, v]) => (
                          <div key={k} style={{ background: "#1a1a2e", borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                            <div style={{ fontSize: "0.62rem", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>{k}</div>
                            <div style={{ color: "#e4e4e7", fontWeight: 700, fontSize: "0.88rem" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* State machine */}
                  <div style={card}>
                    <div style={{ fontSize: "0.7rem", color: "#a855f7", letterSpacing: "0.12em", marginBottom: "0.75rem", fontWeight: 700 }}>🔄 ESTADO — State Pattern</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.6rem" }}>
                      {(Object.keys(FlightStates) as FlightStateName[]).map((s) => {
                        const st = FlightStates[s];
                        const isCurrent = selectedFlight.state === s;
                        const canTransit = FlightStates[selectedFlight.state].allowedTransitions.includes(s);
                        return (
                          <button key={s} disabled={isCurrent || !canTransit} onClick={() => handleStateChange(selectedFlight.id, s)}
                            style={{ ...btn(isCurrent ? st.color : canTransit ? `${st.color}99` : "#1a1a2e", isCurrent ? "#fff" : canTransit ? "#fff" : "#3f3f46"), border: isCurrent ? `2px solid ${st.color}` : "2px solid transparent", opacity: canTransit || isCurrent ? 1 : 0.35, cursor: canTransit && !isCurrent ? "pointer" : "default" }}>
                            {isCurrent ? "● " : ""}{st.label}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#52525b" }}>
                      Estado actual: <span style={{ color: FlightStates[selectedFlight.state].color, fontWeight: 700 }}>{FlightStates[selectedFlight.state].label}</span>
                      {" · "}Transiciones posibles: {FlightStates[selectedFlight.state].allowedTransitions.map((t) => FlightStates[t].label).join(", ") || "ninguna"}
                    </div>
                  </div>

                  {/* Passenger assignment */}
                  <div style={card}>
                    <div style={{ fontSize: "0.7rem", color: "#f97316", letterSpacing: "0.12em", marginBottom: "0.75rem", fontWeight: 700 }}>👥 PASAJEROS ASIGNADOS — Observer Pattern</div>

                    {selectedFlight.passengerIds.length === 0 ? (
                      <div style={{ color: "#3f3f46", fontSize: "0.8rem", marginBottom: "0.75rem" }}>Sin pasajeros asignados</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.85rem" }}>
                        {selectedFlight.passengerIds.map((pid) => {
                          const p = passengers.find((x) => x.id === pid);
                          if (!p) return null;
                          return (
                            <div key={pid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a2e", borderRadius: "6px", padding: "0.45rem 0.75rem" }}>
                              <div>
                                <span style={{ color: "#e4e4e7", fontSize: "0.82rem", fontWeight: 700 }}>{p.name}</span>
                                <span style={{ color: "#52525b", fontSize: "0.72rem", marginLeft: "0.5rem" }}>{p.email}</span>
                              </div>
                              <button onClick={() => handleUnassign(selectedFlight.id, pid)} style={{ ...btn("#ef4444"), padding: "0.2rem 0.55rem", fontSize: "0.72rem" }}>✕ Quitar</button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {passengers.filter((p) => !selectedFlight.passengerIds.includes(p.id)).length > 0 && (
                      <>
                        <div style={{ fontSize: "0.68rem", color: "#52525b", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Agregar pasajero:</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                          {passengers.filter((p) => !selectedFlight.passengerIds.includes(p.id)).map((p) => (
                            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111122", border: "1px solid #1e1e2e", borderRadius: "6px", padding: "0.4rem 0.75rem" }}>
                              <span style={{ color: "#a1a1aa", fontSize: "0.8rem" }}>{p.name} <span style={{ color: "#52525b", fontSize: "0.7rem" }}>({p.email})</span></span>
                              <button onClick={() => handleAssign(selectedFlight.id, p.id)} style={{ ...btn("#3b82f6"), padding: "0.25rem 0.65rem", fontSize: "0.72rem" }}>+ Asignar</button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ PASSENGERS TAB ══ */}
        {tab === "passengers" && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Add passenger */}
              <div style={card}>
                <div style={{ fontSize: "0.7rem", color: "#22c55e", letterSpacing: "0.12em", marginBottom: "0.75rem", fontWeight: 700 }}>➕ NUEVO PASAJERO</div>
                <input placeholder="Nombre completo" value={newPassenger.name} onChange={(e) => setNewPassenger((p) => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, marginBottom: "0.45rem" }} />
                <input placeholder="Email" value={newPassenger.email} onChange={(e) => setNewPassenger((p) => ({ ...p, email: e.target.value }))} style={{ ...inputStyle, marginBottom: "0.5rem" }} />
                <button onClick={handleAddPassenger} style={{ ...btn("#22c55e"), width: "100%" }}>Registrar</button>
              </div>

              {/* List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {passengers.map((p) => {
                  const myFlights = flights.filter((f) => f.passengerIds.includes(p.id));
                  const unread = p.getUnreadCount();
                  return (
                    <div key={p.id} onClick={() => setSelectedPassenger(p)} style={{ ...card, cursor: "pointer", borderColor: selectedPassenger?.id === p.id ? "#22c55e" : "#1e1e2e", transition: "border-color .15s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#e4e4e7", fontSize: "0.88rem" }}>{p.name}</div>
                          <div style={{ color: "#52525b", fontSize: "0.72rem" }}>{p.email} · {myFlights.length} vuelo(s)</div>
                        </div>
                        {unread > 0 && (
                          <span style={{ background: "#f97316", color: "#fff", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>{unread}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Passenger detail */}
            <div>
              {!selectedPassenger ? (
                <div style={{ ...card, textAlign: "center", padding: "4rem", color: "#3f3f46" }}>← Selecciona un pasajero</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={card}>
                    <div style={{ fontWeight: 900, color: "#fff", fontSize: "1.1rem" }}>{selectedPassenger.name}</div>
                    <div style={{ color: "#52525b", fontSize: "0.78rem", marginBottom: "1rem" }}>{selectedPassenger.email}</div>
                    <div style={{ fontSize: "0.7rem", color: "#22c55e", marginBottom: "0.5rem", fontWeight: 700, letterSpacing: "0.1em" }}>VUELOS ASIGNADOS</div>
                    {flights.filter((f) => f.passengerIds.includes(selectedPassenger.id)).length === 0 ? (
                      <div style={{ color: "#3f3f46", fontSize: "0.8rem" }}>Sin vuelos asignados</div>
                    ) : (
                      flights.filter((f) => f.passengerIds.includes(selectedPassenger.id)).map((f) => (
                        <div key={f.id} style={{ background: "#1a1a2e", borderRadius: "6px", padding: "0.5rem 0.75rem", marginBottom: "0.35rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#e4e4e7", fontWeight: 700, fontSize: "0.85rem" }}>{f.flightNumber}</span>
                          <span style={{ color: "#52525b", fontSize: "0.75rem" }}>{f.origin} → {f.destination} · {f.departureTime}</span>
                          <span style={badge(FlightStates[f.state].color)}>{FlightStates[f.state].label}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Notifications */}
                  <div style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#f97316", fontWeight: 700, letterSpacing: "0.1em" }}>📱 NOTIFICACIONES — Observer</div>
                      <button onClick={() => { selectedPassenger.markAllRead(); refresh(); }} style={ghostBtn}>Marcar leídas</button>
                    </div>
                    <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {selectedPassenger.getNotifications().length === 0 ? (
                        <div style={{ color: "#3f3f46", fontSize: "0.8rem" }}>Sin notificaciones</div>
                      ) : (
                        [...selectedPassenger.getNotifications()].reverse().map((n) => (
                          <div key={n.id} style={{ background: n.read ? "#0f0f1a" : "#1a1a2e", border: `1px solid ${n.read ? "#1e1e2e" : "#2e2e4e"}`, borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                              <span style={badge("#f97316")}>{n.flightNumber}</span>
                              <span style={{ fontSize: "0.65rem", color: "#52525b" }}>{n.timestamp}</span>
                            </div>
                            <div style={{ color: n.read ? "#71717a" : "#e4e4e7", fontSize: "0.78rem" }}>{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ CHECK-IN TAB ══ */}
        {tab === "checkin" && (
          <div style={{ maxWidth: "480px" }}>
            <div style={card}>
              <div style={{ fontSize: "0.7rem", color: "#6366f1", letterSpacing: "0.12em", marginBottom: "1rem", fontWeight: 700 }}>🎫 CHECK-IN — Strategy Pattern</div>
              <label style={labelStyle}>Método de check-in</label>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                {(["online","kiosk","counter"] as const).map((m) => {
                  const labels = { online: "🌐 Online", kiosk: "🖥️ Kiosko", counter: "🧳 Mostrador" };
                  const active = checkInMethod === m;
                  return (
                    <button key={m} onClick={() => setCheckInMethod(m)} style={{ flex: 1, ...btn(active ? "#6366f1" : "#1a1a2e"), border: `1px solid ${active ? "#6366f1" : "#2e2e4e"}`, color: active ? "#fff" : "#71717a" }}>
                      {labels[m]}
                    </button>
                  );
                })}
              </div>
              <label style={labelStyle}>Nombre del pasajero</label>
              <input value={checkInPassenger} onChange={(e) => setCheckInPassenger(e.target.value)} placeholder="Nombre completo..." style={{ ...inputStyle, marginBottom: "0.75rem" }} />
              <button onClick={handleCheckIn} style={{ ...btn("#6366f1"), width: "100%" }}>Realizar Check-In</button>
              {checkInResult && (
                <div style={{ marginTop: "1rem", background: "#14532d", border: "1px solid #22c55e", borderRadius: "8px", padding: "0.75rem", fontSize: "0.82rem", color: "#86efac" }}>
                  {checkInResult}
                </div>
              )}
              <div style={{ marginTop: "1.5rem", padding: "0.75rem", background: "#1a1a2e", borderRadius: "6px", fontSize: "0.75rem", color: "#52525b", lineHeight: 1.6 }}>
                <strong style={{ color: "#6366f1" }}>Strategy Pattern:</strong> El sistema delega la ejecución a la estrategia seleccionada. Puedes cambiar el método en cualquier momento sin modificar el contexto <code>AirlineCheckInSystem</code>.
              </div>
            </div>
          </div>
        )}

        {/* ══ LOGS TAB ══ */}
        {tab === "logs" && (
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#22c55e", letterSpacing: "0.12em", fontWeight: 700 }}>📋 SISTEMA DE LOG — Singleton Pattern</div>
                <div style={{ fontSize: "0.7rem", color: "#52525b", marginTop: "2px" }}>
                  Instancia: <code style={{ color: "#22c55e" }}>{logger.getInstanceId()}</code> · {logs.length} entradas
                </div>
              </div>
              <button onClick={() => { logger.clearLogs(); refresh(); }} style={ghostBtn}>🗑️ Limpiar</button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              {Object.entries(LOG_COLORS).map(([type, color]) => (
                <span key={type} style={badge(color)}>{type}</span>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxHeight: "60vh", overflowY: "auto" }}>
              {logs.map((log) => (
                <div key={log.id} style={{ display: "flex", gap: "1rem", alignItems: "baseline", background: "#0a0a14", borderRadius: "4px", padding: "0.4rem 0.75rem" }}>
                  <span style={{ color: "#3f3f46", fontSize: "0.7rem", minWidth: "62px", flexShrink: 0 }}>{log.timestamp}</span>
                  <span style={{ color: LOG_COLORS[log.type] ?? "#52525b", fontSize: "0.68rem", fontWeight: 700, minWidth: "96px", flexShrink: 0 }}>[{log.type}]</span>
                  <span style={{ color: "#d4d4d8", fontSize: "0.78rem" }}>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}