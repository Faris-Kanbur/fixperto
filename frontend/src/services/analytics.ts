import { detectCountryCode } from "../utils/helpers";

/**
 * ANONİM ANALİTİK İSTEMCİSİ
 *
 * Tasarım kararları ve gerekçeleri:
 *
 * 1) KİŞİSEL VERİ YOK. Ziyaretçi kimliği tarayıcıda üretilen rastgele bir dize; ne isim, ne
 *    e-posta, ne IP taşır. Sunucu da IP saklamıyor (bkz. backend/routes/analytics.js). Konum
 *    yalnızca ÜLKE düzeyinde ve cihazın saat diliminden çıkarılıyor. Bu sınırlar bilinçli:
 *    toplanan veri KVKK/GDPR açısından toplu istatistik sınırında kalsın diye.
 *
 * 2) TOPLU GÖNDERİM. Her tıklamada ayrı bir HTTP isteği atmak hem ağı hem backend'i gereksiz
 *    yorar. Olaylar bir kuyrukta birikip periyodik olarak (ve sayfa kapanırken) tek istekte
 *    gönderiliyor.
 *
 * 3) SESSİZ BAŞARISIZLIK. Analitik, ürünün çalışmasını ASLA engellememeli. Ağ hatası, depo kapalı,
 *    backend kapalı — hepsinde sessizce vazgeçiyoruz; kullanıcı hiçbir şey görmüyor.
 */

const VISITOR_KEY = "fixperto_visitor";
const SESSION_KEY = "fixperto_session";
const SOURCE_KEY = "fixperto_source";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 dk hareketsizlik → yeni oturum (web analitiği standardı)

// client.ts ile aynı taban kullanılıyor: VITE_API_URL "/api" öneki İÇERMEZ.
const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
const EVENTS_URL = `${BASE_URL}/api/analytics/events`;

function randomId() {
  // crypto.randomUUID her yerde yok (eski Safari); Math.random yedeği analitik için fazlasıyla yeterli.
  try { return crypto.randomUUID(); } catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
}
function readStore(key) { try { return localStorage.getItem(key); } catch { return null; } }
function writeStore(key, val) { try { localStorage.setItem(key, val); } catch { /* gizli sekme vb. */ } }

function getVisitorId() {
  let id = readStore(VISITOR_KEY);
  if (!id) { id = randomId(); writeStore(VISITOR_KEY, id); }
  return id;
}

/** Oturum kimliği + "bu yeni bir oturum mu" bilgisi. Yeni oturumda session_start olayı atılır. */
let sessionStartedThisLoad = false;
function getSessionId() {
  const now = Date.now();
  let raw = null;
  try { raw = JSON.parse(sessionStorage.getItem(SESSION_KEY) || readStore(SESSION_KEY) || "null"); } catch { raw = null; }
  if (raw && raw.id && now - raw.ts < SESSION_TTL_MS) {
    const next = { id: raw.id, ts: now };
    writeStore(SESSION_KEY, JSON.stringify(next));
    return raw.id;
  }
  const id = randomId();
  writeStore(SESSION_KEY, JSON.stringify({ id, ts: now }));
  sessionStartedThisLoad = true;
  return id;
}

/**
 * Trafik kaynağı. Öncelik: utm_source > yönlendiren alan adı > "direct".
 * İLK dokunuş saklanıyor (localStorage): kullanıcı Instagram'dan gelip 3 gün sonra doğrudan girip
 * randevu alırsa, o dönüşümün gerçek kaynağı hâlâ Instagram'dır. Her ziyarette üzerine yazsaydık
 * tüm dönüşümler "direct" görünür ve reklam bütçesi yanlış yere giderdi.
 */
function getSource() {
  const existing = readStore(SOURCE_KEY);
  if (existing) return existing;
  let source = "direct";
  try {
    const utm = new URLSearchParams(location.search).get("utm_source");
    if (utm) source = utm.slice(0, 60);
    else if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host && host !== location.hostname) source = host.slice(0, 60);
    }
  } catch { /* URL parse edilemezse direct kalır */ }
  writeStore(SOURCE_KEY, source);
  return source;
}

function getDevice() {
  try {
    const w = window.innerWidth;
    return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  } catch { return "unknown"; }
}

// ---- Kuyruk ----
let queue: any[] = [];
let flushTimer: any = null;
// Rol ve dil olay anında bilinmeli ama analytics.ts React ağacının dışında; provider bunları
// setAnalyticsContext ile besliyor.
let context = { role: "guest", lang: "tr" };

export function setAnalyticsContext(next: { role?: string; lang?: string }) {
  context = { ...context, ...next };
}

function flush() {
  if (queue.length === 0) return;
  const events = queue;
  queue = [];
  const body = JSON.stringify({ events });
  try {
    // sendBeacon sayfa kapanırken bile teslim edilir (fetch iptal edilir). Yoksa fetch'e düşüyoruz.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(EVENTS_URL, new Blob([body], { type: "application/json" }));
      return;
    }
  } catch { /* sendBeacon engelliyse fetch dene */ }
  fetch(EVENTS_URL, {
    method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true,
  }).catch(() => { /* analitik ürünü bozmaz */ });
}

/** Tek bir olayı kuyruğa alır. Hiçbir koşulda hata fırlatmaz. */
export function track(name: string, opts: { targetType?: string; targetId?: number | null; meta?: Record<string, any> } = {}) {
  try {
    const sessionId = getSessionId();
    if (sessionStartedThisLoad) {
      sessionStartedThisLoad = false;
      queue.push(baseEvent("session_start", sessionId, {}));
    }
    queue.push(baseEvent(name, sessionId, opts));
    if (queue.length >= 20) { flush(); return; }
    if (!flushTimer) flushTimer = setTimeout(() => { flushTimer = null; flush(); }, 4000);
  } catch { /* yut */ }
}

function baseEvent(name, sessionId, opts: any) {
  return {
    name,
    visitorId: getVisitorId(),
    sessionId,
    targetType: opts.targetType ?? null,
    targetId: opts.targetId ?? null,
    role: context.role,
    source: getSource(),
    country: detectCountryCode(),
    device: getDevice(),
    lang: context.lang,
    meta: opts.meta || {},
  };
}

// Sekme kapanırken/gizlenirken kuyrukta kalanları kaçırma.
try {
  window.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
  window.addEventListener("pagehide", flush);
} catch { /* SSR/test ortamı */ }
