import type { Mechanic, Owner, Vehicle, Appointment, Listing, JobListing, SupportTicket, AdminChangeLogEntry, AdminStats, QuoteRequest, QuoteOffer } from "../../types/domain";

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
      res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...fetchOptions,
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
  };
}

export const api = {
  mechanics: crud<Mechanic>("mechanics"),
  owners: crud<Owner>("owners"),
  vehicles: crud<Vehicle>("vehicles"),
  appointments: crud<Appointment>("appointments"),
  listings: crud<Listing>("listings"),
  jobs: crud<JobListing>("jobs"),
  tickets: crud<SupportTicket>("tickets"),
  quoteRequests: crud<QuoteRequest>("quote-requests"),
  quoteOffers: crud<QuoteOffer>("quote-offers"),
  admin: {
    login: (email: string, password: string): Promise<{ ok: true }> => request("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    stats: (): Promise<AdminStats> => request("/api/admin/stats"),
    changeLog: (): Promise<AdminChangeLogEntry[]> => request("/api/admin/change-log"),
    logChange: (entry: Partial<AdminChangeLogEntry>): Promise<{ id: number }> => request("/api/admin/change-log", { method: "POST", body: JSON.stringify(entry) }),
  },
  health: (): Promise<{ ok: boolean; service: string }> => request("/api/health"),
};
