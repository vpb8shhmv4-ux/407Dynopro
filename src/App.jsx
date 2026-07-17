import { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import heroTruck from "./assets/hero-truck.webp";
import {
  Search, Gauge, Zap, Shield, Send, Check, CheckCircle2,
  Settings, LayoutGrid, ChevronRight, Lock, Trash2, SlidersHorizontal,
  Image as ImageIcon, RotateCcw, Cog, CircleDot, Flame, Car, Plus,
} from "lucide-react";

/* ============================================================================
   407DYNOPRO — Prototipo funcional (Frontend clonado estilo Dobinsons + Admin)
   Un solo archivo. Estado global vía Context. Sin librerías externas de estado.
   Estética: Dark mode agresivo · Negro / Fibra de carbono · Gris · Rojo acento.
   ==========================================================================*/

/* ---------- Tipografías (se cargan de Google Fonts; con fallback seguro) ---- */
const F_DISPLAY = "'Oswald','Arial Narrow','Arial',sans-serif";
const F_BODY = "'Inter',system-ui,-apple-system,sans-serif";
const F_MONO = "'JetBrains Mono',ui-monospace,'Courier New',monospace";

/* ---------- Hero shot (foto oficial 407Dynopro · Tundra TRD) ---------------
   Recorte apaisado. Reemplazable desde el Panel Admin ("URL de foto Hero")
   o cambiando esta constante por la ruta del asset (ej: "/assets/hero.webp").
   IMPORTANTE: HERO_AR debe coincidir con el ancho/alto real de la imagen,
   porque todas las posiciones de efectos se calculan como % sobre ella.
   --------------------------------------------------------------------------*/
const HERO_PHOTO = heroTruck;
const HERO_AR = 900 / 630; // ancho / alto

/* ---------- Datos base del catálogo ---------------------------------------- */
/* Catálogo de vehículos. Los modelos van como texto separado por comas para que
   el Admin pueda editarlos sin pelear con arrays anidados. */
const DEFAULT_VEHICLES = {
  yearFrom: 2020,
  yearTo: 2026,
  makes: [
    { id: "mk1", name: "Toyota", models: "Tundra" },
    { id: "mk2", name: "Ford",   models: "F-150" },
    { id: "mk3", name: "Jeep",   models: "Wrangler" },
    { id: "mk4", name: "RAM",    models: "RAM 1500" },
  ],
};

/* Iconos disponibles para Performance. Se guarda la CLAVE (string), no el
   componente: así el estado es serializable y el Admin puede cambiarlo. */
const ICONS = { gauge: Gauge, cog: Cog, flame: Flame, zap: Zap, shield: Shield, wheel: CircleDot, car: Car };
const ICON_KEYS = Object.keys(ICONS);

const DEFAULT_STAGES = [
  {
    id: 1, name: "Street Sport", price: 1890, lift: '1.5"',
    desc: "Nivelación y control diario. El punto de entrada al mundo Dynopro.",
    kit: ["Coilovers IMS ajustables (frontal)", "Espirales de carga media (trasero)", "Bujes de poliuretano", "Alineación de precisión"],
  },
  {
    id: 2, name: "Trail Ready", price: 3450, lift: '2.5"',
    desc: "Listo para el trail. Amortiguación monotubo y geometría corregida.",
    kit: ["Amortiguadores monotubo con reservorio", "Brazos de control superiores (UCA)", "Espirales heavy-duty", "Extensores de línea de freno", "Alineación de precisión"],
  },
  {
    id: 3, name: "Overland Pro", price: 5980, lift: '3.5"',
    desc: "Carga, viaje largo y terreno mixto sin fatiga térmica.",
    kit: ["Amortiguadores con reservorio remoto", "Resortes de carga pesada", "UCA forjados", "Topes hidráulicos", "Kit de reubicación de diferencial", "Alineación de precisión"],
  },
  {
    id: 4, name: "Baja Race", price: 9750, lift: '4.0"+',
    desc: "Competencia pura. Bypass, largo recorrido y disipación extrema.",
    kit: ['Amortiguadores bypass 2.5"', "Hydraulic bump stops", "Long travel / largo recorrido", "Resortes afinados en dyno", "Skid plate de motor", "Alineación + corner balance"],
  },
];

const DEFAULT_WHEELS = [
  { id: "w1", name: "DP Forged 17x9", tire: '285/70R17 · 33" Mud', type: "Mud Terrain", minStage: 1, price: 2400 },
  { id: "w2", name: "DP Beadlock 17x8.5", tire: '35x12.5 · 35" A/T', type: "All Terrain", minStage: 2, price: 2950 },
  { id: "w3", name: "DP Ultralight 20x10", tire: '35x12.5 · 35" A/T', type: "All Terrain", minStage: 2, price: 3300 },
  { id: "w4", name: "DP Race 18x9", tire: '37x13.5 · 37" Mud', type: "Mud Terrain", minStage: 3, price: 3600 },
];

const DEFAULT_PERFORMANCE = [
  { id: "p1", name: "Dyno Tune + ECU Reflash", desc: "Reprogramación en dinamómetro. Mapa custom, +HP / +TQ certificado.", price: 1250, iconKey: "gauge" },
  { id: "p2", name: "Cold Air Induction", desc: "Sistema de inducción de aire de alto flujo con filtro reutilizable.", price: 480, iconKey: "cog" },
  { id: "p3", name: "Cat-Back Exhaust 304", desc: "Escape en acero inoxidable, sonido agresivo, flujo optimizado.", price: 1150, iconKey: "flame" },
];

const DEFAULT_ARMOR = [
  { id: "a1", name: "Parachoques de Acero HD", desc: "Frontal laminado con soporte de winch integrado.", price: 1890, iconKey: "shield" },
  { id: "a2", name: 'Barra LED 40" + Auxiliares', desc: "Iluminación de alto lumen con arnés plug-and-play.", price: 640, iconKey: "zap" },
  { id: "a3", name: "Winch 12,000 lb", desc: "Cabrestante con cable sintético y control inalámbrico.", price: 1150, iconKey: "cog" },
];

/* ---------- Utilidades ------------------------------------------------------ */
const money = (n) => "$" + Number(n || 0).toLocaleString("en-US");

const carbon = {
  backgroundColor: "#0b0b0d",
  backgroundImage:
    "repeating-linear-gradient(45deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 3px)," +
    "repeating-linear-gradient(-45deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 3px)",
  backgroundSize: "4px 4px",
};

/* ============================================================================
   STORE GLOBAL — compartido por Cliente y Admin (edición en tiempo real)
   ==========================================================================*/
const Store = createContext(null);
const useStore = () => useContext(Store);

function StoreProvider({ children }) {
  const [view, setView] = useState("client"); // 'client' | 'admin'

  // Vehículo + flujo
  const [vehicle, setVehicle] = useState({ year: "", make: "", model: "" });
  const [searched, setSearched] = useState(false);
  const [stageId, setStageId] = useState(null);
  const [wheelId, setWheelId] = useState(null);
  const [perfIds, setPerfIds] = useState([]);
  const [armorIds, setArmorIds] = useState([]);
  const [notes, setNotes] = useState("");

  // Leads enviados
  const [leads, setLeads] = useState([]);

  // Contenido editable: TODO el catálogo vive en estado, no en constantes,
  // para que el Panel Admin pueda modificarlo y la Vista Cliente reaccione.
  const [stages, setStages] = useState(DEFAULT_STAGES);
  const [wheels, setWheels] = useState(DEFAULT_WHEELS);
  const [perf, setPerf] = useState(DEFAULT_PERFORMANCE);
  const [armor, setArmor] = useState(DEFAULT_ARMOR);
  const [vehCat, setVehCat] = useState(DEFAULT_VEHICLES);

  // Marca / imágenes
  const [brand, setBrand] = useState({ logoUrl: "", heroUrl: "" });

  // Tema / acento
  const [accentMode, setAccentMode] = useState("red"); // 'red' | 'gray' | 'black'
  const [intensity, setIntensity] = useState(48); // luminosidad del rojo

  // Deriva los tokens de acento
  const theme = useMemo(() => {
    const h = accentMode === "red" ? 2 : accentMode === "gray" ? 220 : 0;
    const s = accentMode === "red" ? 100 : accentMode === "gray" ? 6 : 0;
    const l = accentMode === "red" ? intensity : accentMode === "gray" ? 46 : 22;
    return {
      accent: `hsl(${h} ${s}% ${l}%)`,
      accentSoft: `hsla(${h}, ${s}%, ${l}%, 0.14)`,
      accentGlow: `hsla(${h}, ${s}%, ${l}%, 0.5)`,
      accentLine: `hsla(${h}, ${s}%, ${l}%, 0.35)`,
    };
  }, [accentMode, intensity]);

  const resetBuild = () => {
    setStageId(null); setWheelId(null); setPerfIds([]); setArmorIds([]); setNotes("");
  };
  const resetAll = () => {
    resetBuild(); setSearched(false); setVehicle({ year: "", make: "", model: "" });
  };

  const value = {
    view, setView,
    vehicle, setVehicle, searched, setSearched,
    stageId, setStageId, wheelId, setWheelId,
    perfIds, setPerfIds, armorIds, setArmorIds, notes, setNotes,
    leads, setLeads, stages, setStages, brand, setBrand,
    wheels, setWheels, perf, setPerf, armor, setArmor, vehCat, setVehCat,
    accentMode, setAccentMode, intensity, setIntensity, theme,
    resetBuild, resetAll,
  };
  return <Store.Provider value={value}>{children}</Store.Provider>;
}

/* ============================================================================
   PRIMITIVAS DE UI
   ==========================================================================*/
function Button({ children, onClick, variant = "accent", disabled, full, className = "", type = "button" }) {
  const { theme } = useStore();
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold uppercase px-5 py-3 text-sm transition select-none rounded-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";
  const style =
    variant === "accent"
      ? { background: theme.accent, color: "#0a0a0b", boxShadow: `0 0 22px ${theme.accentGlow}`, letterSpacing: "0.08em", fontFamily: F_DISPLAY }
      : variant === "outline"
      ? { background: "transparent", color: "#e7e7ea", border: `1px solid ${theme.accentLine}`, letterSpacing: "0.08em", fontFamily: F_DISPLAY }
      : { background: "#1c1c20", color: "#c9c9cf", border: "1px solid #2c2c31", letterSpacing: "0.08em", fontFamily: F_DISPLAY };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`${base} ${full ? "w-full" : ""} hover:brightness-110 ${className}`}
    >
      {children}
    </button>
  );
}

