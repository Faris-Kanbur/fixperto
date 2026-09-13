// UÇTAN UCA TEST ALTYAPISI — GERÇEK sunucu, GERÇEK SQLite, GERÇEK HTTP.
// ---------------------------------------------------------------------------------------------
// Buraya kadarki test takımları kaynak kodu okuyup mantığı yeniden çalıştırıyordu; "kod böyle
// yazılmış" diyebiliyorlardı ama "istek gerçekten gitti mi, veri gerçekten yazıldı mı" diyemiyorlardı.
// Bu altyapı gerçek Express uygulamasını ayağa kaldırıyor, üzerine gerçek HTTP istekleri atıyor ve
// sonucu VERİTABANINDAN doğruluyor. "Başarılı görünüyor" ile "gerçekten oldu" arasındaki farkı
// ancak böyle görebiliriz.
//
// TEK UYARLAMA: bu ortamda better-sqlite3'ün derlenmiş ikilisi çalışmıyor (invalid ELF header),
// bu yüzden ESM yükleyicisi onu Node'un yerleşik node:sqlite'ına dayanan bir adaptörle
// değiştiriyor (sqlite-adapter.mjs). UYGULAMA KODU DEĞİŞMİYOR — aynı SQL, aynı şema, aynı rotalar.
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..", "..");
const DB_PATH = "/tmp/fixperto-e2e.sqlite";
const PORT = Number(process.env.E2E_PORT || 4321);
export const BASE = `http://127.0.0.1:${PORT}`;

let child = null;
let dbHandle = null;

export async function startServer() {
  for (const f of [DB_PATH, `${DB_PATH}-wal`, `${DB_PATH}-shm`]) if (existsSync(f)) rmSync(f);
  child = spawn(process.execPath, ["--experimental-loader", join(HERE, "loader.mjs"), join(ROOT, "backend", "server.js")], {
    cwd: ROOT,
    env: {
      ...process.env,
      FIXPERTO_DB_PATH: DB_PATH,
      PORT: String(PORT),
      FIXPERTO_ADMIN_EMAIL: "admin@fixperto.test",
      FIXPERTO_ADMIN_PASSWORD: "e2e-admin-password",
      IP_HASH_SALT: "e2e-salt",
      // Testte onlarca hesap açılıyor; kayıt sınırı bir ops ayarı (bkz. auth.js REGISTER_MAX).
      REGISTER_LIMIT_PER_HOUR: "500",
      NODE_NO_WARNINGS: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const logs = [];
  child.stdout.on("data", (d) => logs.push(String(d)));
  child.stderr.on("data", (d) => logs.push(String(d)));
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return { logs };
    } catch { /* henüz ayakta değil */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Sunucu açılmadı:\n${logs.join("")}`);
}

export function stopServer() {
  if (dbHandle) { try { dbHandle.close(); } catch { /* zaten kapalı */ } dbHandle = null; }
  if (child) { child.kill("SIGKILL"); child = null; }
}

/** Veritabanına DOĞRUDAN bakmak için — "API başarılı dedi" yetmez, satır gerçekten değişti mi? */
export function db() {
  if (!dbHandle) dbHandle = new DatabaseSync(DB_PATH);
  return dbHandle;
}
export const row = (sql, ...params) => db().prepare(sql).get(...params);
export const rows = (sql, ...params) => db().prepare(sql).all(...params);

/** Tek bir HTTP çağrısı: durum kodu + gövde birlikte dönüyor (ikisini de denetliyoruz). */
export async function api(method, path, { token = null, body = undefined, headers = {} } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body)),
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, body: data, raw: text };
}

/** Kayıt + giriş + OTP: gerçek akışın tamamı. Test kullanıcıları böyle üretiliyor. */
export async function createUser(role, { name, email, phone = "+905321234567" }) {
  const reg = await api("POST", "/api/auth/register", { body: { role, name, email, phone } });
  if (reg.status !== 201 && reg.status !== 200) throw new Error(`register(${email}) → ${reg.status} ${reg.raw}`);
  const password = reg.body?.devPassword;
  if (!password) throw new Error(`devPassword dönmedi: ${reg.raw}`);
  const token = await login(email, password);
  const table = role === "owner" ? "owners" : "mechanics";
  const dbRow = row(`SELECT * FROM ${table} WHERE lower(email) = ?`, email.toLowerCase());
  return { role, email, password, token, id: dbRow.id, row: dbRow };
}

export async function login(email, password) {
  const res = await api("POST", "/api/auth/login", { body: { email, password } });
  if (res.status !== 200) throw new Error(`login(${email}) → ${res.status} ${res.raw}`);
  const { loginTicket, devOtp } = res.body;
  const otp = await api("POST", "/api/auth/verify-otp", { body: { loginTicket, code: devOtp } });
  if (otp.status !== 200) throw new Error(`verify-otp(${email}) → ${otp.status} ${otp.raw}`);
  return otp.body.token;
}

export async function adminToken() {
  const res = await api("POST", "/api/admin/login", { body: { email: "admin@fixperto.test", password: "e2e-admin-password" } });
  if (res.status !== 200) throw new Error(`admin login → ${res.status} ${res.raw}`);
  return res.body.token;
}
