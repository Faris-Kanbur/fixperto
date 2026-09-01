import type { Mechanic, Owner, Vehicle, Appointment, Listing, JobListing, SupportTicket, AdminChangeLogEntry, AdminStats, QuoteRequest, QuoteOffer, Conversation, ShareEvent, ShareStats, ProfileViewStats, ProfileViewAggregateStats, ProfileViewBulkStats, Broadcast, TranslateResult } from "../../types/domain";

// Thin fetch wrapper around the Fixperto Express + SQLite backend. Set
// VITE_API_URL in frontend/.env if the backend doesn't run on the default
// http://localhost:4000 (see frontend/.env.example).
//
// Bu dosya, projenin "her HTTP hatası için tutarlı, kullanıcı dostu bir mesaj" kuralını tek
// bir yerden uyguluyor: backend'den 401/403/404/422/429/500 (veya başka) bir durum kodu
// döndüğünde, ekrana ham teknik hatayı değil (ör. "Failed to fetch", "Unexpected token <")
// Türkçe, anlaşılır bir mesaj gösteriyoruz. Geliştirici için gerçek teknik detay
// (status, endpoint, backend'in döndürdüğü ham `error` alanı) `ApiError` içinde saklanıyor ve
// sadece `import.meta.env.DEV` iken konsola basılıyor — production'da sızmıyor.

export interface ApiErrorOptions {
  status: number;
  devMessage?: string;
  url?: string;
}

/**
 * Tüm API çağrılarının fırlattığı tek hata tipi. `.message` her zaman KULLANICIYA
 * gösterilebilir Türkçe bir metindir. Teknik detay için `.devMessage` / `.status` kullanın
 * (yalnızca log/debug amaçlı, ekrana basmayın).
 */
export class ApiError extends Error {
  status: number;
  devMessage?: string;
  url?: string;

  constructor(message: string, { status, devMessage, url }: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.devMessage = devMessage;
    this.url = url;
  }
}

// HTTP durum koduna göre kullanıcı dostu, Türkçe mesaj. Spesifik bir vaka yoksa `default`e düşer.
function friendlyMessageForStatus(status: number, backendMessage?: string): string {
  switch (status) {
    case 400:
    case 422:
      // Doğrulama hataları genelde backend'den zaten anlamlı bir mesajla gelir (ör. "E-posta
      // zorunludur"); varsa onu göster, yoksa genel bir doğrulama mesajına düş.
      return backendMessage || "Girdiğiniz bilgilerde bir sorun var. Lütfen alanları kontrol edip tekrar deneyin.";
    case 401:
      return "Oturumunuz sona ermiş veya bilgileriniz hatalı. Lütfen tekrar giriş yapın.";
    case 403:
      return "Bu işlem için yetkiniz yok.";
    case 404:
      return "Aradığınız kayıt bulunamadı. Silinmiş veya taşınmış olabilir.";
    case 408:
      return "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.";
    case 429:
      return "Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyip tekrar deneyin.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Sunucuda beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
    default:
      return backendMessage || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";
  }
}

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";
const DEV = !!(import.meta as any).env?.DEV;