function Eyebrow({ children }) {
  const { theme } = useStore();
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ width: 24, height: 2, background: theme.accent }} />
      <span
        className="text-xs font-semibold uppercase"
        style={{ color: theme.accent, letterSpacing: "0.22em", fontFamily: F_MONO }}
      >
        {children}
      </span>
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl md:text-4xl font-bold text-white uppercase leading-none" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.01em" }}>
        {children}
      </h2>
      {sub && <p className="mt-2 text-sm text-zinc-400 max-w-2xl" style={{ fontFamily: F_BODY }}>{sub}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder, disabled }) {
  return (
    <label className="block w-full">
      <span className="block text-xs uppercase text-zinc-500 mb-1.5 font-semibold" style={{ letterSpacing: "0.14em", fontFamily: F_MONO }}>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-3 text-sm outline-none rounded-sm disabled:opacity-40 cursor-pointer"
        style={{ background: "#141417", color: value ? "#f2f2f4" : "#71717a", border: "1px solid #2c2c31", fontFamily: F_BODY }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} style={{ background: "#141417" }}>{o}</option>
        ))}
      </select>
    </label>
  );
}

/* Aparición suave al entrar en pantalla (scroll reveal).
   Se dispara una sola vez con IntersectionObserver y luego se desconecta.
   Al terminar deja transform:none a propósito: un transform permanente crearía
   un containing block y rompería el position:sticky de la barra de progreso. */
function Reveal({ children, delay = 0, y = 22, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) { setShown(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}
         style={{
           opacity: shown ? 1 : 0,
           transform: shown ? "none" : `translateY(${y}px)`,
           filter: shown ? "none" : "blur(6px)",
           transition: `opacity .75s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .75s cubic-bezier(.22,1,.36,1) ${delay}ms, filter .75s cubic-bezier(.22,1,.36,1) ${delay}ms`,
           willChange: shown ? "auto" : "opacity, transform",
         }}>
      {children}
    </div>
  );
}

/* Nodo LED del riel de progreso (señal visual "fase activa") */
function Led({ on, label, icon: Icon, current }) {
  const { theme } = useStore();
  const color = on || current ? theme.accent : "#3a3a40";
  return (
    <div className="flex flex-col items-center gap-2 min-w-[64px]">
      <div
        className="flex items-center justify-center rounded-full transition"
        style={{
          width: 40, height: 40,
          background: on ? theme.accent : "#141417",
          border: `2px solid ${color}`,
          boxShadow: on || current ? `0 0 16px ${theme.accentGlow}` : "none",
        }}
      >
        {on ? <Check size={18} color="#0a0a0b" strokeWidth={3} /> : <Icon size={17} color={color} />}
      </div>
      <span
        className="text-[10px] uppercase font-semibold text-center"
        style={{ color: on || current ? "#e7e7ea" : "#5a5a62", letterSpacing: "0.1em", fontFamily: F_MONO }}
      >
        {label}
      </span>
    </div>
  );
}

/* ============================================================================
   VISTA CLIENTE
   ==========================================================================*/
function Hero() {
  const { brand, theme } = useStore();
  const src = brand.heroUrl || HERO_PHOTO;
  return (
    <header style={carbon} className="relative overflow-hidden border-b">
      <div style={{ position: "relative", width: "100%", aspectRatio: `${HERO_AR}` }}>
        <img src={herotruck} alt="407Dynopro · Toyota Tundra TRD"
             className="absolute inset-0 w-full h-full" style={{ objectFit: "cover" }} />

        {/* Scrim: oscurece la foto para que el titular se lea sin problema */}
        <div className="absolute inset-0" style={{ pointerEvents: "none",
             background: "linear-gradient(180deg, rgba(8,8,10,0.92) 0%, rgba(8,8,10,0.55) 34%, rgba(8,8,10,0.15) 58%, rgba(10,10,11,0.85) 100%)" }} />
        <div className="absolute inset-0" style={{ pointerEvents: "none",
             background: `radial-gradient(60% 45% at 50% 22%, ${theme.accentSoft}, transparent 70%)` }} />

        {/* CAPA SUPERIOR — el titular va sobre la foto */}
        <div className="absolute inset-x-0 top-0 max-w-6xl mx-auto px-6 pt-8 md:pt-12"
             style={{ pointerEvents: "none" }}>
          <Eyebrow>Performance 4x4 · Florida, USA</Eyebrow>
          <h1 className="font-bold text-white uppercase"
              style={{ fontFamily: F_DISPLAY, lineHeight: 0.88,
                       fontSize: "clamp(2rem, 6.4vw, 5rem)",
                       textShadow: "0 4px 34px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.9)" }}>
            Especialistas en<br />
            <span style={{ color: theme.accent, textShadow: `0 0 46px ${theme.accentGlow}` }}>suspensión.</span>
          </h1>
          <p className="mt-4 max-w-md text-zinc-300 text-sm md:text-base"
             style={{ fontFamily: F_BODY, textShadow: "0 2px 14px rgba(0,0,0,0.95)" }}>
            Selecciona tu vehículo y arma tu build por etapas: suspensión, rines,
            performance y armor. Cada componente, validado por el Team Dynopro.
          </p>
        </div>
      </div>
    </header>
  );
}

