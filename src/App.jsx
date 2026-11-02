import { useState, useEffect, useRef, useMemo, createContext, useContext, Fragment } from "react";
import heroTruck from "./assets/hero-truck.webp";
import tundraCutout from "./assets/tundra-callout.webp";
import kitBds7in from "./assets/kit-bds-7in.webp";
import kitBdsUca from "./assets/kit-bds-uca.webp";
import kitRlSpacer from "./assets/kit-readylift-spacer.webp";
import productBg from "./assets/product-bg.webp";
import productTruck from "./assets/product-truck.webp";
import {
  Search, Gauge, Zap, Shield, Send, Check, CheckCircle2,
  Settings, LayoutGrid, ChevronRight, Lock, Trash2, SlidersHorizontal,
  Image as ImageIcon, RotateCcw, Cog, CircleDot, Flame, Car, Plus, LogOut, Eye, EyeOff,
  Calendar, GraduationCap, ImagePlus, ChevronDown, Menu, MapPin, Clock, Wrench,
  ArrowLeft, ExternalLink, AlertTriangle, Phone, User,
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

/* Recorte del Toyota Tundra 2023-ON (frente sobresale del callout) */
const TUNDRA_CUTOUT = tundraCutout;

/* Fotos de los componentes (del fabricante: BDS Suspension y ReadyLIFT) */
const KIT_BDS_7IN = kitBds7in;
const KIT_BDS_UCA = kitBdsUca;
const KIT_RL_SPACER = kitRlSpacer;

/* Foto original del build en dos capas alineadas (fondo sin camioneta + camioneta) */
const PRODUCT_BG = productBg;
const PRODUCT_TRUCK = productTruck;

/* Producto destacado preconfigurado. Editable desde el Panel Admin.
   Precio 0 = se muestra "A cotizar". */
const DEFAULT_PRODUCT = {
  title: "Toyota Tundra 2023 – ON",
  subtitle: 'Build de suspensión BDS 7" para correr llantas de 37" a 40"',
  fitment: "Toyota Tundra 2023 en adelante · 4WD",
  basePrice: 0,
  tires: [
    { id: "37", label: '37"', price: 0, note: "Entra con el kit, sin cortes en la carrocería." },
    { id: "40", label: '40"', price: 0, note: "Requiere trimming y ajuste de guardafangos para el clearance." },
  ],
  includes: [
    {
      id: "inc1", brand: "BDS Suspension", name: '7" Lift Kit · Toyota Tundra (22-26) 4WD', sku: "BDS840PES",
      desc: 'Crossmembers de acero de 1/4", skid plates completos, nudillos de dirección CNC, reubicación de diferencial, resortes traseros Pro-Ride y coilovers FOX.',
      img: KIT_BDS_7IN,
      url: "https://bds-suspension.com/products/7-inch-lift-kit-toyota-tundra-22-26-4wd?variant=67029889778035",
    },
    {
      id: "inc2", brand: "BDS Suspension", name: "Upper Control Arm Kit · Toyota Tundra (22-26)", sku: "BDS128254",
      desc: 'Brazos superiores tubulares de 1.5" con rótulas engrasables y copa indexada: más recorrido y alineación correcta en trucks levantados.',
      img: KIT_BDS_UCA,
      url: "https://bds-suspension.com/products/upper-control-arm-kit-toyota-tundra-22-26-8af0eec1",
    },
    {
      id: "inc3", brand: "ReadyLIFT", name: '2" Rear Spacer Kit · Toyota Tundra (22-26)', sku: "26-52200",
      desc: 'Espaciadores traseros de acero para los resortes: 2" extra atrás para nivelar el stance del build.',
      img: KIT_RL_SPACER,
      url: "https://www.readylift.com/2-rear-spacer-kit-2022-2025-toyota-tundra.html",
    },
  ],
};
const HERO_AR = 900 / 630; // ancho / alto

/* ---------- Datos base del catálogo ---------------------------------------- */
/* Catálogo de vehículos. Los modelos van como texto separado por comas para que
   el Admin pueda editarlos sin pelear con arrays anidados. */
/* Catálogo de vehículos. Ahora cada marca tiene modelos, y cada modelo tiene
   trims con rango de años (yf/yt) porque los trims cambian por generación, no
   año a año. Los trims se muestran filtrados por el año elegido. Todo editable
   desde el Admin. Datos verificados contra fuentes de fabricante/dealer (2026).
   trims: cada uno { name, yf (año desde), yt (año hasta) }. */
const DEFAULT_VEHICLES = {
  yearFrom: 2020,
  yearTo: 2026,
  makes: [
    {
      id: "mk1", name: "Toyota",
      models: [
        { id: "md1", name: "Tundra", trims: [
          // Gen anterior 2020-2021
          { name: "SR",           yf: 2020, yt: 2021 },
          { name: "SR5",          yf: 2020, yt: 2021 },
          { name: "Limited",      yf: 2020, yt: 2021 },
          { name: "Platinum",     yf: 2020, yt: 2021 },
          { name: "1794 Edition", yf: 2020, yt: 2021 },
          { name: "TRD Pro",      yf: 2020, yt: 2021 },
          // Gen actual 2022-2026
          { name: "SR",           yf: 2022, yt: 2026 },
          { name: "SR5",          yf: 2022, yt: 2026 },
          { name: "Limited",      yf: 2022, yt: 2026 },
          { name: "Platinum",     yf: 2022, yt: 2026 },
          { name: "1794 Edition", yf: 2022, yt: 2026 },
          { name: "TRD Pro",      yf: 2022, yt: 2026 },
          { name: "Capstone",     yf: 2022, yt: 2026 },
        ] },
      ],
    },
    {
      id: "mk2", name: "Ford",
      models: [
        { id: "md2", name: "F-150", trims: [
          { name: "XL",         yf: 2020, yt: 2026 },
          { name: "STX",        yf: 2021, yt: 2026 },
          { name: "XLT",        yf: 2020, yt: 2026 },
          { name: "Lariat",     yf: 2020, yt: 2026 },
          { name: "Tremor",     yf: 2021, yt: 2026 },
          { name: "King Ranch", yf: 2020, yt: 2026 },
          { name: "Platinum",   yf: 2020, yt: 2026 },
          { name: "Raptor",     yf: 2021, yt: 2026 },
        ] },
      ],
    },
    {
      id: "mk3", name: "Jeep",
      models: [
        { id: "md3", name: "Wrangler", trims: [
          { name: "Sport",       yf: 2020, yt: 2026 },
          { name: "Sport S",     yf: 2020, yt: 2026 },
          { name: "Willys",      yf: 2020, yt: 2026 },
          { name: "Sahara",      yf: 2020, yt: 2026 },
          { name: "High Altitude", yf: 2021, yt: 2026 },
          { name: "Rubicon",     yf: 2020, yt: 2026 },
          { name: "Rubicon X",   yf: 2024, yt: 2026 },
          { name: "Rubicon 392", yf: 2021, yt: 2026 },
        ] },
      ],
    },
    {
      id: "mk4", name: "RAM",
      models: [
        { id: "md4", name: "RAM 1500", trims: [
          // Gen DT 2020-2024
          { name: "Tradesman",       yf: 2020, yt: 2024 },
          { name: "Big Horn",        yf: 2020, yt: 2024 },
          { name: "Laramie",         yf: 2020, yt: 2024 },
          { name: "Rebel",           yf: 2020, yt: 2024 },
          { name: "Limited Longhorn", yf: 2020, yt: 2024 },
          { name: "Limited",         yf: 2020, yt: 2024 },
          { name: "TRX",             yf: 2021, yt: 2024 },
          // Nueva gen 2025-2026
          { name: "Tradesman",       yf: 2025, yt: 2026 },
          { name: "Big Horn",        yf: 2025, yt: 2026 },
          { name: "Warlock",         yf: 2025, yt: 2026 },
          { name: "Laramie",         yf: 2025, yt: 2026 },
          { name: "Rebel",           yf: 2025, yt: 2026 },
          { name: "RHO",             yf: 2025, yt: 2026 },
          { name: "Limited",         yf: 2025, yt: 2026 },
          { name: "Limited Longhorn", yf: 2025, yt: 2026 },
          { name: "Tungsten",        yf: 2025, yt: 2026 },
        ] },
      ],
    },
  ],
};

/* Devuelve los nombres de trim de un modelo, filtrados por año y sin duplicados. */
function trimsFor(model, year) {
  if (!model || !Array.isArray(model.trims)) return [];
  const y = Number(year);
  const list = model.trims.filter((t) => !y || ((!t.yf || y >= t.yf) && (!t.yt || y <= t.yt)));
  return [...new Set((y ? list : model.trims).map((t) => t.name))];
}

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

/* ---------- Contenido demo: Eventos, Cursos y Galería -----------------------
   URLs de Unsplash con parámetros fijos (w/q) para que carguen estables. Todo
   editable desde el Panel Admin; estos son solo los valores de arranque. */
const DEFAULT_EVENTS = [
  {
    id: "ev1",
    title: "Dynopro Off-Road Day",
    date: "2026-05-16",
    location: "Ocala, Florida",
    desc: "Jornada de trail abierto: prueba tu build en terreno real junto al Team Dynopro. Estaciones de flexión, vadeo y dyno móvil.",
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=70",
  },
];

const DEFAULT_COURSES = [
  {
    id: "co1",
    title: "Fundamentos de Suspensión 4x4",
    level: "Principiante",
    duration: "8 horas",
    desc: "Geometría, tipos de amortiguación, cálculo de lift y alineación de precisión. Teoría + taller práctico sobre una Tundra Stage 2.",
    imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=70",
  },
];

const DEFAULT_GALLERY = [
  {
    id: "g1",
    imageUrl: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=70",
    make: "Toyota", model: "Tundra", optionalText: "Stage 3 · Overland Pro",
  },
  {
    id: "g2",
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=70",
    make: "Ford", model: "F-150", optionalText: "",
  },
];

/* Opciones de instalación y extras que aparecen al final, tras elegir todo. */
const FINAL_OPTIONS = [
  { id: "install", label: "Instalación (mano de obra)", price: 1890 },
  { id: "align",   label: "Alineación", price: 175 },
  { id: "trim",    label: 'Trimming + fenders (clearance 40")', price: 1000, onlyTire: "40",
    note: 'Solo aplica para llantas de 40". Para 37" no aplica.' },
  { id: "dys",     label: "Asesoría de parámetros (compra para instalar en DYS)", price: 250 },
];

/* ---------- Acceso al panel administrativo ---------------------------------
   ATENCIÓN — ESTO NO ES SEGURIDAD REAL.
   Esta comprobación ocurre en el navegador, así que estas credenciales viajan
   dentro del bundle de JavaScript: cualquiera puede leerlas con DevTools o
   revisando el repositorio. Solo evita que un visitante casual entre al panel.
   Para protegerlo de verdad hace falta un backend que valide la sesión y que
   nunca envíe los datos del admin al cliente sin autorizar.
   --------------------------------------------------------------------------*/
const ADMIN_USER = "Admin";
const ADMIN_PASS = "407Dnpr.humberto26";

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
  const [vehicle, setVehicle] = useState({ year: "", make: "", model: "", trim: "" });
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

  // Sesión del admin (no persiste: al recargar se vuelve a pedir el acceso)
  const [authed, setAuthed] = useState(false);

  // Contenido de las sub-páginas (editable desde el Admin)
  const [events, setEvents] = useState(DEFAULT_EVENTS);
  const [courses, setCourses] = useState(DEFAULT_COURSES);
  const [gallery, setGallery] = useState(DEFAULT_GALLERY);

  // Producto destacado + opciones finales (editables en el Admin)
  const [product, setProduct] = useState(DEFAULT_PRODUCT);
  const [finalOpts, setFinalOpts] = useState(FINAL_OPTIONS);

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
    leads, setLeads, stages, setStages, brand, setBrand, authed, setAuthed,
    wheels, setWheels, perf, setPerf, armor, setArmor, vehCat, setVehCat,
    events, setEvents, courses, setCourses, gallery, setGallery,
    product, setProduct, finalOpts, setFinalOpts,
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
        <img src={src} alt="407Dynopro · Toyota Tundra TRD"
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

/* ---------------------------------------------------------------------------
   TIRA DE VEHÍCULOS PRE-ARMADOS (estilo "Shop by vehicle" con tarjetas).
   Se monta sobre el borde inferior del hero. Cada tarjeta es un build listo:
   la camioneta sobresale del marco y la etiqueta roja lleva el nombre.
   Para sumar vehículos, agrega entradas a la lista que recibe `items`.
   -------------------------------------------------------------------------*/
function VehicleTile({ item }) {
  const { theme } = useStore();
  const [hover, setHover] = useState(false);
  return (
    <button onClick={item.onOpen} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            onFocus={() => setHover(true)} onBlur={() => setHover(false)}
            className="block text-left shrink-0" aria-label={`Ver build ${item.name} ${item.years}`}
            style={{ width: "clamp(250px, 30vw, 330px)", position: "relative", paddingTop: "clamp(48px, 5.7vw, 63px)" }}>
      {/* marco de la tarjeta */}
      <div style={{
        position: "relative", aspectRatio: "4 / 2.55", borderRadius: 10, overflow: "hidden",
        background: "linear-gradient(160deg, #18181c 0%, #0d0d10 70%)",
        border: `1px solid ${hover ? theme.accent : "#2c2c31"}`,
        boxShadow: hover ? `0 18px 40px rgba(0,0,0,0.6), 0 0 30px ${theme.accentGlow}` : "0 16px 36px rgba(0,0,0,0.55)",
        transition: "border-color .3s, box-shadow .4s",
      }}>
        <div className="absolute inset-0" style={{ ...carbon, opacity: 0.6 }} />
        {/* franja diagonal de marca */}
        <div className="absolute inset-0" style={{ pointerEvents: "none",
          background: `linear-gradient(118deg, transparent 38%, ${theme.accentSoft} 44%, ${theme.accentSoft} 52%, transparent 58%)`,
          opacity: hover ? 1 : 0.7, transition: "opacity .3s" }} />
        <div className="absolute inset-x-0 bottom-0" style={{ height: "45%", pointerEvents: "none",
          background: `radial-gradient(70% 100% at 50% 100%, ${theme.accentSoft}, transparent 70%)` }} />
        {/* corchetes HUD */}
        {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h], i) => (
          <span key={i} aria-hidden="true" className="absolute" style={{
            [v]: 8, [h]: 8, width: 14, height: 14, pointerEvents: "none",
            [`border${v === "top" ? "Top" : "Bottom"}`]: `2px solid ${theme.accent}`,
            [`border${h === "left" ? "Left" : "Right"}`]: `2px solid ${theme.accent}`,
            opacity: hover ? 1 : 0.45, transition: "opacity .3s" }} />
        ))}
        {/* polvo sutil bajo las ruedas al pasar el mouse */}
        {[{ x: 22, d: 0 }, { x: 55, d: 80 }, { x: 84, d: 150 }].map((p, i) => (
          <span key={i} aria-hidden="true" style={{
            position: "absolute", left: `${p.x}%`, top: "90%", width: 64, height: 64, borderRadius: "50%",
            pointerEvents: "none", transform: "translate(-50%,-50%)", opacity: 0, filter: "blur(5px)",
            background: "radial-gradient(circle, rgba(170,150,120,0.5), rgba(150,130,100,0) 70%)",
            animation: hover ? `dp-dust 1s ease-out ${p.d}ms` : "none" }} />
        ))}
      </div>

      {/* camioneta que sobresale por arriba del marco */}
      <img src={item.img} alt="" aria-hidden="true" className="pointer-events-none select-none"
           style={{ position: "absolute", left: "-12%", width: "124%", maxWidth: "none", top: 0, height: "auto",
                    filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.6))",
                    transform: hover ? "translateY(-8px) scale(1.04)" : "none", transformOrigin: "50% 80%",
                    transition: "transform .5s cubic-bezier(.22,1,.36,1)" }} />

      {/* etiqueta roja inclinada */}
      <div style={{ position: "absolute", left: "50%", bottom: -14, transform: `translateX(-50%) skewX(-12deg) ${hover ? "translateY(-2px)" : ""}`,
                    background: theme.accent, padding: "7px 18px", whiteSpace: "nowrap",
                    boxShadow: `0 8px 22px rgba(0,0,0,0.55), 0 0 18px ${theme.accentGlow}`, transition: "transform .3s" }}>
        <div style={{ transform: "skewX(12deg)", textAlign: "center" }}>
          <span className="block font-bold uppercase leading-none" style={{ fontFamily: F_DISPLAY, color: "#0a0a0b", fontSize: 17, letterSpacing: "0.04em" }}>
            {item.name}
          </span>
          <span className="block uppercase mt-1" style={{ fontFamily: F_MONO, color: "#0a0a0b", fontSize: 9.5, letterSpacing: "0.14em", fontWeight: 700 }}>
            {item.years} · {item.tag}
          </span>
        </div>
      </div>
    </button>
  );
}