// GERÇEK OTURUM SİSTEMİ: owner/mechanic girişi artık gerçek (bkz. backend/routes/auth.js) — bu
// yüzden admin token'ın aksine (bilerek sayfa yenilenince kaybolan, bkz. aşağıdaki adminToken notu)
// bu oturum token'ı localStorage'a yazılıyor. Sebep: admin paneli tek bir kişi tarafından, kısa
// süreli kullanılan hassas bir yönetim arayüzü — ama owner/mechanic girişi uygulamanın GERÇEK,
// günlük kullanım akışı; her sayfa yenilemesinde yeniden giriş istemek gerçek bir ürün için kabul
// edilemez bir UX olurdu. Bunun bilinen güvenlik ödünleşimi: bir XSS açığı bu token'ı çalabilir
// (httpOnly cookie'nin aksine) — bu, çoğu SPA'nın (bu projenin geri kalanı da dahil, ör. React
// state'te tutulan diğer hassas veriler) zaten kabul ettiği standart bir ödünleşim, ama not düşülmesi
// gereken bir seçim. Sunucu tarafında token'lar da bellekte tutuluyor (bkz. backend/utils/auth.js) —
// backend yeniden başladığında localStorage'daki eski bir token geçersiz olur, bu durumda
// restoreSession() /api/auth/me çağrısının başarısız olmasıyla bunu fark edip temizler.
const SESSION_STORAGE_KEY = "fixperto_session_v1";
type SessionRole = "owner" | "mechanic";
let sessionToken: string | null = null;
let sessionRole: SessionRole | null = null;
try {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token && parsed?.role) { sessionToken = parsed.token; sessionRole = parsed.role; }
    }
  }
} catch { /* localStorage kullanılamıyor (gizli sekme vb.) — oturumsuz devam edilir */ }

function persistSessionToStorage() {
  try {
    if (typeof window === "undefined") return;
    if (sessionToken && sessionRole) window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: sessionToken, role: sessionRole }));
    else window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch { /* yoksay */ }
}

function setSession(token: string | null, role: SessionRole | null) {
  sessionToken = token;
  sessionRole = role;
  persistSessionToStorage();
}

interface RequestOptions extends RequestInit {
  /** true ise ağ hatasında (backend'e hiç ulaşılamadıysa) otomatik olarak 1 kez tekrar dener. */
  retryOnNetworkError?: boolean;
}

// Aynı anda aynı GET isteğinin birden fazla yerden tetiklenmesini (ör. iki bileşen aynı listeyi
// aynı anda çekerse) tek bir ağ isteğine indirger — gereksiz/duplicate API çağrılarını önler.
const inFlightGets = new Map<string, Promise<any>>();

async function request(path: string, options: RequestOptions = {}) {
  const method = (options.method || "GET").toUpperCase();
  const dedupeKey = method === "GET" ? path : null;
  if (dedupeKey && inFlightGets.has(dedupeKey)) {
    return inFlightGets.get(dedupeKey);
  }

  const { retryOnNetworkError, ...fetchOptions } = options;
  const url = `${BASE_URL}${path}`;

  const exec = async () => {
    let res: Response;
    try {
      // GERÇEK OTURUM SİSTEMİ: giriş yapmış bir owner/mechanic varsa, token'ı HER isteğe otomatik
      // ekleniyor — tek tek her `api.X.method()` çağrısına elle Authorization eklemek yerine (bu,
      // yüzlerce çağrı sitesini değiştirmek anlamına gelirdi). Bir çağrı kendi `headers`'ını
      // (ör. admin'in adminAuthOpts()'u) açıkça verirse, aşağıdaki spread sırası sayesinde o her
      // zaman kazanır — admin işlemleri owner/mechanic oturum token'ıyla değil kendi token'ıyla
      // gitmeli.
      const defaultHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionToken) defaultHeaders.Authorization = `Bearer ${sessionToken}`;
      res = await fetch(url, {
        ...fetchOptions,
        // GERÇEK HATA DÜZELTMESİ: önceden `{ headers: {"Content-Type": ...}, ...fetchOptions }`
        // şeklindeydi — fetchOptions içinde bir `headers` alanı varsa (ör. admin token'ı için
        // Authorization eklerken) bu, Content-Type dahil TÜM varsayılan header'ların üzerine
        // yazıp siliyordu (obje spread'i iç içe birleştirmez). Sonuç: body'li bir istekte
        // Content-Type kaybolursa backend'deki express.json() body'yi hiç ayrıştırmaz, req.body
        // sessizce undefined kalırdı. Şimdi header'lar gerçekten birleştiriliyor.
        headers: { ...defaultHeaders, ...(fetchOptions.headers || {}) },
      });
    } catch (networkErr: any) {
      // fetch, sunucuya hiç ulaşamadığında (backend kapalı, CORS, offline vb.) burada patlar —
      // bu durumda bir HTTP status kodu yok, o yüzden ayrı bir kullanıcı mesajı veriyoruz.
      if (networkErr?.name === "AbortError") throw networkErr; // istek iptali (cancellation) — sessizce yeniden fırlat
      if (DEV) console.error(`[api] network error for ${method} ${url}:`, networkErr);
      throw new ApiError("Sunucuya bağlanılamadı. İnternet bağlantınızı ve backend'in çalıştığını kontrol edin.", {
        status: 0,
        devMessage: networkErr?.message,
        url,
      });
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({} as any));
      const backendMessage: string | undefined = body?.error;
      if (DEV) console.error(`[api] ${method} ${url} -> ${res.status}`, backendMessage || "(no error body)");
      throw new ApiError(friendlyMessageForStatus(res.status, backendMessage), {
        status: res.status,
        devMessage: backendMessage,
        url,
      });
    }
    if (res.status === 204) return null;
    return res.json();
  };

  const promise = exec();
  if (dedupeKey) {
    inFlightGets.set(dedupeKey, promise);
    promise.finally(() => inFlightGets.delete(dedupeKey));
  }
  return promise;
}