function ShopByVehicle({ scrollTarget }) {
  const { vehicle, setVehicle, setSearched, resetBuild, theme, vehCat } = useStore();
  const [local, setLocal] = useState(vehicle);

  // Derivados del catálogo del Admin (no de constantes)
  const years = useMemo(() => {
    const a = [];
    for (let y = Number(vehCat.yearTo); y >= Number(vehCat.yearFrom); y--) a.push(String(y));
    return a;
  }, [vehCat.yearFrom, vehCat.yearTo]);
  const makes = useMemo(() => vehCat.makes.map((m) => m.name).filter(Boolean), [vehCat.makes]);
  const models = useMemo(() => {
    const mk = vehCat.makes.find((m) => m.name === local.make);
    return (mk?.models || "").split(",").map((x) => x.trim()).filter(Boolean);
  }, [vehCat.makes, local.make]);

  const ready = local.year && local.make && local.model;

  const run = () => {
    setVehicle(local);
    resetBuild();
    setSearched(true);
    setTimeout(() => scrollTarget.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  return (
    <section className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
      <Reveal y={16}>
      <div className="rounded-md p-6 md:p-7" style={{ background: "#141417", border: "1px solid #2a2a2f", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Search size={18} color={theme.accent} />
          <h3 className="text-lg font-bold text-white uppercase" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.05em" }}>Shop by Vehicle</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Select label="Año" placeholder="Seleccionar año" value={local.year}
                  onChange={(v) => setLocal((s) => ({ ...s, year: v }))} options={years} />
          <Select label="Marca" placeholder="Seleccionar marca" value={local.make}
                  onChange={(v) => setLocal((s) => ({ ...s, make: v, model: "" }))} options={makes} />
          <Select label="Modelo" placeholder="Seleccionar modelo" value={local.model} disabled={!local.make}
                  onChange={(v) => setLocal((s) => ({ ...s, model: v }))} options={models} />
          <Button onClick={run} disabled={!ready} full>
            <Search size={16} /> Buscar
          </Button>
        </div>
        {!ready && (
          <p className="mt-3 text-xs text-zinc-500" style={{ fontFamily: F_MONO }}>
            › Completa año, marca y modelo para desbloquear tu configuración.
          </p>
        )}
      </div>
      </Reveal>
    </section>
  );
}

function ProgressRail() {
  const { stageId, wheelId, perfIds, armorIds, theme } = useStore();
  const nodes = [
    { on: !!stageId, label: "Stage", icon: Gauge },
    { on: !!wheelId, label: "Rines", icon: CircleDot },
    { on: perfIds.length > 0, label: "Performance", icon: Zap },
    { on: armorIds.length > 0, label: "Armor", icon: Shield },
  ];
  const done = nodes.filter((n) => n.on).length;
  const pct = (done / nodes.length) * 100;
  const all = [...nodes, { on: done === nodes.length, current: true, label: "Build", icon: Send }];

  return (
    // sticky bajo el nav (h-16 = 64px). z-40 para quedar debajo del nav (z-50).
    // OJO: ningún ancestro puede tener overflow:hidden ni transform, o sticky muere.
    <div style={{ position: "sticky", top: 72, zIndex: 40 }}>
      <div
        className="mx-auto max-w-3xl px-4 py-3 md:px-6"
        style={{
          borderRadius: 20,
          // Vidrio esmerilado tipo iOS: desenfoque + saturación del fondo,
          // capa translúcida encima y un brillo interior de 1px en el borde superior.
          background: "rgba(18,18,21,0.55)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "0 12px 38px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.35)",
        }}
      >
        {/* Barra de avance del build */}
        <div style={{ position: "relative", height: 3, borderRadius: 999,
                      background: "rgba(255,255,255,0.10)", marginBottom: 12 }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`,
                        borderRadius: 999, background: theme.accent,
                        boxShadow: `0 0 14px ${theme.accentGlow}`,
                        transition: "width .55s cubic-bezier(.22,1,.36,1)" }} />
        </div>

        <div className="flex items-center justify-between">
          {all.map((n) => (
            <Led key={n.label} on={n.on} current={n.current} label={n.label} icon={n.icon} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepHead({ n, title, sub, done }) {
  const { theme } = useStore();
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex items-center justify-center shrink-0 rounded-sm font-bold"
           style={{ width: 44, height: 44, fontFamily: F_DISPLAY, fontSize: 20,
                    background: done ? theme.accent : "#1a1a1e",
                    color: done ? "#0a0a0b" : theme.accent,
                    border: `1px solid ${theme.accentLine}` }}>
        {done ? <Check size={20} strokeWidth={3} /> : n}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white uppercase leading-none" style={{ fontFamily: F_DISPLAY }}>{title}</h3>
        <p className="mt-1.5 text-sm text-zinc-400" style={{ fontFamily: F_BODY }}>{sub}</p>
      </div>
    </div>
  );
}

function StageStep() {
  const { stages, stageId, setStageId, theme } = useStore();
  return (
    <div>
      <StepHead n="1" done={!!stageId} title="Dynopro Sport Packages"
                sub="Selecciona la etapa de suspensión. De Stage 1 a Stage 4, cada nivel escala altura, recorrido y control." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((st) => {
          const active = stageId === st.id;
          return (
            <div key={st.id}
                 className="flex flex-col rounded-md overflow-hidden transition"
                 style={{ background: "#141417", border: `1px solid ${active ? theme.accent : "#2a2a2f"}`,
                          boxShadow: active ? `0 0 26px ${theme.accentGlow}` : "none" }}>
              {/* Barra LED superior (fase activa) */}
              <div style={{ height: 4, background: active ? theme.accent : "#232327" }} />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase" style={{ color: theme.accent, fontFamily: F_MONO, letterSpacing: "0.12em" }}>
                    Stage {st.id}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-sm" style={{ background: "#0f0f12", color: "#a8a8b0", fontFamily: F_MONO, border: "1px solid #2a2a2f" }}>
                    Lift {st.lift}
                  </span>
                </div>
                <h4 className="mt-2 text-xl font-bold text-white uppercase" style={{ fontFamily: F_DISPLAY }}>{st.name}</h4>
                <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed" style={{ fontFamily: F_BODY }}>{st.desc}</p>

                <ul className="mt-4 space-y-1.5 flex-1">
                  {st.kit.map((k, i) => (
                    <li key={i} className="flex gap-2 text-xs text-zinc-300" style={{ fontFamily: F_BODY }}>
                      <ChevronRight size={13} className="shrink-0 mt-0.5" color={theme.accent} />
                      <span>{k}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-lg font-bold text-white" style={{ fontFamily: F_MONO }}>{money(st.price)}</span>
                  <span className="text-[10px] text-zinc-500 uppercase" style={{ fontFamily: F_MONO }}>estimado</span>
                </div>
                <button
                  onClick={() => setStageId(active ? null : st.id)}
                  className="mt-3 w-full py-2.5 text-sm font-semibold uppercase rounded-sm transition hover:brightness-110 active:scale-95"
                  style={active
                    ? { background: theme.accent, color: "#0a0a0b", fontFamily: F_DISPLAY, letterSpacing: "0.06em", boxShadow: `0 0 18px ${theme.accentGlow}` }
                    : { background: "#1c1c20", color: "#e7e7ea", border: "1px solid #2c2c31", fontFamily: F_DISPLAY, letterSpacing: "0.06em" }}
                >
                  {active ? "Seleccionado ✓" : "Seleccionar Stage"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Envoltura que bloquea los pasos 2-4 hasta elegir un Stage */
function Locked({ children }) {
  const { stageId, theme } = useStore();
  if (stageId) return children;
  return (
    <div className="relative">
      <div style={{ filter: "grayscale(1)", opacity: 0.35, pointerEvents: "none" }}>{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Lock size={22} color={theme.accent} />
        <span className="text-sm font-semibold uppercase text-zinc-300" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.08em" }}>
          Selecciona un Stage para continuar
        </span>
      </div>
    </div>
  );
}

function WheelsStep() {
  const { stageId, wheelId, setWheelId, theme, wheels } = useStore();
  return (
    <Locked>
      <StepHead n="2" done={!!wheelId} title="Rines y Cauchos"
                sub="Solo se muestran combinaciones compatibles con tu Stage de suspensión seleccionado." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wheels.map((w) => {
          const compatible = !stageId || w.minStage <= stageId;
          const active = wheelId === w.id;
          return (
            <button key={w.id} disabled={!compatible}
                    onClick={() => setWheelId(active ? null : w.id)}
                    className="text-left p-5 rounded-md transition disabled:cursor-not-allowed hover:brightness-110"
                    style={{ background: "#141417",
                             border: `1px solid ${active ? theme.accent : "#2a2a2f"}`,
                             opacity: compatible ? 1 : 0.45,
                             boxShadow: active ? `0 0 22px ${theme.accentGlow}` : "none" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded-sm uppercase" style={{ background: "#0f0f12", color: theme.accent, fontFamily: F_MONO, border: "1px solid #2a2a2f" }}>{w.type}</span>
                {compatible
                  ? active && <CheckCircle2 size={18} color={theme.accent} />
                  : <span className="text-[10px] uppercase text-zinc-500" style={{ fontFamily: F_MONO }}>Requiere Stage {w.minStage}+</span>}
              </div>
              <h4 className="mt-3 text-lg font-bold text-white uppercase" style={{ fontFamily: F_DISPLAY }}>{w.name}</h4>
              <p className="text-sm text-zinc-400 mt-0.5" style={{ fontFamily: F_BODY }}>{w.tire}</p>
              <div className="mt-3 text-base font-bold text-white" style={{ fontFamily: F_MONO }}>{money(w.price)}</div>
            </button>
          );
        })}
      </div>
    </Locked>
  );
}

function MultiStep({ n, title, sub, items, selected, setSelected }) {
  const { theme } = useStore();
  const toggle = (id) => setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <Locked>
      <StepHead n={n} done={selected.length > 0} title={title} sub={sub} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((it) => {
          const active = selected.includes(it.id);
          const Icon = ICONS[it.iconKey] || Shield;
          return (
            <button key={it.id} onClick={() => toggle(it.id)}
                    className="text-left p-5 rounded-md transition hover:brightness-110 flex flex-col"
                    style={{ background: "#141417", border: `1px solid ${active ? theme.accent : "#2a2a2f"}`,
                             boxShadow: active ? `0 0 22px ${theme.accentGlow}` : "none" }}>
              <div className="flex items-center justify-between">
                {Icon ? <Icon size={22} color={active ? theme.accent : "#71717a"} /> : <Shield size={22} color={active ? theme.accent : "#71717a"} />}
                <span className="flex items-center justify-center rounded-sm shrink-0"
                      style={{ width: 22, height: 22, background: active ? theme.accent : "transparent", border: `1px solid ${active ? theme.accent : "#3a3a40"}` }}>
                  {active && <Check size={13} color="#0a0a0b" strokeWidth={3} />}
                </span>
              </div>
              <h4 className="mt-3 text-base font-bold text-white uppercase" style={{ fontFamily: F_DISPLAY }}>{it.name}</h4>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed flex-1" style={{ fontFamily: F_BODY }}>{it.desc}</p>
              <div className="mt-3 text-base font-bold text-white" style={{ fontFamily: F_MONO }}>{money(it.price)}</div>
            </button>
          );
        })}
      </div>
    </Locked>
  );
}

function BuildItYourself() {
  const { vehicle, stages, stageId, wheelId, perfIds, armorIds, notes, setNotes,
          leads, setLeads, resetBuild, theme, wheels, perf, armor } = useStore();
  const [sent, setSent] = useState(false);

  const stage = stages.find((s) => s.id === stageId);
  const wheel = wheels.find((w) => w.id === wheelId);
  const perfs = perf.filter((p) => perfIds.includes(p.id));
  const armors = armor.filter((a) => armorIds.includes(a.id));

  const total =
    (stage?.price || 0) + (wheel?.price || 0) +
    perfs.reduce((s, p) => s + p.price, 0) + armors.reduce((s, a) => s + a.price, 0);

  const lines = [
    stage && { k: `Stage ${stage.id} · ${stage.name}`, v: money(stage.price) },
    wheel && { k: `Rines · ${wheel.name}`, v: money(wheel.price) },
    ...perfs.map((p) => ({ k: `Performance · ${p.name}`, v: money(p.price) })),
    ...armors.map((a) => ({ k: `Armor · ${a.name}`, v: money(a.price) })),
  ].filter(Boolean);

  const submit = () => {
    const lead = {
      id: Date.now(),
      when: new Date().toLocaleString("es-US", { dateStyle: "short", timeStyle: "short" }),
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      stage: stage ? `Stage ${stage.id} ${stage.name}` : "—",
      wheel: wheel?.name || "—",
      addons: [...perfs.map((p) => p.name), ...armors.map((a) => a.name)],
      notes: notes.trim(),
      total,
    };
    setLeads([lead, ...leads]);
    setSent(true);
    setTimeout(() => { setSent(false); resetBuild(); }, 3200);
  };

  return (
    <div style={carbon} className="rounded-md p-6 md:p-8" >
      <Eyebrow>Paso final</Eyebrow>
      <h3 className="text-2xl md:text-3xl font-bold text-white uppercase leading-none" style={{ fontFamily: F_DISPLAY }}>
        Ármalo tú mismo y contacta con el Team de Dynopro
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Resumen dinámico */}
        <div className="rounded-md p-5" style={{ background: "#101013", border: "1px solid #2a2a2f" }}>
          <div className="flex items-center gap-2 mb-3">
            <Car size={16} color={theme.accent} />
            <span className="text-sm font-bold uppercase text-white" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.05em" }}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </div>
          {lines.length === 0 ? (
            <p className="text-sm text-zinc-500" style={{ fontFamily: F_BODY }}>
              Aún no seleccionas componentes. Vuelve a los pasos de arriba para armar tu build.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: "#22222700" }}>
              {lines.map((l, i) => (
                <div key={i} className="flex justify-between py-2 text-sm" style={{ borderTop: i ? "1px solid #1e1e22" : "none" }}>
                  <span className="text-zinc-300" style={{ fontFamily: F_BODY }}>{l.k}</span>
                  <span className="text-white font-semibold" style={{ fontFamily: F_MONO }}>{l.v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-1" style={{ borderTop: `1px solid ${theme.accentLine}` }}>
                <span className="text-sm uppercase font-bold text-white" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.06em" }}>Total estimado</span>
                <span className="text-lg font-bold" style={{ color: theme.accent, fontFamily: F_MONO }}>{money(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Notas + envío */}
        <div>
          <label className="block text-xs uppercase text-zinc-500 mb-1.5 font-semibold" style={{ letterSpacing: "0.14em", fontFamily: F_MONO }}>
            Notas para el Team
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cuéntanos tu uso (calle, trail, overland, race), presupuesto objetivo, o dudas técnicas…"
            rows={6}
            className="w-full p-4 text-sm outline-none rounded-md resize-none"
            style={{ background: "#101013", color: "#f2f2f4", border: "1px solid #2a2a2f", fontFamily: F_BODY }}
          />
          <div className="mt-4">
            {sent ? (
              <div className="flex items-center gap-3 p-4 rounded-md"
                   style={{ background: theme.accentSoft, border: `1px solid ${theme.accent}` }}>
                <CheckCircle2 size={22} color={theme.accent} />
                <div>
                  <p className="text-sm font-bold text-white uppercase" style={{ fontFamily: F_DISPLAY }}>¡Enviado al Team Dynopro!</p>
                  <p className="text-xs text-zinc-400" style={{ fontFamily: F_BODY }}>Tu build quedó registrado. Te contactamos en breve.</p>
                </div>
              </div>
            ) : (
              <Button onClick={submit} disabled={lines.length === 0} full>
                <Send size={16} /> Enviar al Team Dynopro
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientView() {
  const { searched, resetAll, theme, stageId, wheelId, perfIds, armorIds,
          setPerfIds, setArmorIds, perf, armor } = useStore();
  const configRef = useRef(null);
  return (
    <div>
      <Hero />
      <ShopByVehicle scrollTarget={configRef} />

      {!searched ? (
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <Gauge size={40} color="#3a3a40" className="mx-auto" />
          <p className="mt-4 text-zinc-500" style={{ fontFamily: F_BODY }}>
            Selecciona tu vehículo arriba para desbloquear los Dynopro Sport Packages.
          </p>
        </div>
      ) : (
        <div ref={configRef} className="max-w-6xl mx-auto px-6 pt-16 pb-24 space-y-16">
          <ProgressRail />
          <Reveal><StageStep /></Reveal>
          <Reveal><WheelsStep /></Reveal>
          <Reveal>
            <MultiStep n="3" title="Performance Packages"
                       sub="El fuerte del taller: reprogramación en dyno, inducción de aire y escapes."
                       items={perf} selected={perfIds} setSelected={setPerfIds} />
          </Reveal>
          <Reveal>
            <MultiStep n="4" title="Armor & Accessories"
                       sub="Parachoques de acero, iluminación LED y winches para cerrar el build."
                       items={armor} selected={armorIds} setSelected={setArmorIds} />
          </Reveal>
          <Reveal><BuildItYourself /></Reveal>

          <div className="text-center">
            <button onClick={resetAll} className="inline-flex items-center gap-2 text-xs uppercase text-zinc-500 hover:text-zinc-300 transition"
                    style={{ fontFamily: F_MONO, letterSpacing: "0.1em" }}>
              <RotateCcw size={13} /> Reiniciar configuración
            </button>
          </div>
        </div>
      )}

      <footer className="border-t" style={{ borderColor: "#1e1e22", background: "#0a0a0b" }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold uppercase text-white" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.08em" }}>
            407<span style={{ color: theme.accent }}>DYNOPRO</span>
          </span>
          <span className="text-xs text-zinc-600" style={{ fontFamily: F_MONO }}>Performance 4x4 · Florida · Prototipo demo</span>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================================
   PANEL ADMINISTRATIVO
   ==========================================================================*/
function AdminPanel({ title, icon: Icon, children }) {
  const { theme } = useStore();
  return (
    <div className="rounded-md" style={{ background: "#141417", border: "1px solid #2a2a2f" }}>
      <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "#22222a" }}>
        <Icon size={16} color={theme.accent} />
        <h3 className="text-sm font-bold uppercase text-white" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.06em" }}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function AdminField({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase text-zinc-500 mb-1.5 font-semibold" style={{ letterSpacing: "0.12em", fontFamily: F_MONO }}>{label}</span>
      {children}
    </label>
  );
}
const inputStyle = { background: "#101013", color: "#f2f2f4", border: "1px solid #2a2a2f", fontFamily: F_BODY };

function StyleControls() {
  const { accentMode, setAccentMode, intensity, setIntensity, brand, setBrand, theme } = useStore();
  const modes = [{ id: "red", label: "Rojo" }, { id: "gray", label: "Gris" }, { id: "black", label: "Negro" }];
  return (
    <AdminPanel title="Control de Estilos e Imágenes" icon={SlidersHorizontal}>
      <div className="space-y-5">
        <AdminField label="Color de acento (muta botones y fases)">
          <div className="flex gap-2">
            {modes.map((m) => {
              const on = accentMode === m.id;
              return (
                <button key={m.id} onClick={() => setAccentMode(m.id)}
                        className="flex-1 py-2.5 text-xs uppercase font-semibold rounded-sm transition hover:brightness-110"
                        style={{ fontFamily: F_DISPLAY, letterSpacing: "0.06em",
                                 background: on ? theme.accent : "#101013",
                                 color: on ? "#0a0a0b" : "#c9c9cf",
                                 border: `1px solid ${on ? theme.accent : "#2a2a2f"}` }}>
                  {m.label}
                </button>
              );
            })}
          </div>
        </AdminField>

        <AdminField label={`Intensidad del rojo · ${intensity}%`}>
          <input type="range" min={34} max={62} value={intensity} disabled={accentMode !== "red"}
                 onChange={(e) => setIntensity(Number(e.target.value))}
                 className="w-full disabled:opacity-40" style={{ accentColor: theme.accent }} />
          <div className="mt-3 flex items-center gap-3">
            <div style={{ width: 42, height: 42, borderRadius: 6, background: theme.accent, boxShadow: `0 0 18px ${theme.accentGlow}` }} />
            <span className="text-xs text-zinc-400" style={{ fontFamily: F_MONO }}>Vista previa del acento en vivo</span>
          </div>
        </AdminField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminField label="URL del logo 407Dynopro">
            <div className="flex items-center gap-2">
              <ImageIcon size={15} color="#71717a" />
              <input value={brand.logoUrl} onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })}
                     placeholder="https://…/logo.png" className="w-full px-3 py-2.5 text-sm outline-none rounded-sm" style={inputStyle} />
            </div>
          </AdminField>
          <AdminField label="URL de foto Hero (fondo)">
            <div className="flex items-center gap-2">
              <ImageIcon size={15} color="#71717a" />
              <input value={brand.heroUrl} onChange={(e) => setBrand({ ...brand, heroUrl: e.target.value })}
                     placeholder="https://…/truck.jpg" className="w-full px-3 py-2.5 text-sm outline-none rounded-sm" style={inputStyle} />
            </div>
          </AdminField>
        </div>
      </div>
    </AdminPanel>
  );
}

/* ---------------------------------------------------------------------------
   Editor genérico de catálogo. Un solo componente sirve para Stages, Rines,
   Performance y Armor: cada uno solo declara sus campos.
   Tipos de campo: text | number | textarea | lines (array<->texto) | select
   -------------------------------------------------------------------------*/
function CatalogEditor({ title, icon, items, setItems, fields, makeNew, note }) {
  const { theme } = useStore();
  const patch = (id, k, v) => setItems(items.map((it) => (it.id === id ? { ...it, [k]: v } : it)));
  const remove = (id) => setItems(items.filter((it) => it.id !== id));
  const add = () => setItems([...items, makeNew(items)]);

  const render = (it, f) => {
    const common = { className: "w-full px-3 py-2 text-sm outline-none rounded-sm", style: inputStyle };
    if (f.type === "lines")
      return (
        <textarea {...common} rows={f.rows || 5}
          value={(it[f.k] || []).join("\n")}
          onChange={(e) => patch(it.id, f.k, e.target.value.split("\n").filter((x) => x.trim() !== ""))}
          style={{ ...inputStyle, resize: "vertical" }} />
      );
    if (f.type === "textarea")
      return (
        <textarea {...common} rows={f.rows || 2} value={it[f.k] || ""}
          onChange={(e) => patch(it.id, f.k, e.target.value)}
          style={{ ...inputStyle, resize: "vertical" }} />
      );
    if (f.type === "select")
      return (
        <select {...common} value={it[f.k]} onChange={(e) => patch(it.id, f.k, f.parse ? f.parse(e.target.value) : e.target.value)}>
          {f.options.map((o) => (
            <option key={String(o.v ?? o)} value={o.v ?? o} style={{ background: "#141417" }}>{o.t ?? o}</option>
          ))}
        </select>
      );
    return (
      <input {...common} type={f.type === "number" ? "number" : "text"} value={it[f.k] ?? ""}
        onChange={(e) => patch(it.id, f.k, f.type === "number" ? Number(e.target.value) : e.target.value)} />
    );
  };

  return (
    <AdminPanel title={`${title} (${items.length})`} icon={icon}>
      <div className="space-y-3">
        {note && <p className="text-xs text-zinc-500" style={{ fontFamily: F_MONO }}>› {note}</p>}

        {items.map((it) => (
          <div key={it.id} className="rounded-md p-4" style={{ background: "#101013", border: "1px solid #22222a" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm"
                    style={{ color: theme.accent, fontFamily: F_MONO, letterSpacing: "0.12em", border: "1px solid #2a2a2f" }}>
                {it.id}
              </span>
              <button onClick={() => remove(it.id)} className="text-zinc-600 hover:text-red-400 transition"
                      title="Eliminar">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {fields.map((f) => (
                <div key={f.k} className={f.span}>
                  <AdminField label={f.label}>{render(it, f)}</AdminField>
                </div>
              ))}
            </div>
          </div>
        ))}

        <button onClick={add}
                className="w-full py-2.5 text-xs uppercase font-semibold rounded-sm transition hover:brightness-110 flex items-center justify-center gap-2"
                style={{ fontFamily: F_DISPLAY, letterSpacing: "0.08em", background: "#1c1c20",
                         color: "#e7e7ea", border: `1px dashed ${theme.accentLine}` }}>
          <Plus size={14} /> Agregar {title}
        </button>
      </div>
    </AdminPanel>
  );
}

function VehiclesManager() {
  const { vehCat, setVehCat, theme } = useStore();
  const patchMake = (id, k, v) =>
    setVehCat({ ...vehCat, makes: vehCat.makes.map((m) => (m.id === id ? { ...m, [k]: v } : m)) });
  return (
    <AdminPanel title="Catálogo de Vehículos" icon={Car}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <AdminField label="Año desde">
            <input type="number" value={vehCat.yearFrom} className="w-full px-3 py-2 text-sm outline-none rounded-sm"
                   style={inputStyle} onChange={(e) => setVehCat({ ...vehCat, yearFrom: Number(e.target.value) })} />
          </AdminField>
          <AdminField label="Año hasta">
            <input type="number" value={vehCat.yearTo} className="w-full px-3 py-2 text-sm outline-none rounded-sm"
                   style={inputStyle} onChange={(e) => setVehCat({ ...vehCat, yearTo: Number(e.target.value) })} />
          </AdminField>
        </div>

        {vehCat.makes.map((m) => (
          <div key={m.id} className="rounded-md p-4" style={{ background: "#101013", border: "1px solid #22222a" }}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-4">
                <AdminField label="Marca">
                  <input value={m.name} className="w-full px-3 py-2 text-sm outline-none rounded-sm" style={inputStyle}
                         onChange={(e) => patchMake(m.id, "name", e.target.value)} />
                </AdminField>
              </div>
              <div className="md:col-span-7">
                <AdminField label="Modelos (separados por coma)">
                  <input value={m.models} className="w-full px-3 py-2 text-sm outline-none rounded-sm" style={inputStyle}
                         onChange={(e) => patchMake(m.id, "models", e.target.value)} />
                </AdminField>
              </div>
              <div className="md:col-span-1 flex justify-end pb-2">
                <button onClick={() => setVehCat({ ...vehCat, makes: vehCat.makes.filter((x) => x.id !== m.id) })}
                        className="text-zinc-600 hover:text-red-400 transition"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}

        <button onClick={() => setVehCat({ ...vehCat, makes: [...vehCat.makes, { id: "mk" + Date.now(), name: "", models: "" }] })}
                className="w-full py-2.5 text-xs uppercase font-semibold rounded-sm transition hover:brightness-110 flex items-center justify-center gap-2"
                style={{ fontFamily: F_DISPLAY, letterSpacing: "0.08em", background: "#1c1c20",
                         color: "#e7e7ea", border: `1px dashed ${theme.accentLine}` }}>
          <Plus size={14} /> Agregar Marca
        </button>
      </div>
    </AdminPanel>
  );
}

function StagesManager() {
  const { stages, setStages } = useStore();
  return (
    <CatalogEditor
      title="Dynopro Sport Package" icon={LayoutGrid}
      items={stages} setItems={setStages}
      note='El "Stage mínimo" de los rines apunta al número de Stage. Los componentes van uno por línea.'
      makeNew={(its) => ({
        id: Math.max(0, ...its.map((x) => x.id)) + 1,
        name: "Nuevo Stage", price: 0, lift: '0"', desc: "", kit: ["Componente 1"],
      })}
      fields={[
        { k: "name",  label: "Nombre",       type: "text",   span: "md:col-span-5" },
        { k: "price", label: "Precio ($)",   type: "number", span: "md:col-span-3" },
        { k: "lift",  label: "Lift",         type: "text",   span: "md:col-span-4" },
        { k: "desc",  label: "Descripción",  type: "textarea", span: "md:col-span-12" },
        { k: "kit",   label: "Componentes del kit (uno por línea)", type: "lines", span: "md:col-span-12" },
      ]}
    />
  );
}

function WheelsManager() {
  const { wheels, setWheels, stages } = useStore();
  return (
    <CatalogEditor
      title="Rin / Caucho" icon={CircleDot}
      items={wheels} setItems={setWheels}
      note="Si el Stage mínimo es mayor al que eligió el cliente, la opción se muestra bloqueada."
      makeNew={() => ({ id: "w" + Date.now(), name: "Nuevo rin", tire: "", type: "All Terrain", minStage: 1, price: 0 })}
      fields={[
        { k: "name",     label: "Nombre",  type: "text",   span: "md:col-span-4" },
        { k: "tire",     label: "Medida / caucho", type: "text", span: "md:col-span-4" },
        { k: "type",     label: "Tipo",    type: "select", span: "md:col-span-2",
          options: ["All Terrain", "Mud Terrain", "Highway"] },
        { k: "minStage", label: "Stage mín.", type: "select", span: "md:col-span-1",
          parse: Number, options: stages.map((st) => ({ v: st.id, t: String(st.id) })) },
        { k: "price",    label: "Precio ($)", type: "number", span: "md:col-span-1" },
      ]}
    />
  );
}

function PerformanceManager() {
  const { perf, setPerf } = useStore();
  return (
    <CatalogEditor
      title="Performance Package" icon={Zap}
      items={perf} setItems={setPerf}
      makeNew={() => ({ id: "p" + Date.now(), name: "Nuevo módulo", desc: "", price: 0, iconKey: "cog" })}
      fields={[
        { k: "name",    label: "Nombre",     type: "text",   span: "md:col-span-6" },
        { k: "price",   label: "Precio ($)", type: "number", span: "md:col-span-3" },
        { k: "iconKey", label: "Icono",      type: "select", span: "md:col-span-3", options: ICON_KEYS },
        { k: "desc",    label: "Descripción", type: "textarea", span: "md:col-span-12" },
      ]}
    />
  );
}

function ArmorManager() {
  const { armor, setArmor } = useStore();
  return (
    <CatalogEditor
      title="Armor & Accessory" icon={Shield}
      items={armor} setItems={setArmor}
      makeNew={() => ({ id: "a" + Date.now(), name: "Nuevo accesorio", desc: "", price: 0, iconKey: "shield" })}
      fields={[
        { k: "name",    label: "Nombre",     type: "text",   span: "md:col-span-6" },
        { k: "price",   label: "Precio ($)", type: "number", span: "md:col-span-3" },
        { k: "iconKey", label: "Icono",      type: "select", span: "md:col-span-3", options: ICON_KEYS },
        { k: "desc",    label: "Descripción", type: "textarea", span: "md:col-span-12" },
      ]}
    />
  );
}

function LeadsConsole() {
  const { leads, setLeads, theme } = useStore();
  return (
    <AdminPanel title={`Consola de Datos · Leads (${leads.length})`} icon={Send}>
      {leads.length === 0 ? (
        <div className="py-10 text-center">
          <Send size={26} color="#3a3a40" className="mx-auto" />
          <p className="mt-3 text-sm text-zinc-500" style={{ fontFamily: F_BODY }}>
            Sin envíos todavía. Los builds enviados desde "Ármalo tú mismo" aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.accentLine}` }}>
                {["Fecha", "Vehículo", "Stage", "Rines", "Add-ons", "Notas", "Estimado", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-[10px] uppercase text-zinc-500 font-semibold" style={{ fontFamily: F_MONO, letterSpacing: "0.1em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} style={{ borderBottom: "1px solid #1c1c22" }}>
                  <td className="px-3 py-3 text-xs text-zinc-400 whitespace-nowrap" style={{ fontFamily: F_MONO }}>{l.when}</td>
                  <td className="px-3 py-3 text-xs text-white font-semibold whitespace-nowrap" style={{ fontFamily: F_BODY }}>{l.vehicle}</td>
                  <td className="px-3 py-3 text-xs text-zinc-300 whitespace-nowrap" style={{ fontFamily: F_BODY }}>{l.stage}</td>
                  <td className="px-3 py-3 text-xs text-zinc-300 whitespace-nowrap" style={{ fontFamily: F_BODY }}>{l.wheel}</td>
                  <td className="px-3 py-3 text-xs text-zinc-400 max-w-[180px]" style={{ fontFamily: F_BODY }}>{l.addons.length ? l.addons.join(", ") : "—"}</td>
                  <td className="px-3 py-3 text-xs text-zinc-400 max-w-[200px]" style={{ fontFamily: F_BODY }}>{l.notes || "—"}</td>
                  <td className="px-3 py-3 text-xs font-bold whitespace-nowrap" style={{ color: theme.accent, fontFamily: F_MONO }}>{money(l.total)}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => setLeads(leads.filter((x) => x.id !== l.id))} className="text-zinc-600 hover:text-red-400 transition">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPanel>
  );
}

function AdminView() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <div>
        <Eyebrow>Backend Control · Simulado</Eyebrow>
        <SectionTitle sub="Edita el catálogo completo: vehículos, Stages, rines, performance y armor. Todo se sincroniza con la Vista Cliente en tiempo real.">
          Panel Administrativo
        </SectionTitle>
      </div>
      <StyleControls />
      <VehiclesManager />
      <StagesManager />
      <WheelsManager />
      <PerformanceManager />
      <ArmorManager />
      <LeadsConsole />
    </div>
  );
}