function VehicleStrip({ items }) {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 -mt-4 sm:-mt-20 md:-mt-36 pb-12">
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-14">
        {items.map((it) => <VehicleTile key={it.id} item={it} />)}
      </div>
    </section>
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
    return (mk?.models || []).map((md) => md.name).filter(Boolean);
  }, [vehCat.makes, local.make]);
  const trims = useMemo(() => {
    const mk = vehCat.makes.find((m) => m.name === local.make);
    const md = mk?.models.find((x) => x.name === local.model);
    return trimsFor(md, local.year);
  }, [vehCat.makes, local.make, local.model, local.year]);

  const ready = local.year && local.make && local.model && (trims.length === 0 || local.trim);

  const run = () => {
    setVehicle(local);
    resetBuild();
    setSearched(true);
    setTimeout(() => scrollTarget.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  return (
    <section className="max-w-6xl mx-auto px-6 relative z-10">
      <Reveal y={16}>
      <div className="rounded-md p-6 md:p-7" style={{ background: "#141417", border: "1px solid #2a2a2f", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Search size={18} color={theme.accent} />
          <h3 className="text-lg font-bold text-white uppercase" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.05em" }}>Shop by Vehicle</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <Select label="Año" placeholder="Seleccionar año" value={local.year}
                  onChange={(v) => setLocal((s) => ({ ...s, year: v, trim: "" }))} options={years} />
          <Select label="Marca" placeholder="Seleccionar marca" value={local.make}
                  onChange={(v) => setLocal((s) => ({ ...s, make: v, model: "", trim: "" }))} options={makes} />
          <Select label="Modelo" placeholder="Seleccionar modelo" value={local.model} disabled={!local.make}
                  onChange={(v) => setLocal((s) => ({ ...s, model: v, trim: "" }))} options={models} />
          <Select label="Versión / Trim"
                  placeholder={local.model ? (trims.length ? "Seleccionar trim" : "Sin trims") : "—"}
                  value={local.trim} disabled={!local.model || trims.length === 0}
                  onChange={(v) => setLocal((s) => ({ ...s, trim: v }))} options={trims} />
          <Button onClick={run} disabled={!ready} full>
            <Search size={16} /> Buscar
          </Button>
        </div>
        {!ready && (
          <p className="mt-3 text-xs text-zinc-500" style={{ fontFamily: F_MONO }}>
            › Completa año, marca, modelo y versión para desbloquear tu configuración.
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
          leads, setLeads, resetBuild, theme, wheels, perf, armor, finalOpts } = useStore();
  const [sent, setSent] = useState(false);
  const [airRide, setAirRide] = useState("");     // "" | "si" | "no"
  const [extras, setExtras] = useState([]);       // ids de finalOpts

  const stage = stages.find((s) => s.id === stageId);
  const wheel = wheels.find((w) => w.id === wheelId);
  const perfs = perf.filter((p) => perfIds.includes(p.id));
  const armors = armor.filter((a) => armorIds.includes(a.id));
  const chosenExtras = finalOpts.filter((o) => extras.includes(o.id));

  const toggleExtra = (id) =>
    setExtras((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  const total =
    (stage?.price || 0) + (wheel?.price || 0) +
    perfs.reduce((s, p) => s + p.price, 0) + armors.reduce((s, a) => s + a.price, 0) +
    chosenExtras.reduce((s, o) => s + o.price, 0);

  const lines = [
    stage && { k: `Stage ${stage.id} · ${stage.name}`, v: money(stage.price) },
    wheel && { k: `Rines · ${wheel.name}`, v: money(wheel.price) },
    ...perfs.map((p) => ({ k: `Performance · ${p.name}`, v: money(p.price) })),
    ...armors.map((a) => ({ k: `Armor · ${a.name}`, v: money(a.price) })),
    ...chosenExtras.map((o) => ({ k: `Extra · ${o.label}`, v: money(o.price) })),
    airRide && { k: "Air ride de fábrica", v: airRide === "si" ? "Sí" : "No" },
  ].filter(Boolean);

  const submit = () => {
    const lead = {
      id: Date.now(),
      when: new Date().toLocaleString("es-US", { dateStyle: "short", timeStyle: "short" }),
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""}`,
      stage: stage ? `Stage ${stage.id} ${stage.name}` : "—",
      wheel: wheel?.name || "—",
      addons: [...perfs.map((p) => p.name), ...armors.map((a) => a.name), ...chosenExtras.map((o) => o.label)],
      airRide: airRide ? (airRide === "si" ? "Sí" : "No") : "—",
      notes: notes.trim(),
      total,
    };
    setLeads([lead, ...leads]);
    setSent(true);
    setTimeout(() => { setSent(false); resetBuild(); setExtras([]); setAirRide(""); }, 3200);
  };

  return (
    <div style={carbon} className="rounded-md p-6 md:p-8" >
      <Eyebrow>Paso final</Eyebrow>
      <h3 className="text-2xl md:text-3xl font-bold text-white uppercase leading-none" style={{ fontFamily: F_DISPLAY }}>
        Ármalo tú mismo y contacta con el Team de Dynopro
      </h3>

      {/* ---- Opciones de instalación y extras (paso final) ---- */}
      <div className="mt-6 rounded-md p-5" style={{ background: "#101013", border: "1px solid #2a2a2f" }}>
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={16} color={theme.accent} />
          <span className="text-sm font-bold uppercase text-white" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.05em" }}>
            Instalación y extras
          </span>
        </div>

        {/* Pregunta: air ride de fábrica */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4"
             style={{ borderBottom: "1px solid #1e1e22" }}>
          <span className="text-sm text-zinc-300" style={{ fontFamily: F_BODY }}>
            ¿El vehículo trae <b className="text-white">Air Ride System</b> de fábrica?
          </span>
          <div className="flex gap-2">
            {[["si", "Sí"], ["no", "No"]].map(([v, t]) => {
              const on = airRide === v;
              return (
                <button key={v} onClick={() => setAirRide(on ? "" : v)}
                        className="px-5 py-2 text-xs uppercase font-semibold rounded-sm transition hover:brightness-110"
                        style={{ fontFamily: F_DISPLAY, letterSpacing: "0.06em",
                                 background: on ? theme.accent : "#1c1c20",
                                 color: on ? "#0a0a0b" : "#c9c9cf",
                                 border: `1px solid ${on ? theme.accent : "#2c2c31"}` }}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Extras con precio */}
        <div className="space-y-2">
          {finalOpts.map((o) => {
            const on = extras.includes(o.id);
            return (
              <button key={o.id} onClick={() => toggleExtra(o.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-sm text-left transition hover:brightness-110"
                      style={{ background: on ? theme.accentSoft : "#141417",
                               border: `1px solid ${on ? theme.accent : "#2a2a2f"}` }}>
                <span className="flex items-center justify-center rounded-sm shrink-0"
                      style={{ width: 20, height: 20, background: on ? theme.accent : "transparent",
                               border: `1px solid ${on ? theme.accent : "#3a3a40"}` }}>
                  {on && <Check size={13} color="#0a0a0b" strokeWidth={3} />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm text-white" style={{ fontFamily: F_BODY }}>{o.label}</span>
                  {o.note && <span className="block text-[11px] text-zinc-500 mt-0.5" style={{ fontFamily: F_MONO }}>{o.note}</span>}
                </span>
                <span className="text-sm font-bold text-white shrink-0" style={{ fontFamily: F_MONO }}>{money(o.price)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Resumen dinámico */}
        <div className="rounded-md p-5" style={{ background: "#101013", border: "1px solid #2a2a2f" }}>
          <div className="flex items-center gap-2 mb-3">
            <Car size={16} color={theme.accent} />
            <span className="text-sm font-bold uppercase text-white" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.05em" }}>
              {vehicle.year} {vehicle.make} {vehicle.model}{vehicle.trim ? ` ${vehicle.trim}` : ""}
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

/* ---------------------------------------------------------------------------
   CABECERA ANIMADA DEL BUILD
   Dos capas alineadas de la misma foto: el fondo (sin la camioneta) y la
   camioneta recortada. Al abrir: barrido rojo que revela la foto, acercamiento
   lento, corchetes HUD y marcadores técnicos sobre cada componente.
   Al mover el mouse, fondo y camioneta se desplazan distinto (profundidad).
   -------------------------------------------------------------------------*/
const PRODUCT_PINS = [
  // x / y en % del marco de la foto; side = hacia dónde sale la etiqueta
  { x: 44, y: 52, side: "l", label: 'BDS 7" Lift · FOX' },
  { x: 55, y: 40, side: "l", label: "Brazos superiores BDS" },
  { x: 89, y: 37, side: "l", label: 'ReadyLIFT 2" trasero' },
  { x: 55, y: 66, side: "r", label: 'Llantas 37" – 40"' },
];

function ProductHero({ product, priced, theme, onBack, onStart }) {
  const frameRef = useRef(null);

  // Profundidad con el mouse: se escribe directo en variables CSS (sin re-render)
  const onMove = (e) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const onLeave = () => {
    frameRef.current?.style.setProperty("--mx", "0");
    frameRef.current?.style.setProperty("--my", "0");
  };

  const words = product.title.split(" ");
  // El título va en dos líneas: el nombre del vehículo y luego el año ("2023 – ON")
  const breakAt = words.findIndex((w) => /\d/.test(w));

  return (
    <header className="relative overflow-hidden border-b" style={{ ...carbon, borderColor: "#1e1e22" }}>
      {/* atmósfera: la misma foto, desenfocada y oscura, detrás de todo */}
      <div className="absolute inset-0 dp-anim" aria-hidden="true"
           style={{ backgroundImage: `url(${PRODUCT_BG})`, backgroundSize: "cover", backgroundPosition: "center 40%",
                    filter: "blur(38px) saturate(130%)", transform: "scale(1.25)", opacity: 0.32,
                    animation: "dp-fade 1.4s ease-out both" }} />
      <div className="absolute inset-0" aria-hidden="true"
           style={{ background: "linear-gradient(90deg, rgba(10,10,11,0.94) 0%, rgba(10,10,11,0.72) 45%, rgba(10,10,11,0.55) 100%)" }} />
      <div className="absolute inset-0" aria-hidden="true"
           style={{ background: `radial-gradient(50% 60% at 72% 55%, ${theme.accentSoft}, transparent 70%)` }} />

      <div className="relative max-w-6xl mx-auto px-6 pt-6 pb-12 md:pb-16">
        <button onClick={onBack}
                className="inline-flex items-center gap-2 text-xs uppercase text-zinc-400 hover:text-white transition mb-6"
                style={{ fontFamily: F_MONO, letterSpacing: "0.1em" }}>
          <ArrowLeft size={14} /> Volver al inicio
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-10 items-center">
          {/* ---- texto ---- */}
          <div className="order-2 md:order-1">
            <div className="dp-anim" style={{ animation: "dp-rise .7s cubic-bezier(.22,1,.36,1) .2s both" }}>
              <Eyebrow>Build preconfigurado</Eyebrow>
            </div>
            <h1 className="text-white font-bold uppercase leading-[0.92]"
                style={{ fontFamily: F_DISPLAY, fontSize: "clamp(2.1rem, 4.6vw, 3.5rem)" }}>
              {words.map((w, i) => (
                <Fragment key={i}>
                {i === breakAt && i > 0 && <br />}
                <span className="inline-block dp-anim"
                      style={{ marginRight: "0.25em", color: breakAt > 0 && i >= breakAt ? theme.accent : "#fff",
                               animation: `dp-rise .75s cubic-bezier(.22,1,.36,1) ${0.35 + i * 0.09}s both` }}>
                  {w}
                </span>
                </Fragment>
              ))}
            </h1>
            <div className="dp-anim" style={{ animation: "dp-rise .8s cubic-bezier(.22,1,.36,1) .85s both" }}>
              <p className="mt-3 text-zinc-300 md:text-lg" style={{ fontFamily: F_BODY }}>{product.subtitle}</p>
              <span className="inline-flex items-center gap-2 mt-4 text-xs px-3 py-1.5 rounded-sm text-zinc-300"
                    style={{ border: "1px solid #2a2a2f", background: "rgba(16,16,19,0.8)", fontFamily: F_MONO }}>
                <Car size={13} color={theme.accent} /> {product.fitment}
              </span>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-xs uppercase text-zinc-500" style={{ fontFamily: F_MONO, letterSpacing: "0.12em" }}>Precio del build</span>
                <span className="text-2xl font-bold" style={{ color: theme.accent, fontFamily: F_MONO }}>{priced(product.basePrice)}</span>
              </div>
              <div className="mt-6">
                <Button onClick={onStart}>Configurar mi build <ChevronRight size={16} /></Button>
              </div>
            </div>
          </div>

          {/* ---- foto con su fondo original ---- */}
          <div className="order-1 md:order-2">
            <div ref={frameRef} onPointerMove={onMove} onPointerLeave={onLeave}
                 className="relative w-full"
                 style={{ aspectRatio: "1200 / 1041", "--mx": 0, "--my": 0 }}>
              {/* marco que se revela con el barrido */}
              <div className="absolute inset-0 overflow-hidden rounded-md dp-anim"
                   style={{ border: "1px solid #2a2a2f", boxShadow: "0 30px 70px rgba(0,0,0,0.6)",
                            animation: "dp-wipe 1.05s cubic-bezier(.77,0,.18,1) .15s both" }}>
                {/* acercamiento lento de cámara */}
                <div className="absolute inset-0 dp-anim" style={{ animation: "dp-zoom 2.6s cubic-bezier(.22,1,.36,1) .15s both" }}>
                  <img src={PRODUCT_BG} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full"
                       style={{ objectFit: "cover", transform: "translate3d(calc(var(--mx) * -3px), calc(var(--my) * -2px), 0) scale(1.03)",
                                transition: "transform .5s cubic-bezier(.22,1,.36,1)" }} />
                  <img src={PRODUCT_TRUCK} alt={product.title} className="absolute inset-0 w-full h-full"
                       style={{ objectFit: "cover", transform: "translate3d(calc(var(--mx) * 3px), calc(var(--my) * 2px), 0) scale(1.03)",
                                transition: "transform .5s cubic-bezier(.22,1,.36,1)",
                                filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.35))" }} />
                </div>
                {/* viñeta + líneas de escaneo de marca */}
                <div className="absolute inset-0" aria-hidden="true" style={{ pointerEvents: "none",
                     background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(8,8,10,0.55) 100%)" }} />
                <div className="absolute inset-0" aria-hidden="true" style={{ pointerEvents: "none", opacity: 0.35,
                     backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 4px)" }} />
                {/* destello rojo que cruza la foto una vez al abrir */}
                <div className="absolute inset-y-0 dp-anim" aria-hidden="true"
                     style={{ width: "45%", left: 0, pointerEvents: "none", mixBlendMode: "screen",
                              background: `linear-gradient(100deg, transparent 0%, ${theme.accentGlow} 50%, transparent 100%)`,
                              animation: "dp-sweep 1.5s cubic-bezier(.45,0,.2,1) 1.05s both" }} />
              </div>

              {/* borde rojo que acompaña al barrido */}
              <div className="absolute inset-y-0 dp-anim" aria-hidden="true"
                   style={{ width: 3, left: 0, background: theme.accent, boxShadow: `0 0 18px ${theme.accentGlow}`, pointerEvents: "none",
                            animation: "dp-edge 1.05s cubic-bezier(.77,0,.18,1) .15s both" }} />

              {/* corchetes HUD */}
              {[["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h], i) => (
                <span key={i} aria-hidden="true" className="absolute dp-anim"
                      style={{ [v]: -8, [h]: -8, width: 26, height: 26, pointerEvents: "none",
                               [`border${v === "top" ? "Top" : "Bottom"}`]: `2px solid ${theme.accent}`,
                               [`border${h === "left" ? "Left" : "Right"}`]: `2px solid ${theme.accent}`,
                               animation: `dp-pop .5s cubic-bezier(.22,1,.36,1) ${1.0 + i * 0.07}s both` }} />
              ))}

              {/* marcadores técnicos sobre la camioneta */}
              {PRODUCT_PINS.map((p, i) => (
                <div key={i} className="absolute dp-anim" style={{ left: `${p.x}%`, top: `${p.y}%`, pointerEvents: "none",
                     animation: `dp-fade .5s ease-out ${1.6 + i * 0.18}s both` }}>
                  <span className="absolute rounded-full" style={{ width: 10, height: 10, left: -5, top: -5,
                        background: theme.accent, boxShadow: `0 0 0 3px rgba(10,10,11,0.6), 0 0 14px ${theme.accentGlow}` }} />
                  <span className="absolute rounded-full dp-anim" style={{ width: 10, height: 10, left: -5, top: -5,
                        border: `2px solid ${theme.accent}`, animation: `dp-ping 2.2s ease-out ${2 + i * 0.3}s infinite` }} />
                  <div className="absolute hidden sm:flex items-center"
                       style={{ top: -11, [p.side === "l" ? "right" : "left"]: 6, flexDirection: p.side === "l" ? "row-reverse" : "row" }}>
                    <span className="dp-anim" style={{ display: "block", width: 34, height: 1, background: theme.accent,
                          transformOrigin: p.side === "l" ? "right" : "left",
                          animation: `dp-line .45s ease-out ${1.75 + i * 0.18}s both` }} />
                    <span className="whitespace-nowrap text-[10px] font-bold uppercase px-2 py-1 rounded-sm"
                          style={{ fontFamily: F_MONO, letterSpacing: "0.1em", color: "#fff",
                                   background: "rgba(10,10,11,0.82)", border: `1px solid ${theme.accentLine}`,
                                   backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
                      {p.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============================================================================
   PÁGINA DE PRODUCTO — build preconfigurado (se abre desde el callout)
   Flujo: ver lo que incluye -> elegir 37" o 40" -> instalación y extras -> enviar.
   ==========================================================================*/
function ProductView() {
  const { product, finalOpts, leads, setLeads, setView, theme } = useStore();
  const [tire, setTire] = useState("");
  const [airRide, setAirRide] = useState("");
  const [extras, setExtras] = useState([]);
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);
  const extrasRef = useRef(null);
  const tiresRef = useRef(null);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  const tireObj = product.tires.find((t) => t.id === tire);
  const applies = (o) => !o.onlyTire || o.onlyTire === tire;

  // Si cambia la medida, se quitan los extras que ya no aplican (p.ej. trimming al pasar a 37")
  useEffect(() => {
    setExtras((xs) => xs.filter((id) => {
      const o = finalOpts.find((f) => f.id === id);
      return o && (!o.onlyTire || o.onlyTire === tire);
    }));
  }, [tire, finalOpts]);

  const chosen = finalOpts.filter((o) => extras.includes(o.id) && applies(o));
  const toggle = (id) => setExtras((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const priced = (n) => (Number(n) > 0 ? money(n) : "A cotizar");

  const lines = [
    { k: product.title, v: priced(product.basePrice) },
    tireObj && { k: `Llantas ${tireObj.label}`, v: priced(tireObj.price) },
    ...chosen.map((o) => ({ k: o.label, v: money(o.price) })),
    airRide && { k: "Air ride de fábrica", v: airRide === "si" ? "Sí" : "No" },
  ].filter(Boolean);
  const total = (Number(product.basePrice) || 0) + (Number(tireObj?.price) || 0) + chosen.reduce((a, o) => a + o.price, 0);
  const pending = !(product.basePrice > 0) || (tireObj && !(tireObj.price > 0));

  const pickTire = (id) => {
    setTire(id);
    setTimeout(() => extrasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 90);
  };

  const canSend = tire && contact.name.trim() && contact.phone.trim();
  const submit = () => {
    setLeads([{
      id: Date.now(),
      when: new Date().toLocaleString("es-US", { dateStyle: "short", timeStyle: "short" }),
      vehicle: product.fitment,
      stage: product.title,
      wheel: `Llantas ${tireObj.label}`,
      addons: chosen.map((o) => o.label),
      airRide: airRide ? (airRide === "si" ? "Sí" : "No") : "—",
      notes: [`${contact.name.trim()} · ${contact.phone.trim()}`, notes.trim()].filter(Boolean).join(" — "),
      total,
    }, ...leads]);
    setSent(true);
  };

  const stepHead = (n, title, sub, done) => (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex items-center justify-center shrink-0 rounded-sm font-bold"
           style={{ width: 44, height: 44, fontFamily: F_DISPLAY, fontSize: 20,
                    background: done ? theme.accent : "#1a1a1e", color: done ? "#0a0a0b" : theme.accent,
                    border: `1px solid ${theme.accentLine}` }}>
        {done ? <Check size={20} strokeWidth={3} /> : n}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white uppercase leading-none" style={{ fontFamily: F_DISPLAY }}>{title}</h3>
        {sub && <p className="mt-1.5 text-sm text-zinc-400" style={{ fontFamily: F_BODY }}>{sub}</p>}
      </div>
    </div>
  );

  const field = { background: "#101013", color: "#f2f2f4", border: "1px solid #2a2a2f", fontFamily: F_BODY };

  return (
    <div>
      {/* ---- Cabecera del producto: foto original animada (entrada + profundidad + callouts técnicos) ---- */}
      <ProductHero product={product} priced={priced} theme={theme}
                   onBack={() => setView("client")}
                   onStart={() => tiresRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />

      <div className="max-w-6xl mx-auto px-6 pt-14 pb-24 space-y-16">
        {/* ---- Lo que incluye ---- */}
        <Reveal>
          <section>
            <div className="mb-6">
              <Eyebrow>Lo que incluye</Eyebrow>
              <h2 className="text-2xl md:text-3xl font-bold text-white uppercase leading-none" style={{ fontFamily: F_DISPLAY }}>
                Componentes del build
              </h2>
              <p className="mt-2 text-sm text-zinc-400 max-w-2xl" style={{ fontFamily: F_BODY }}>
                Estas son algunas de las piezas principales que trae. El Team Dynopro las instala y calibra como un solo sistema.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {product.includes.map((it) => (
                <article key={it.id} className="flex flex-col rounded-md overflow-hidden"
                         style={{ background: "#141417", border: "1px solid #2a2a2f" }}>
                  <div className="bg-white flex items-center justify-center" style={{ aspectRatio: "16 / 10" }}>
                    {it.img
                      ? <img src={it.img} alt={it.name} className="w-full h-full p-3" style={{ objectFit: "contain" }} loading="lazy" />
                      : <ImageIcon size={28} color="#a1a1aa" />}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[10px] font-bold uppercase" style={{ color: theme.accent, fontFamily: F_MONO, letterSpacing: "0.14em" }}>{it.brand}</span>
                    <h4 className="mt-1 text-lg font-bold text-white uppercase leading-tight" style={{ fontFamily: F_DISPLAY }}>{it.name}</h4>
                    {it.sku && <span className="text-[11px] text-zinc-500 mt-1" style={{ fontFamily: F_MONO }}>SKU {it.sku}</span>}
                    <p className="mt-3 text-sm text-zinc-400 leading-relaxed flex-1" style={{ fontFamily: F_BODY }}>{it.desc}</p>
                    {it.url && (
                      <a href={it.url} target="_blank" rel="noopener noreferrer"
                         className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase font-semibold text-zinc-300 hover:text-white transition"
                         style={{ fontFamily: F_MONO, letterSpacing: "0.08em" }}>
                        Ficha del fabricante <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ---- Paso 1: medida de llanta ---- */}
        <Reveal>
          <section ref={tiresRef} style={{ scrollMarginTop: 90 }}>
            {stepHead("1", "Elige tu medida de llanta", "El build está preparado para 37\" o 40\". Escoge cuál vas a correr.", !!tire)}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.tires.map((t) => {
                const on = tire === t.id;
                return (
                  <button key={t.id} onClick={() => pickTire(t.id)}
                          className="text-left p-6 rounded-md transition hover:brightness-110"
                          style={{ background: "#141417", border: `1px solid ${on ? theme.accent : "#2a2a2f"}`,
                                   boxShadow: on ? `0 0 26px ${theme.accentGlow}` : "none" }}>
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-white leading-none" style={{ fontFamily: F_DISPLAY, fontSize: "3.4rem" }}>{t.label}</span>
                      {on && <CheckCircle2 size={22} color={theme.accent} />}
                    </div>
                    <span className="block mt-1 text-xs uppercase text-zinc-500" style={{ fontFamily: F_MONO, letterSpacing: "0.12em" }}>Llantas</span>
                    <p className="mt-3 text-sm text-zinc-400" style={{ fontFamily: F_BODY }}>{t.note}</p>
                    <span className="block mt-4 text-base font-bold text-white" style={{ fontFamily: F_MONO }}>{priced(t.price)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </Reveal>

        {/* ---- Paso 2: instalación y extras (se desbloquea al elegir llanta) ---- */}
        <section ref={extrasRef} style={{ scrollMarginTop: 90 }}>
          {stepHead("2", "Instalación y extras", "Último paso: dinos cómo viene tu truck y qué servicios quieres sumar.", false)}
          {!tire ? (
            <div className="rounded-md p-8 text-center" style={{ background: "#101013", border: "1px dashed #2a2a2f" }}>
              <Lock size={20} color={theme.accent} className="mx-auto" />
              <p className="mt-2 text-sm text-zinc-400" style={{ fontFamily: F_BODY }}>Elige primero la medida de llanta.</p>
            </div>
          ) : (
            <div className="rounded-md p-5" style={{ background: "#101013", border: "1px solid #2a2a2f" }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4" style={{ borderBottom: "1px solid #1e1e22" }}>
                <span className="text-sm text-zinc-300" style={{ fontFamily: F_BODY }}>
                  ¿Tu Tundra trae <b className="text-white">Air Ride System</b> de fábrica?
                </span>
                <div className="flex gap-2">
                  {[["si", "Sí"], ["no", "No"]].map(([v, t]) => {
                    const on = airRide === v;
                    return (
                      <button key={v} onClick={() => setAirRide(on ? "" : v)}
                              className="px-5 py-2 text-xs uppercase font-semibold rounded-sm transition hover:brightness-110"
                              style={{ fontFamily: F_DISPLAY, letterSpacing: "0.06em",
                                       background: on ? theme.accent : "#1c1c20", color: on ? "#0a0a0b" : "#c9c9cf",
                                       border: `1px solid ${on ? theme.accent : "#2c2c31"}` }}>{t}</button>
                    );
                  })}
                </div>
              </div>
              {airRide === "si" && (
                <div className="flex gap-3 p-3 mb-4 rounded-sm" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.35)" }}>
                  <AlertTriangle size={16} color="#eab308" className="shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-300" style={{ fontFamily: F_BODY }}>
                    El kit BDS 7" no es compatible con Air Ride de fábrica. Envía tu solicitud igual: el Team te contacta para revisar la mejor opción para tu truck.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {finalOpts.map((o) => {
                  const ok = applies(o);
                  const on = ok && extras.includes(o.id);
                  return (
                    <button key={o.id} onClick={() => ok && toggle(o.id)} disabled={!ok}
                            className="w-full flex items-center gap-3 p-3 rounded-sm text-left transition hover:brightness-110 disabled:cursor-not-allowed"
                            style={{ background: on ? theme.accentSoft : "#141417", opacity: ok ? 1 : 0.45,
                                     border: `1px solid ${on ? theme.accent : "#2a2a2f"}` }}>
                      <span className="flex items-center justify-center rounded-sm shrink-0"
                            style={{ width: 20, height: 20, background: on ? theme.accent : "transparent",
                                     border: `1px solid ${on ? theme.accent : "#3a3a40"}` }}>
                        {on && <Check size={13} color="#0a0a0b" strokeWidth={3} />}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm text-white" style={{ fontFamily: F_BODY }}>{o.label}</span>
                        <span className="block text-[11px] text-zinc-500 mt-0.5" style={{ fontFamily: F_MONO }}>
                          {ok ? o.note : `No aplica con llantas de ${tireObj.label}.`}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-white shrink-0" style={{ fontFamily: F_MONO }}>{money(o.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ---- Paso 3: resumen y envío ---- */}
        {tire && (
          <Reveal>
            <section style={carbon} className="rounded-md p-6 md:p-8">
              <Eyebrow>Resumen</Eyebrow>
              <h3 className="text-2xl md:text-3xl font-bold text-white uppercase leading-none" style={{ fontFamily: F_DISPLAY }}>
                Pide tu build al Team Dynopro
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="rounded-md p-5" style={{ background: "#101013", border: "1px solid #2a2a2f" }}>
                  {lines.map((l, i) => (
                    <div key={i} className="flex justify-between gap-4 py-2 text-sm" style={{ borderTop: i ? "1px solid #1e1e22" : "none" }}>
                      <span className="text-zinc-300" style={{ fontFamily: F_BODY }}>{l.k}</span>
                      <span className="text-white font-semibold shrink-0" style={{ fontFamily: F_MONO }}>{l.v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 mt-1" style={{ borderTop: `1px solid ${theme.accentLine}` }}>
                    <span className="text-sm uppercase font-bold text-white" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.06em" }}>Total estimado</span>
                    <span className="text-lg font-bold" style={{ color: theme.accent, fontFamily: F_MONO }}>{money(total)}</span>
                  </div>
                  {pending && (
                    <p className="mt-2 text-[11px] text-zinc-500" style={{ fontFamily: F_MONO }}>
                      › Lo marcado "A cotizar" no está sumado. El Team te confirma el precio final.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {sent ? (
                    <div className="flex items-center gap-3 p-4 rounded-md" style={{ background: theme.accentSoft, border: `1px solid ${theme.accent}` }}>
                      <CheckCircle2 size={22} color={theme.accent} />
                      <div>
                        <p className="text-sm font-bold text-white uppercase" style={{ fontFamily: F_DISPLAY }}>¡Solicitud enviada!</p>
                        <p className="text-xs text-zinc-400" style={{ fontFamily: F_BODY }}>El Team Dynopro te contacta para confirmar tu build.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block">
                          <span className="flex items-center gap-1.5 text-xs uppercase text-zinc-500 mb-1.5 font-semibold" style={{ letterSpacing: "0.12em", fontFamily: F_MONO }}><User size={12} /> Nombre</span>
                          <input type="text" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })}
                                 className="w-full px-3 py-3 text-sm outline-none rounded-sm" style={field} />
                        </label>
                        <label className="block">
                          <span className="flex items-center gap-1.5 text-xs uppercase text-zinc-500 mb-1.5 font-semibold" style={{ letterSpacing: "0.12em", fontFamily: F_MONO }}><Phone size={12} /> Teléfono / WhatsApp</span>
                          <input type="text" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                                 className="w-full px-3 py-3 text-sm outline-none rounded-sm" style={field} />
                        </label>
                      </div>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                                placeholder="Notas para el Team (opcional): trim de tu Tundra, fecha deseada, dudas…"
                                className="w-full p-3 text-sm outline-none rounded-sm resize-none" style={field} />
                      <Button onClick={submit} disabled={!canSend} full>
                        <Send size={16} /> Enviar al Team Dynopro
                      </Button>
                      {!canSend && (
                        <p className="text-[11px] text-zinc-500" style={{ fontFamily: F_MONO }}>› Escribe tu nombre y un teléfono para que te contactemos.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>
          </Reveal>
        )}
      </div>
    </div>
  );
}

function ClientView() {
  const { searched, resetAll, theme, stageId, wheelId, perfIds, armorIds,
          setPerfIds, setArmorIds, perf, armor,
          setVehicle, setSearched, resetBuild, setView } = useStore();
  const configRef = useRef(null);

  // Builds pre-armados que aparecen en la tira bajo el hero (sumar aquí los próximos vehículos)
  const prebuilt = [
    { id: "tundra-23", name: "Toyota Tundra", years: "2023 – ON", tag: '37" – 40"',
      img: TUNDRA_CUTOUT, onOpen: () => setView("product") },
  ];

  return (
    <div>
      <Hero />
      <VehicleStrip items={prebuilt} />
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
    if (f.type === "select") {
      // options puede ser un array fijo, o una función (it) => array,
      // para desplegables dependientes (p.ej. Modelo según la Marca de la fila).
      const opts = typeof f.options === "function" ? f.options(it) : f.options;
      return (
        <select {...common} value={it[f.k] ?? ""} onChange={(e) => patch(it.id, f.k, f.parse ? f.parse(e.target.value) : e.target.value)}>
          {f.placeholder && <option value="" style={{ background: "#141417" }}>{f.placeholder}</option>}
          {opts.map((o) => (
            <option key={String(o.v ?? o)} value={o.v ?? o} style={{ background: "#141417" }}>{o.t ?? o}</option>
          ))}
        </select>
      );
    }
    if (f.type === "image")
      return (
        <div className="flex items-center gap-3">
          <div className="shrink-0 overflow-hidden rounded-sm"
               style={{ width: 52, height: 40, background: "#0a0a0b", border: "1px solid #2a2a2f" }}>
            {it[f.k]
              ? <img src={it[f.k]} alt="" className="w-full h-full" style={{ objectFit: "cover" }}
                     onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} color="#3a3a40" /></div>}
          </div>
          <input {...common} type="text" value={it[f.k] ?? ""} placeholder="https://…"
                 onChange={(e) => patch(it.id, f.k, e.target.value)} />
        </div>
      );
    return (
      <input {...common} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
        value={it[f.k] ?? ""}
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

  // Helpers inmutables sobre el árbol makes -> models -> trims
  const setMakes = (makes) => setVehCat({ ...vehCat, makes });
  const patchMake = (mid, k, v) => setMakes(vehCat.makes.map((m) => (m.id === mid ? { ...m, [k]: v } : m)));
  const mapModels = (mid, fn) => setMakes(vehCat.makes.map((m) => (m.id === mid ? { ...m, models: fn(m.models) } : m)));
  const patchModel = (mid, did, k, v) => mapModels(mid, (ms) => ms.map((d) => (d.id === did ? { ...d, [k]: v } : d)));
  const mapTrims = (mid, did, fn) => mapModels(mid, (ms) => ms.map((d) => (d.id === did ? { ...d, trims: fn(d.trims || []) } : d)));
  const patchTrim = (mid, did, i, k, v) =>
    mapTrims(mid, did, (ts) => ts.map((t, idx) => (idx === i ? { ...t, [k]: k === "name" ? v : Number(v) } : t)));

  const dashBtn = {
    fontFamily: F_DISPLAY, letterSpacing: "0.08em", background: "#1c1c20",
    color: "#e7e7ea", border: `1px dashed ${theme.accentLine}`,
  };

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

        <p className="text-xs text-zinc-500" style={{ fontFamily: F_MONO }}>
          › Cada trim tiene un rango de años (desde / hasta). El cliente solo verá los trims válidos para el año que elija.
        </p>

        {vehCat.makes.map((m) => (
          <div key={m.id} className="rounded-md p-4" style={{ background: "#101013", border: "1px solid #22222a" }}>
            {/* Marca */}
            <div className="flex items-end gap-3 mb-3">
              <div className="flex-1 max-w-xs">
                <AdminField label="Marca">
                  <input value={m.name} className="w-full px-3 py-2 text-sm outline-none rounded-sm" style={inputStyle}
                         onChange={(e) => patchMake(m.id, "name", e.target.value)} />
                </AdminField>
              </div>
              <button onClick={() => setMakes(vehCat.makes.filter((x) => x.id !== m.id))}
                      className="text-zinc-600 hover:text-red-400 transition pb-2" title="Eliminar marca"><Trash2 size={15} /></button>
            </div>

            {/* Modelos de la marca */}
            <div className="space-y-3 pl-3" style={{ borderLeft: `2px solid ${theme.accentLine}` }}>
              {(m.models || []).map((d) => (
                <div key={d.id} className="rounded-sm p-3" style={{ background: "#0c0c0f", border: "1px solid #22222a" }}>
                  <div className="flex items-end gap-3 mb-2">
                    <div className="flex-1 max-w-xs">
                      <AdminField label="Modelo">
                        <input value={d.name} className="w-full px-3 py-2 text-sm outline-none rounded-sm" style={inputStyle}
                               onChange={(e) => patchModel(m.id, d.id, "name", e.target.value)} />
                      </AdminField>
                    </div>
                    <button onClick={() => mapModels(m.id, (ms) => ms.filter((x) => x.id !== d.id))}
                            className="text-zinc-600 hover:text-red-400 transition pb-2" title="Eliminar modelo"><Trash2 size={14} /></button>
                  </div>

                  {/* Trims del modelo */}
                  <span className="block text-[10px] uppercase text-zinc-500 mb-1.5 font-semibold"
                        style={{ letterSpacing: "0.12em", fontFamily: F_MONO }}>Trims / versiones</span>
                  <div className="space-y-2">
                    {(d.trims || []).map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={t.name} placeholder="Nombre del trim"
                               className="flex-1 px-3 py-1.5 text-sm outline-none rounded-sm" style={inputStyle}
                               onChange={(e) => patchTrim(m.id, d.id, i, "name", e.target.value)} />
                        <input type="number" value={t.yf} title="Año desde"
                               className="w-20 px-2 py-1.5 text-sm outline-none rounded-sm" style={inputStyle}
                               onChange={(e) => patchTrim(m.id, d.id, i, "yf", e.target.value)} />
                        <span className="text-zinc-600 text-xs">–</span>
                        <input type="number" value={t.yt} title="Año hasta"
                               className="w-20 px-2 py-1.5 text-sm outline-none rounded-sm" style={inputStyle}
                               onChange={(e) => patchTrim(m.id, d.id, i, "yt", e.target.value)} />
                        <button onClick={() => mapTrims(m.id, d.id, (ts) => ts.filter((_, idx) => idx !== i))}
                                className="text-zinc-600 hover:text-red-400 transition" title="Eliminar trim"><Trash2 size={13} /></button>
                      </div>
                    ))}
                    <button onClick={() => mapTrims(m.id, d.id, (ts) => [...ts, { name: "Nuevo trim", yf: vehCat.yearFrom, yt: vehCat.yearTo }])}
                            className="text-xs uppercase font-semibold px-3 py-1.5 rounded-sm transition hover:brightness-110 flex items-center gap-1.5"
                            style={dashBtn}><Plus size={12} /> Trim</button>
                  </div>
                </div>
              ))}
              <button onClick={() => mapModels(m.id, (ms) => [...ms, { id: "md" + Date.now(), name: "Nuevo modelo", trims: [] }])}
                      className="text-xs uppercase font-semibold px-3 py-1.5 rounded-sm transition hover:brightness-110 flex items-center gap-1.5"
                      style={dashBtn}><Plus size={13} /> Modelo</button>
            </div>
          </div>
        ))}

        <button onClick={() => setMakes([...vehCat.makes, { id: "mk" + Date.now(), name: "", models: [] }])}
                className="w-full py-2.5 text-xs uppercase font-semibold rounded-sm transition hover:brightness-110 flex items-center justify-center gap-2"
                style={dashBtn}>
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
                {["Fecha", "Vehículo", "Build / Stage", "Rines / Llantas", "Add-ons", "Air ride", "Notas", "Estimado", ""].map((h) => (
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
                  <td className="px-3 py-3 text-xs text-zinc-300 whitespace-nowrap" style={{ fontFamily: F_BODY }}>{l.airRide || "—"}</td>
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

function EventsManager() {
  const { events, setEvents } = useStore();
  return (
    <CatalogEditor
      title="Evento" icon={Calendar}
      items={events} setItems={setEvents}
      makeNew={() => ({ id: "ev" + Date.now(), title: "Nuevo evento", date: "", location: "", desc: "", imageUrl: "" })}
      fields={[
        { k: "imageUrl", label: "Foto (URL)", type: "image",    span: "md:col-span-12" },
        { k: "title",    label: "Título",     type: "text",     span: "md:col-span-6" },
        { k: "date",     label: "Fecha",      type: "date",     span: "md:col-span-3" },
        { k: "location", label: "Ubicación",  type: "text",     span: "md:col-span-3" },
        { k: "desc",     label: "Descripción", type: "textarea", span: "md:col-span-12" },
      ]}
    />
  );
}

function CoursesManager() {
  const { courses, setCourses } = useStore();
  return (
    <CatalogEditor
      title="Curso" icon={GraduationCap}
      items={courses} setItems={setCourses}
      makeNew={() => ({ id: "co" + Date.now(), title: "Nuevo curso", level: "Principiante", duration: "", desc: "", imageUrl: "" })}
      fields={[
        { k: "imageUrl", label: "Foto (URL)", type: "image",  span: "md:col-span-12" },
        { k: "title",    label: "Título",     type: "text",   span: "md:col-span-6" },
        { k: "level",    label: "Nivel",      type: "select", span: "md:col-span-3",
          options: ["Principiante", "Intermedio", "Avanzado", "Pro / Certificación"] },
        { k: "duration", label: "Duración",   type: "text",   span: "md:col-span-3" },
        { k: "desc",     label: "Temario / descripción", type: "textarea", span: "md:col-span-12" },
      ]}
    />
  );
}

function GalleryManager() {
  const { gallery, setGallery, vehCat } = useStore();
  const makeOpts = vehCat.makes.map((m) => m.name).filter(Boolean);
  const modelOpts = (it) => {
    const mk = vehCat.makes.find((m) => m.name === it.make);
    return (mk?.models || []).map((md) => md.name).filter(Boolean);
  };
  return (
    <CatalogEditor
      title="Foto de Galería" icon={ImagePlus}
      items={gallery} setItems={setGallery}
      note="El Texto Opcional queda vacío por defecto. Si lo llenas, aparece como overlay sobre la foto; si no, la tarjeta muestra solo la imagen."
      makeNew={() => ({ id: "g" + Date.now(), imageUrl: "", make: "", model: "", optionalText: "" })}
      fields={[
        { k: "imageUrl",     label: "Foto (URL)", type: "image",  span: "md:col-span-12" },
        { k: "make",         label: "Marca",      type: "select", span: "md:col-span-4",
          placeholder: "Todas", options: makeOpts },
        { k: "model",        label: "Modelo",     type: "select", span: "md:col-span-4",
          placeholder: "—", options: modelOpts },
        { k: "optionalText", label: "Texto opcional (overlay)", type: "text", span: "md:col-span-4" },
      ]}
    />
  );
}

/* ============================================================================
   SUB-PÁGINAS DE USUARIO (Eventos · Cursos · Galería)
   ==========================================================================*/
function PageHead({ eyebrow, title, sub }) {
  return (
    <div className="mb-10">
      <Eyebrow>{eyebrow}</Eyebrow>
      <SectionTitle sub={sub}>{title}</SectionTitle>
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="py-20 text-center">
      <Icon size={38} color="#3a3a40" className="mx-auto" />
      <p className="mt-4 text-zinc-500" style={{ fontFamily: F_BODY }}>{text}</p>
    </div>
  );
}

/* Imagen con placeholder: si la URL falla, muestra un fondo carbón con icono */
function SafeImg({ src, alt, ratio = "16 / 9", className = "" }) {
  const [ok, setOk] = useState(true);
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: ratio, background: "#0f0f12" }}>
      {ok && src ? (
        <img src={src} alt={alt || ""} className="absolute inset-0 w-full h-full"
             style={{ objectFit: "cover" }} loading="lazy" onError={() => setOk(false)} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={carbon}>
          <ImageIcon size={26} color="#3a3a40" />
        </div>
      )}
    </div>
  );
}

function EventsView() {
  const { events, theme } = useStore();
  const fmt = (d) => {
    if (!d) return "Por confirmar";
    const dt = new Date(d + "T00:00:00");
    return isNaN(dt) ? d : dt.toLocaleDateString("es-US", { day: "2-digit", month: "long", year: "numeric" });
  };
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <PageHead eyebrow="Comunidad Dynopro" title="Eventos"
                sub="Trail days, meets y activaciones del Team Dynopro. Nos vemos en el fango." />
      {events.length === 0 ? (
        <EmptyState icon={Calendar} text="No hay eventos programados por ahora. Vuelve pronto." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => (
            <Reveal key={ev.id}>
              <article className="flex flex-col h-full rounded-md overflow-hidden"
                       style={{ background: "#141417", border: "1px solid #2a2a2f" }}>
                <SafeImg src={ev.imageUrl} alt={ev.title} />
                <div className="p-5 flex flex-col flex-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase mb-2"
                        style={{ color: theme.accent, fontFamily: F_MONO, letterSpacing: "0.1em" }}>
                    <Calendar size={13} /> {fmt(ev.date)}
                  </span>
                  <h3 className="text-xl font-bold text-white uppercase leading-tight" style={{ fontFamily: F_DISPLAY }}>{ev.title}</h3>
                  {ev.location && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400 mt-1.5" style={{ fontFamily: F_BODY }}>
                      <MapPin size={14} color={theme.accent} /> {ev.location}
                    </span>
                  )}
                  {ev.desc && <p className="mt-3 text-sm text-zinc-400 leading-relaxed" style={{ fontFamily: F_BODY }}>{ev.desc}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function CoursesView() {
  const { courses, theme } = useStore();
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <PageHead eyebrow="Academia Dynopro" title="Cursos"
                sub="Formación técnica en suspensión, performance y build 4x4. Teoría y taller práctico." />
      {courses.length === 0 ? (
        <EmptyState icon={GraduationCap} text="Aún no hay cursos publicados. Vuelve pronto." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((co) => (
            <Reveal key={co.id}>
              <article className="flex flex-col h-full rounded-md overflow-hidden"
                       style={{ background: "#141417", border: "1px solid #2a2a2f" }}>
                <SafeImg src={co.imageUrl} alt={co.title} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {co.level && (
                      <span className="text-[10px] px-2 py-0.5 rounded-sm uppercase font-semibold"
                            style={{ background: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.accentLine}`, fontFamily: F_MONO, letterSpacing: "0.1em" }}>
                        {co.level}
                      </span>
                    )}
                    {co.duration && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase text-zinc-400" style={{ fontFamily: F_MONO, letterSpacing: "0.1em" }}>
                        <Clock size={12} /> {co.duration}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase leading-tight" style={{ fontFamily: F_DISPLAY }}>{co.title}</h3>
                  {co.desc && <p className="mt-3 text-sm text-zinc-400 leading-relaxed" style={{ fontFamily: F_BODY }}>{co.desc}</p>}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryView() {
  const { gallery, vehCat, theme } = useStore();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  const makes = vehCat.makes.map((m) => m.name).filter(Boolean);
  const models = useMemo(() => {
    const mk = vehCat.makes.find((m) => m.name === make);
    return (mk?.models || []).map((md) => md.name).filter(Boolean);
  }, [vehCat.makes, make]);

  const shown = gallery.filter((g) => (!make || g.make === make) && (!model || g.model === model));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <PageHead eyebrow="Builds reales" title="Galería de Fotos"
                sub="Trabajos del taller. Filtra por marca y modelo para ver builds como el tuyo." />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 max-w-lg">
        <Select label="Marca" placeholder="Todas las marcas" value={make}
                onChange={(v) => { setMake(v); setModel(""); }} options={makes} />
        <Select label="Modelo" placeholder="Todos los modelos" value={model} disabled={!make}
                onChange={setModel} options={models} />
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={ImageIcon} text="No hay fotos para ese filtro todavía." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {shown.map((g) => (
            <Reveal key={g.id}>
              {/* Regla: solo foto. El overlay de texto aparece SOLO si optionalText tiene contenido. */}
              <div className="relative rounded-md overflow-hidden group"
                   style={{ border: "1px solid #2a2a2f" }}>
                <SafeImg src={g.imageUrl} alt={g.optionalText || `${g.make} ${g.model}`} ratio="1 / 1" />
                {g.optionalText && g.optionalText.trim() !== "" && (
                  <div className="absolute inset-x-0 bottom-0 p-3"
                       style={{ background: "linear-gradient(180deg, transparent, rgba(8,8,10,0.9))" }}>
                    <span className="text-xs font-semibold uppercase text-white"
                          style={{ fontFamily: F_DISPLAY, letterSpacing: "0.04em", textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
                      {g.optionalText}
                    </span>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductManager() {
  const { product, setProduct, finalOpts, setFinalOpts } = useStore();
  const set = (k, v) => setProduct({ ...product, [k]: v });
  const patchTire = (id, k, v) => set("tires", product.tires.map((t) => (t.id === id ? { ...t, [k]: v } : t)));
  const inp = "w-full px-3 py-2 text-sm outline-none rounded-sm";
  return (
    <>
      <AdminPanel title="Producto destacado · Build preconfigurado" icon={Flame}>
        <div className="space-y-4">
          <p className="text-xs text-zinc-500" style={{ fontFamily: F_MONO }}>› Precio en 0 = se muestra "A cotizar" y no suma al total.</p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6"><AdminField label="Título">
              <input value={product.title} onChange={(e) => set("title", e.target.value)} className={inp} style={inputStyle} /></AdminField></div>
            <div className="md:col-span-3"><AdminField label="Precio del build ($)">
              <input type="number" value={product.basePrice} onChange={(e) => set("basePrice", Number(e.target.value))} className={inp} style={inputStyle} /></AdminField></div>
            <div className="md:col-span-3"><AdminField label="Aplicación">
              <input value={product.fitment} onChange={(e) => set("fitment", e.target.value)} className={inp} style={inputStyle} /></AdminField></div>
            <div className="md:col-span-12"><AdminField label="Subtítulo">
              <input value={product.subtitle} onChange={(e) => set("subtitle", e.target.value)} className={inp} style={inputStyle} /></AdminField></div>
          </div>
          {product.tires.map((t) => (
            <div key={t.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-md p-3" style={{ background: "#101013", border: "1px solid #22222a" }}>
              <div className="md:col-span-2 flex items-end pb-2">
                <span className="text-lg font-bold text-white" style={{ fontFamily: F_DISPLAY }}>Llantas {t.label}</span>
              </div>
              <div className="md:col-span-3"><AdminField label="Precio ($)">
                <input type="number" value={t.price} onChange={(e) => patchTire(t.id, "price", Number(e.target.value))} className={inp} style={inputStyle} /></AdminField></div>
              <div className="md:col-span-7"><AdminField label="Nota">
                <input value={t.note} onChange={(e) => patchTire(t.id, "note", e.target.value)} className={inp} style={inputStyle} /></AdminField></div>
            </div>
          ))}
        </div>
      </AdminPanel>

      <CatalogEditor
        title="Componente incluido" icon={Wrench}
        items={product.includes} setItems={(v) => set("includes", v)}
        makeNew={() => ({ id: "inc" + Date.now(), brand: "", name: "Nuevo componente", sku: "", desc: "", img: "", url: "" })}
        fields={[
          { k: "img",   label: "Foto (URL)", type: "image", span: "md:col-span-12" },
          { k: "brand", label: "Marca",  type: "text", span: "md:col-span-3" },
          { k: "name",  label: "Nombre", type: "text", span: "md:col-span-6" },
          { k: "sku",   label: "SKU",    type: "text", span: "md:col-span-3" },
          { k: "url",   label: "Enlace del fabricante", type: "text", span: "md:col-span-12" },
          { k: "desc",  label: "Descripción", type: "textarea", span: "md:col-span-12" },
        ]}
      />

      <CatalogEditor
        title="Opción final (instalación y extras)" icon={Settings}
        items={finalOpts} setItems={setFinalOpts}
        note='"Aplica a" limita la opción a una medida de llanta (p.ej. trimming solo para 40").'
        makeNew={() => ({ id: "opt" + Date.now(), label: "Nueva opción", price: 0, onlyTire: "", note: "" })}
        fields={[
          { k: "label",    label: "Nombre",     type: "text",   span: "md:col-span-6" },
          { k: "price",    label: "Precio ($)", type: "number", span: "md:col-span-3" },
          { k: "onlyTire", label: "Aplica a",   type: "select", span: "md:col-span-3",
            options: [{ v: "", t: "Todas" }, { v: "37", t: 'Solo 37"' }, { v: "40", t: 'Solo 40"' }] },
          { k: "note",     label: "Nota",       type: "text",   span: "md:col-span-12" },
        ]}
      />
    </>
  );
}

function AdminLogin() {
  const { setAuthed, theme, brand } = useStore();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");

  const submit = () => {
    if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) {
      setErr(""); setAuthed(true);
    } else {
      setErr("Usuario o clave incorrectos."); setPass("");
    }
  };
  const onKey = (e) => { if (e.key === "Enter") submit(); };

  const field = {
    background: "#101013", color: "#f2f2f4",
    border: "1px solid #2a2a2f", fontFamily: F_BODY,
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <div className="mx-auto" style={{ maxWidth: 430 }}>
        <div className="rounded-md p-7"
             style={{ ...carbon, border: "1px solid #2a2a2f", boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>

          <div className="flex items-center justify-center mb-5">
            <div className="flex items-center justify-center rounded-md"
                 style={{ width: 52, height: 52, background: theme.accentSoft,
                          border: `1px solid ${theme.accentLine}` }}>
              <Lock size={22} color={theme.accent} />
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="flex justify-center"><Eyebrow>Acceso restringido</Eyebrow></div>
            <h2 className="text-2xl font-bold text-white uppercase leading-none"
                style={{ fontFamily: F_DISPLAY }}>
              Panel Administrativo
            </h2>
            <p className="mt-2 text-xs text-zinc-500" style={{ fontFamily: F_BODY }}>
              Solo para el Team Dynopro.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="block text-xs uppercase text-zinc-500 mb-1.5 font-semibold"
                    style={{ letterSpacing: "0.14em", fontFamily: F_MONO }}>Usuario</span>
              <input type="text" value={user} onChange={(e) => setUser(e.target.value)} onKeyDown={onKey}
                     autoComplete="username" placeholder="Admin"
                     className="w-full px-3 py-3 text-sm outline-none rounded-sm" style={field} />
            </label>

            <label className="block">
              <span className="block text-xs uppercase text-zinc-500 mb-1.5 font-semibold"
                    style={{ letterSpacing: "0.14em", fontFamily: F_MONO }}>Clave</span>
              <div style={{ position: "relative" }}>
                <input type={show ? "text" : "password"} value={pass} onKeyDown={onKey}
                       onChange={(e) => setPass(e.target.value)} autoComplete="current-password"
                       placeholder="••••••••••"
                       className="w-full px-3 py-3 text-sm outline-none rounded-sm"
                       style={{ ...field, paddingRight: 44 }} />
                <button onClick={() => setShow((v) => !v)} type="button"
                        title={show ? "Ocultar clave" : "Mostrar clave"}
                        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
                        className="p-1.5 text-zinc-500 hover:text-zinc-200 transition">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {err && (
              <p className="text-xs px-3 py-2 rounded-sm"
                 style={{ color: "#fca5a5", background: "rgba(220,38,38,0.10)",
                          border: "1px solid rgba(220,38,38,0.35)", fontFamily: F_MONO }}>
                › {err}
              </p>
            )}

            <Button onClick={submit} full disabled={!user || !pass}>
              <Lock size={15} /> Ingresar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminView() {
  const { authed, setAuthed } = useStore();
  if (!authed) return <AdminLogin />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Backend Control · Simulado</Eyebrow>
          <SectionTitle sub="Edita el catálogo completo: vehículos, Stages, rines, performance y armor. Todo se sincroniza con la Vista Cliente en tiempo real.">
            Panel Administrativo
          </SectionTitle>
        </div>
        <Button variant="ghost" onClick={() => setAuthed(false)}>
          <LogOut size={14} /> Salir
        </Button>
      </div>
      <StyleControls />
      <ProductManager />
      <VehiclesManager />
      <StagesManager />
      <WheelsManager />
      <PerformanceManager />
      <ArmorManager />
      <EventsManager />
      <CoursesManager />
      <GalleryManager />
      <LeadsConsole />
    </div>
  );
}

/* ============================================================================
   NAV DE DESARROLLO (conmuta vistas) + ROOT
   ==========================================================================*/
function DevNav() {
  const { view, setView, brand, theme, leads } = useStore();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Cerrar el menú al hacer click fuera o con Escape
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const tabs = [
    { id: "client", label: "Vista Cliente", icon: LayoutGrid },
  ];
  const menu = [
    { id: "events",  label: "Eventos",           icon: Calendar },
    { id: "courses", label: "Cursos",            icon: GraduationCap },
    { id: "gallery", label: "Galería de Fotos",  icon: ImagePlus },
    { id: "admin",   label: "Panel Admin",       icon: Settings },
  ];
  const go = (id) => { setView(id); setOpen(false); };
  const activeMenu = menu.find((m) => m.id === view);

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ background: "rgba(10,10,11,0.9)", backdropFilter: "blur(8px)", borderColor: "#1e1e22" }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={() => setView("client")} className="flex items-center gap-2" title="Ir al inicio">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="407Dynopro" style={{ height: 28 }} onError={(e) => (e.currentTarget.style.display = "none")} />
          ) : (
            <span className="text-xl font-bold uppercase text-white tracking-tight" style={{ fontFamily: F_DISPLAY, letterSpacing: "0.04em" }}>
              407<span style={{ color: theme.accent }}>DYNOPRO</span>
            </span>
          )}
          <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded-sm uppercase text-zinc-500"
                style={{ border: "1px solid #2a2a2f", fontFamily: F_MONO, letterSpacing: "0.1em" }}>dev preview</span>
        </button>

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
              </button>
            );
          })}

          {/* Menú desplegable */}
          <div style={{ position: "relative" }} ref={menuRef}>
            <button onClick={() => setOpen((v) => !v)}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs uppercase font-semibold rounded-sm transition hover:brightness-110"
                    style={{ fontFamily: F_DISPLAY, letterSpacing: "0.06em",
                             background: activeMenu ? theme.accent : "transparent",
                             color: activeMenu ? "#0a0a0b" : "#a8a8b0",
                             border: `1px solid ${activeMenu ? theme.accent : "#2a2a2f"}` }}>
              <Menu size={14} />
              <span className="hidden sm:inline">{activeMenu ? activeMenu.label : "Menú"}</span>
              <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              {leads.length > 0 && !activeMenu && (
                <span className="text-[10px] px-1.5 rounded-full" style={{ background: theme.accent, color: "#0a0a0b", fontFamily: F_MONO }}>{leads.length}</span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 py-1.5 rounded-md overflow-hidden"
                   style={{ minWidth: 210, zIndex: 60,
                            background: "rgba(18,18,21,0.92)",
                            backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            boxShadow: "0 16px 44px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10)" }}>
                {menu.map((m) => {
                  const on = view === m.id;
                  const Icon = m.icon;
                  return (
                    <button key={m.id} onClick={() => go(m.id)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition hover:brightness-125"
                            style={{ fontFamily: F_BODY, textAlign: "left",
                                     background: on ? theme.accentSoft : "transparent",
                                     color: on ? "#fff" : "#c9c9cf" }}>
                      <Icon size={15} color={on ? theme.accent : "#8a8a92"} />
                      <span className="flex-1">{m.label}</span>
                      {m.id === "admin" && leads.length > 0 && (
                        <span className="text-[10px] px-1.5 rounded-full" style={{ background: theme.accent, color: "#0a0a0b", fontFamily: F_MONO }}>{leads.length}</span>
                      )}
                      {on && <span style={{ width: 6, height: 6, borderRadius: 999, background: theme.accent }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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

  // Keyframes de animaciones (callout y cabecera del build). Se reescribe siempre.
  useEffect(() => {
    const id = "dp-keyframes";
    let st = document.getElementById(id);
    if (!st) { st = document.createElement("style"); st.id = id; document.head.appendChild(st); }
    st.textContent = `
      @keyframes dp-dust {
        0%   { opacity: 0;    transform: translate(-50%,-50%) scale(0.4); }
        30%  { opacity: 0.7;  transform: translate(-50%,-70%) scale(1); }
        100% { opacity: 0;    transform: translate(-50%,-130%) scale(1.8); }
      }
      @keyframes dp-fade  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes dp-rise  { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
      @keyframes dp-wipe  { from { clip-path: inset(0 100% 0 0 round 6px); } to { clip-path: inset(0 0 0 0 round 6px); } }
      @keyframes dp-edge  { 0% { left: 0; opacity: 1; } 88% { left: 100%; opacity: 1; } 100% { left: 100%; opacity: 0; } }
      @keyframes dp-zoom  { from { transform: scale(1.16); } to { transform: scale(1); } }
      @keyframes dp-sweep { from { transform: translateX(-120%); opacity: 1; } to { transform: translateX(260%); opacity: 0.6; } }
      @keyframes dp-pop   { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: scale(1); } }
      @keyframes dp-ping  { 0% { opacity: 0.85; transform: scale(1); } 100% { opacity: 0; transform: scale(3.2); } }
      @keyframes dp-line  { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @media (prefers-reduced-motion: reduce) {
        .dp-anim, [style*="dp-dust"] { animation: none !important; }
      }
    `;
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
      .dp-app input[type="password"], .dp-app input[type="email"],
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
      {view === "admin" ? <AdminView />
        : view === "events" ? <EventsView />
        : view === "courses" ? <CoursesView />
        : view === "gallery" ? <GalleryView />
        : view === "product" ? <ProductView />
        : <ClientView />}
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