function crud<T extends { id: number | string }>(resource: string) {
  return {
    list: (opts?: RequestOptions): Promise<T[]> => request(`/api/${resource}`, opts),
    get: (id: number | string, opts?: RequestOptions): Promise<T> => request(`/api/${resource}/${id}`, opts),
    create: (data: Partial<T>, opts?: RequestOptions): Promise<T> => request(`/api/${resource}`, { method: "POST", body: JSON.stringify(data), ...opts }),
    update: (id: number | string, data: Partial<T>, opts?: RequestOptions): Promise<T> => request(`/api/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(data), ...opts }),
    remove: (id: number | string, opts?: RequestOptions): Promise<null> => request(`/api/${resource}/${id}`, { method: "DELETE", ...opts }),
    // Sadece shareCount sütunu olan kaynaklarda (mechanics/listings/jobs) gerçek bir uç nokta var —
    // diğerlerinde çağrılmaz, bu yüzden generic factory'de koşulsuz tanımlamak zararsız.
    share: (id: number | string, opts?: RequestOptions): Promise<T> => request(`/api/${resource}/${id}/share`, { method: "POST", ...opts }),
  };
}

// GÜVENLİK DÜZELTMESİ: şifre artık backend'den asla düz metin olarak dönmüyor (bkz.
// backend/db/hydrate.js) — bu yüzden "mevcut şifre doğru mu" kontrolü artık istemci tarafında
// kayıtlı bir değerle karşılaştırılarak değil, sunucudan cevap alınarak yapılıyor. Sadece
// passwordVerify açık olan kaynaklarda (owners/mechanics, bkz. backend/server.js) gerçek bir uç
// nokta var.
function withPasswordEndpoints<T extends { id: number | string }>(resource: string) {
  return {
    ...crud<T>(resource),
    verifyPassword: (id: number | string, password: string, opts?: RequestOptions): Promise<{ valid: boolean }> =>
      request(`/api/${resource}/${id}/verify-password`, { method: "POST", body: JSON.stringify({ password }), ...opts }),
    setPassword: (id: number | string, password: string, opts?: RequestOptions): Promise<{ ok: true }> =>
      request(`/api/${resource}/${id}/set-password`, { method: "POST", body: JSON.stringify({ password }), ...opts }),
  };
}

// GERÇEK HATA DÜZELTMESİ: admin token'ı önceden SADECE saf bir module-level değişkende
// tutuluyordu (localStorage/sessionStorage'a hiç yazılmıyordu). Bunun pratikte kırdığı şey:
// Vite'nin geliştirme modundaki hot-reload'u (HMR) bu dosyayı (ya da onu import eden başka bir
// dosyayı) yeniden değerlendirdiğinde, modül baştan çalıştığı için `adminToken` sessizce `null`'a
// dönüyordu — ANCAK React tarafında `adminAuthed` state'i Fast Refresh ile KORUNUYORDU. Sonuç:
// admin ekranda hâlâ giriş yapmış görünüyor ama gönderdiği hiçbir istekte Authorization header'ı
// yok, backend de 401 ile reddediyor ("taze giriş yaptım ama kaydedemiyorum" şikayetinin gerçek
// kök nedeni). Çözüm: token'ı sessionStorage'a yazıyoruz — localStorage'ın aksine sekme
// kapanınca/tarayıcı kapanınca otomatik silinir (owner/mechanic'in kalıcı localStorage oturumundan
// daha kısıtlı, admin panelinin "uzun süre kalıcı olmasın" amacıyla tutarlı) ama modül yeniden
// yüklendiğinde ya da sayfa aynı sekmede yenilendiğinde HAYATTA kalır — yukarıdaki HMR/refresh
// sınıfı hataları tamamen ortadan kaldırır.
const ADMIN_TOKEN_STORAGE_KEY = "fixperto_admin_token_v1";
let adminToken: string | null = null;
try {
  if (typeof window !== "undefined") adminToken = window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || null;
} catch { /* sessionStorage kullanılamıyor — bellek-içi (eski davranış) ile devam edilir */ }

function setAdminToken(token: string | null) {
  adminToken = token;
  try {
    if (typeof window === "undefined") return;
    if (token) window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    else window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  } catch { /* yoksay */ }
}

function adminAuthOpts(): RequestOptions {
  return adminToken ? { headers: { Authorization: `Bearer ${adminToken}` } } : {};
}

export const api = {
  // GERÇEK OTURUM SİSTEMİ (bkz. backend/routes/auth.js): kayıt olurken kullanıcı şifre SEÇMEZ —
  // backend rastgele bir şifre üretip e-postasına gönderir (bu, e-postanın gerçekten kullanıcıya
  // ait olduğunun ilk doğrulaması). Girişte şifre doğrulandıktan SONRA, ikinci bir doğrulama adımı
  // olarak e-postaya 6 haneli bir kod gönderilir (çifte doğrulama / 2FA) — gerçek oturum token'ı
  // sadece bu kod da doğrulanınca verilir (bkz. verifyOtp).
  auth: {
    register: (role: "owner" | "mechanic", email: string, name: string, extra?: Record<string, unknown>): Promise<{ ok: true; id: number; email: string; mailSent: boolean; devPassword?: string; devNote?: string }> =>
      request("/api/auth/register", { method: "POST", body: JSON.stringify({ role, email, name, ...extra }) }),
    login: (role: "owner" | "mechanic", email: string, password: string): Promise<{ ok: true; requiresOtp: true; loginTicket: string; mailSent: boolean; devOtp?: string; devNote?: string }> =>
      request("/api/auth/login", { method: "POST", body: JSON.stringify({ role, email, password }) }),
    verifyOtp: async (loginTicket: string, code: string): Promise<{ ok: true; token: string; user: any }> => {
      const result = await request("/api/auth/verify-otp", { method: "POST", body: JSON.stringify({ loginTicket, code }) });
      setSession(result.token, result.user.role);
      return result;
    },
    logout: async (): Promise<void> => {
      if (sessionToken) {
        try { await request("/api/auth/logout", { method: "POST" }); } catch { /* çıkışta hata olsa bile devam et */ }
      }
      setSession(null, null);
    },
    me: (): Promise<any> => request("/api/auth/me"),
    // Sayfa yenilendiğinde localStorage'da bir token bulunduysa (bkz. yukarısı) bunu kullanıp
    // kullanıp kullanamayacağını (backend yeniden başlamış olabilir, token artık geçersiz olabilir)
    // AppLogicProvider'ın bootstrap efekti bu ikisiyle kontrol ediyor.
    hasStoredSession: (): boolean => !!sessionToken,
    getStoredRole: (): SessionRole | null => sessionRole,
    clearSession: (): void => setSession(null, null),
  },
  mechanics: withPasswordEndpoints<Mechanic>("mechanics"),
  owners: withPasswordEndpoints<Owner>("owners"),
  vehicles: crud<Vehicle>("vehicles"),
  appointments: crud<Appointment>("appointments"),
  listings: crud<Listing>("listings"),
  conversations: crud<Conversation>("conversations"),
  jobs: crud<JobListing>("jobs"),
  tickets: crud<SupportTicket>("tickets"),
  // quote-requests/quote-offers backend'de artık generic CRUD değil (bkz.
  // backend/routes/quotes.js) — crud<>() ile aynı temel GET/POST/PATCH/DELETE'i korurken,
  // durum geçişlerini (kabul/iptal/reddet) atomik olarak yapan özel uç noktalar ekleniyor.
  quoteRequests: {
    ...crud<QuoteRequest>("quote-requests"),
    cancel: (id: number | string, opts?: RequestOptions): Promise<{ request: QuoteRequest; offers: QuoteOffer[] }> =>
      request(`/api/quote-requests/${id}/cancel`, { method: "POST", ...opts }),
  },
  quoteOffers: {
    ...crud<QuoteOffer>("quote-offers"),
    accept: (id: number | string, opts?: RequestOptions): Promise<{ request: QuoteRequest; offers: QuoteOffer[] }> =>
      request(`/api/quote-offers/${id}/accept`, { method: "POST", ...opts }),
    decline: (id: number | string, opts?: RequestOptions): Promise<QuoteOffer> =>
      request(`/api/quote-offers/${id}/decline`, { method: "POST", ...opts }),
  },
  admin: {
    // GÜVENLİK DÜZELTMESİ: backend artık başarılı girişte bir token dönüyor (bkz.
    // backend/routes/admin.js) — bu token bellekte saklanıp aşağıdaki diğer admin çağrılarına
    // otomatik olarak eklenir (bkz. adminAuthOpts). Token'ı burada, request() çağrısından ÖNCE
    // değil SONRA (yanıttan okuyarak) saklıyoruz.
    login: async (email: string, password: string): Promise<{ ok: true }> => {
      const result = await request("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setAdminToken(result?.token || null);
      return result;
    },
    logout: async (): Promise<void> => {
      if (adminToken) {
        try { await request("/api/admin/logout", { method: "POST", ...adminAuthOpts() }); } catch { /* çıkışta hata olsa bile devam et */ }
      }
      setAdminToken(null);
    },
    stats: (): Promise<AdminStats> => request("/api/admin/stats", { ...adminAuthOpts() }),
    changeLog: (): Promise<AdminChangeLogEntry[]> => request("/api/admin/change-log", { ...adminAuthOpts() }),
    logChange: (entry: Partial<AdminChangeLogEntry>): Promise<{ id: number }> => request("/api/admin/change-log", { method: "POST", body: JSON.stringify(entry), ...adminAuthOpts() }),
    revertChange: (id: number | string): Promise<AdminChangeLogEntry> => request(`/api/admin/change-log/${id}`, { method: "PATCH", ...adminAuthOpts() }),
    // GERÇEK HATA DÜZELTMESİ: admin paneli, owners/mechanics/listings/jobs/tickets/appointments
    // gibi genel (owner/mechanic authScope'lu) kaynaklara YAZARKEN (ör. saveAdminUserEdit,
    // resetUserPassword, updateListingField...) admin token'ını hiç göndermiyordu — bu istekler
    // generic `crud()` fonksiyonları üzerinden gidiyor ve `request()` varsayılan olarak SADECE
    // owner/mechanic oturum token'ını ekliyor (bkz. yukarısı, `sessionToken`). Admin, owner/mechanic
    // olarak da giriş yapmadıysa (normal durum) bu isteklerde HİÇ Authorization header'ı gitmiyordu,
    // backend de (artık authScope zorunlu kıldığı için) 401 ile reddediyordu — "az önce giriş
    // yaptım ama kaydedemiyorum" hatasının kök nedeni buydu. Çözüm: bu opts'u her admin-panel yazma
    // çağrısına üçüncü argüman olarak (ör. `api.owners.update(id, patch, api.admin.authOpts())`)
    // açıkça geçmek — admin token'ı varsa Authorization header'ını doğru şekilde ekliyor.
    authOpts: adminAuthOpts,
  },
  // Paylaşım analitiği: her ShareButton eylemi ayrı bir refCode ile kaydedilir; linke tıklama ve
  // sonraki dönüşüm (sohbet/randevu/teklif/başvuru) aynı refCode üzerinden atfedilir.
  shareEvents: {
    create: (data: { targetType: string; targetId: number | string; channel: string; refCode: string; sharedBy?: string | null }): Promise<ShareEvent> =>
      request("/api/share-events", { method: "POST", body: JSON.stringify(data) }),
    click: (refCode: string): Promise<ShareEvent> => request(`/api/share-events/${refCode}/click`, { method: "POST" }),
    convert: (refCode: string): Promise<ShareEvent> => request(`/api/share-events/${refCode}/convert`, { method: "POST" }),
    stats: (): Promise<ShareStats> => request("/api/share-events/stats"),
  },
  // Tamirci profili / araç ilanı görüntülenme takibi — bkz. backend/routes/profileViews.js.
  // stats() parametresiz çağrılırsa platform geneli (admin), targetType+targetId verilirse tek bir
  // hedef için (tamircinin/ilan sahibinin kendi sayfası) sonuç döner.
  profileViews: {
    create: (targetType: string, targetId: number | string): Promise<{ id: number }> =>
      request("/api/profile-views", { method: "POST", body: JSON.stringify({ targetType, targetId }) }),
    convert: (id: number | string): Promise<unknown> => request(`/api/profile-views/${id}/convert`, { method: "POST" }),
    // `days` verilirse (bkz. tamirci Analiz sekmesi zaman aralığı filtresi), yanıt ayrıca o
    // pencereye göre `viewsInRange`/`conversionsInRange` alanlarını da içerir.
    stats: (targetType?: string, targetId?: number | string, days?: number): Promise<ProfileViewStats | ProfileViewAggregateStats> =>
      request(targetType && targetId ? `/api/profile-views/stats?targetType=${targetType}&targetId=${targetId}${days ? `&days=${days}` : ""}` : "/api/profile-views/stats"),
    // Tamirci galeri paneli: birden fazla ilanın görüntülenme/dönüşüm sayısını N ayrı istek yerine
    // tek istekte alır (bkz. backend/routes/profileViews.js GET /stats/bulk).
    statsBulk: (targetType: string, targetIds: (number | string)[], days?: number): Promise<ProfileViewBulkStats> =>
      targetIds.length === 0 ? Promise.resolve({}) : request(`/api/profile-views/stats/bulk?targetType=${targetType}&targetIds=${targetIds.join(",")}${days ? `&days=${days}` : ""}`),
  },
  broadcasts: crud<Broadcast>("broadcasts"),
  // Sohbet mesajı çevirisi — bkz. backend/routes/translate.js. Sunucu tarafında SQLite önbelleği
  // var, bu yüzden aynı metin/dil çifti ikinci kez asla dış servise gitmiyor.
  translate: (text: string, from: string, to: string): Promise<TranslateResult> =>
    request("/api/translate", { method: "POST", body: JSON.stringify({ text, from, to }) }),
  health: (): Promise<{ ok: boolean; service: string }> => request("/api/health"),
};