/* ============================================================================
   NAV DE DESARROLLO (conmuta vistas) + ROOT
   ==========================================================================*/
function DevNav() {
  const { view, setView, brand, theme, leads } = useStore();
  const tabs = [
    { id: "client", label: "Vista Cliente", icon: LayoutGrid },
    { id: "admin", label: "Panel Admin", icon: Settings },
  ];
  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(10,10,11,0.9)", backdropFilter: "blur(8px)", borderColor: "#1e1e22" }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="407Dynopro" style={{ height: 28 }} onError={(e) => (e.currentTarget.style.display = "none")} />
          ) : (
            <span className="text-xl font-bold uppercase text-white tracking-tight" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.04em" }}>
              407<span style={{ color: theme.accent }}>DYNOPRO</span>
            </span>
          )}
          <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded-sm uppercase text-zinc-500"
                style={{ border: "1px solid #2a2a2f", fontFamily: F_MONO, letterSpacing: "0.1em" }}>dev preview</span>
        </div>
        <div className="flex items-center gap-2">
          {tabs.map((t) => {
            const on = view === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setView(t.id)}
                      className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs uppercase font-semibold rounded-sm transition hover:brightness-110"
                      style={{ fontFamily: F_DISPLAY, letterSpacing: "0.06em",
                               background: on ? theme.accent : "transparent",
                               color: on ? "#0a0a0b" : "#a8a8b0",
                               border: `1px solid ${on ? theme.accent : "#2a2a2f"}` }}>
                <Icon size={14} />
                <span className="hidden sm:inline">{t.label}</span>
                {t.id === "admin" && leads.length > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 rounded-full" style={{ background: on ? "#0a0a0b" : theme.accent, color: on ? theme.accent : "#0a0a0b", fontFamily: F_MONO }}>{leads.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------------------------
   Rastro del cursor: blobs rojos muy difuminados que persiguen al mouse.
   Cada blob sigue al anterior con easing distinto -> forma una estela suave.
   Se escribe directo al DOM (sin estado de React) para no re-renderizar.
   -------------------------------------------------------------------------*/
function CursorGlow() {
  const { theme } = useStore();
  const refs = useRef([]);
  const BLOBS = [
    { s: 300, o: 0.13, b: 34 },
    { s: 210, o: 0.08, b: 40 },
    { s: 140, o: 0.05, b: 46 },
  ];

  useEffect(() => {
    const fine = window.matchMedia?.("(pointer: fine)")?.matches;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (!fine || reduce) return;                    // nada en táctil ni con menos movimiento

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pts = BLOBS.map(() => ({ ...target }));
    const ease = [0.15, 0.095, 0.06];               // cuanto más bajo, más se rezaga
    let raf = 0;

    const onMove = (e) => { target.x = e.clientX; target.y = e.clientY; };
    window.addEventListener("pointermove", onMove, { passive: true });

    const tick = () => {
      let px = target.x, py = target.y;
      pts.forEach((p, i) => {
        p.x += (px - p.x) * ease[i];
        p.y += (py - p.y) * ease[i];
        const el = refs.current[i];
        if (el) el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%)`;
        px = p.x; py = p.y;                          // el siguiente persigue a este
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, []);

  return (
    <div aria-hidden="true"
         style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60, overflow: "hidden" }}>
      {BLOBS.map((b, i) => (
        <div key={i} ref={(el) => (refs.current[i] = el)}
             style={{ position: "absolute", left: 0, top: 0, width: b.s, height: b.s,
                      borderRadius: "50%", opacity: b.o, filter: `blur(${b.b}px)`,
                      mixBlendMode: "screen", willChange: "transform",
                      background: `radial-gradient(circle, ${theme.accent} 0%, transparent 68%)` }} />
      ))}
    </div>
  );
}

function Shell() {
  const { view, theme } = useStore();
  // Carga de fuentes (si hay red); si falla, los fallbacks mantienen el diseño.
  useEffect(() => {
    const id = "dp-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, []);

  /* Cursores. Se reescribe SIEMPRE el contenido del <style> (sin early-return):
     si el tag ya existía de un render anterior, las reglas nuevas nunca se
     aplicaban y la tuerca no aparecía. Ese era el bug.
     Orden importante: primero la llave (base), luego la tuerca (más
     específico que "*"), y al final los campos de texto para que ganen por orden. */
  useEffect(() => {
    const id = "dp-cursor";
    let st = document.getElementById(id);
    if (!st) {
      st = document.createElement("style");
      st.id = id;
      document.head.appendChild(st);
    }
    st.textContent = `
      /* 1. Base: llave inglesa en todo */
      .dp-app, .dp-app * { cursor: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2230%22%20height%3D%2230%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cg%20transform%3D%22scale%28-1%2C1%29%20translate%28-24%2C0%29%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M14.7%206.3a1%201%200%200%200%200%201.4l1.6%201.6a1%201%200%200%200%201.4%200l3.77-3.77a6%206%200%200%201-7.94%207.94l-6.91%206.91a2.12%202.12%200%200%201-3-3l6.91-6.91a6%206%200%200%201%207.94-7.94l-3.76%203.76z%22%20stroke%3D%22%23000000%22%20stroke-opacity%3D%220.85%22%20stroke-width%3D%224.5%22%2F%3E%3Cpath%20d%3D%22M14.7%206.3a1%201%200%200%200%200%201.4l1.6%201.6a1%201%200%200%200%201.4%200l3.77-3.77a6%206%200%200%201-7.94%207.94l-6.91%206.91a2.12%202.12%200%200%201-3-3l6.91-6.91a6%206%200%200%201%207.94-7.94l-3.76%203.76z%22%20stroke%3D%22%23f5f5f7%22%20stroke-width%3D%221.9%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") 4 4, auto !important; }

      /* 2. Cualquier cosa con acción: tuerca (incluye hijos, p.ej. iconos y
            textos dentro de un botón, o el <span> dentro de un <label>) */
      .dp-app button, .dp-app button *,
      .dp-app a, .dp-app a *,
      .dp-app select, .dp-app option,
      .dp-app label, .dp-app label *,
      .dp-app [role="button"], .dp-app [role="button"] *,
      .dp-app [onclick], .dp-app [onclick] *,
      .dp-app .dp-click, .dp-app .dp-click *,
      .dp-app input[type="range"],
      .dp-app input[type="checkbox"],
      .dp-app input[type="radio"],
      .dp-app summary { cursor: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2230%22%20height%3D%2230%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%23000000%22%20stroke-opacity%3D%220.85%22%20stroke-width%3D%223.6%22%20stroke-linejoin%3D%22round%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22M12.00%203.80%20L19.10%207.90%20L19.10%2016.10%20L12.00%2020.20%20L4.90%2016.10%20L4.90%207.90%20Z%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M12.00%203.80%20L19.10%207.90%20L19.10%2016.10%20L12.00%2020.20%20L4.90%2016.10%20L4.90%207.90%20Z%22%20fill%3D%22%23f5f5f7%22%20stroke%3D%22%23f5f5f7%22%20stroke-width%3D%221%22%20stroke-linejoin%3D%22round%22%2F%3E%3Cpath%20d%3D%22M12.00%203.80%20L19.10%207.90%20L19.10%2016.10%20L12.00%2020.20%20L4.90%2016.10%20L4.90%207.90%20Z%22%20fill%3D%22none%22%20stroke%3D%22%230a0a0b%22%20stroke-opacity%3D%220.35%22%20stroke-width%3D%220.9%22%20stroke-linejoin%3D%22round%22%20transform%3D%22translate%2812%2C12%29%20scale%280.74%29%20translate%28-12%2C-12%29%22%2F%3E%3Ccircle%20cx%3D%2212.0%22%20cy%3D%2212.0%22%20r%3D%223.3%22%20fill%3D%22%230a0a0b%22%2F%3E%3Ccircle%20cx%3D%2212.0%22%20cy%3D%2212.0%22%20r%3D%223.3%22%20fill%3D%22none%22%20stroke%3D%22%23f5f5f7%22%20stroke-opacity%3D%220.5%22%20stroke-width%3D%220.7%22%2F%3E%3C%2Fsvg%3E") 15 15, auto !important; }

      /* 3. Campos de escritura: cursor de texto (va después para ganar el empate) */
      .dp-app input[type="text"], .dp-app input[type="number"],
      .dp-app input:not([type]), .dp-app textarea { cursor: text !important; }

      /* 4. Deshabilitado: no invitamos al clic */
      .dp-app button:disabled, .dp-app button:disabled *,
      .dp-app select:disabled, .dp-app input:disabled,
      .dp-app [aria-disabled="true"], .dp-app [aria-disabled="true"] * { cursor: not-allowed !important; }
    `;
  }, []);

  return (
    <div
      className="dp-app"
      style={{
        minHeight: "100vh", background: "#0a0a0b", fontFamily: F_BODY,
        // tokens de acento accesibles vía var(--accent) en todo el árbol
        "--accent": theme.accent, "--accent-glow": theme.accentGlow, "--accent-soft": theme.accentSoft,
      }}
    >
      <DevNav />
      {view === "client" ? <ClientView /> : <AdminView />}
      <CursorGlow />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
