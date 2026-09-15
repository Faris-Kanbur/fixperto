// UÇTAN UCA TEST ALTYAPISI — GERÇEK sunucu, GERÇEK SQLite, GERÇEK HTTP.
// ---------------------------------------------------------------------------------------------
// Buraya kadarki test takımları kaynak kodu okuyup mantığı yeniden çalıştırıyordu; "kod böyle
// yazılmış" diyebiliyorlardı ama "istek gerçekten gitti mi, veri gerçekten yazıldı mı" diyemiyorlardı.
// Bu altyapı gerçek Express uygulamasını ayağa kaldırıyor, üzerine gerçek HTTP istekleri atıyor ve
// sonucu VERİTABANINDAN doğruluyor. "Başarılı görünüyor" ile "gerçekten oldu" arasındaki farkı
// ancak böyle görebiliriz.
//
// SQLITE SÜRÜCÜSÜ ÇALIŞTIĞI MAKİNEYE GÖRE SEÇİLİYOR — bu kısım önemli, çünkü ilk sürümü
// yalnızca geliştirme sanal ortamında çalışıyordu ve senin makinende patladı.
//   - Normal kurulumda (senin Mac'in, CI) `better-sqlite3` derlenmiş hâlde var: sunucu OLDUĞU GİBİ,
//     hiçbir yükleyici numarası olmadan başlatılıyor. Test edilen şey birebir üretimdeki şey.
//   - Bazı sanal ortamlarda better-sqlite3'ün ikilisi çalışmıyor (invalid ELF header). Orada, EĞER
//     Node 22+ ise, ESM yükleyicisi o modül isteğini yerleşik node:sqlite üstündeki adaptöre
//     yönlendiriyor (sqlite-adapter.mjs). UYGULAMA KODU YİNE DEĞİŞMİYOR.
//   - İkisi de yoksa takım HATA VERMİYOR, "atlandı" deyip çıkıyor: çalıştıramadığın bir testin
//     kırmızı yanması, gerçek bir hatayı gördüğünde ona güvenmemene yol açar.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..", "..");
const requireFromRoot = createRequire(join(ROOT, "backend", "server.js"));

/** Doğrudan veritabanı okumaları için sürücü seç. null → uçtan uca testler çalıştırılamaz. */
function pickDriver() {
  try {
    const Better = requireFromRoot("better-sqlite3");
    // Sadece import etmek yetmez; ikilinin gerçekten AÇILABİLDİĞİNİ görmeliyiz.
    const probe = new Better(":memory:");
    probe.close();
    // readonly AÇMIYORUZ bilerek: veritabanı WAL kipinde ve salt-okunur bir bağlantının WAL
    // indeksini açamayıp SQLITE_CANTOPEN vermesi mümkün. Buradan hiç yazmıyoruz zaten.
    return { kind: "better-sqlite3", open: (path) => new Better(path) };
  } catch { /* ikili yok ya da çalışmıyor — node:sqlite'a bak */ }
  try {
    const { DatabaseSync } = requireFromRoot("node:sqlite");
    return { kind: "node:sqlite", open: (path) => new DatabaseSync(path) };
  } catch { /* Node 22 öncesi */ }
  return null;
}
export const DRIVER = pickDriver();

/**
 * Bu takım bu makinede çalıştırılabilir mi? Değilse SEBEBİNİ söyleyip 0 ile çık.
 * Test takımlarının en başında çağrılıyor.
 */
export function skipIfUnsupported(suiteName) {
  if (DRIVER) return false;
  console.log(`ATLANDI ${suiteName} — ne better-sqlite3 çalışıyor ne de node:sqlite var (Node 22+ gerekir). Node: ${process.version}`);
  return true;
}

const PORT = Number(process.env.E2E_PORT || 4321);
// Veritabanı yolu porta bağlı: iki takım aynı anda çalışırsa birbirinin dosyasını silmesin.
const DB_PATH = join(process.env.TMPDIR || "/tmp", `fixperto-e2e-${PORT}.sqlite`);
// Medya klasörü de porta bağlı: paralel çalışan iki takım birbirinin dosyalarını silmesin.
const MEDIA_DIR = join(process.env.TMPDIR || "/tmp", `fixperto-e2e-${PORT}-media`);
export const BASE = `http://127.0.0.1:${PORT}`;

let child = null;
let dbHandle = null;

export async function startServer() {
  for (const f of [DB_PATH, `${DB_PATH}-wal`, `${DB_PATH}-shm`]) if (existsSync(f)) rmSync(f);
  /**
   * MEDYA KLASÖRÜ DE SİLİNİYOR (Faz 4).
   * İlk hâlde yalnızca veritabanı siliniyordu ve bir test "ilk yüklemede deduped=false" derken
   * başarısız oldu: dosya ÖNCEKİ ÇALIŞTIRMADAN kalmıştı, içerik karması aynı olduğu için sunucu
   * haklı olarak "zaten var" dedi. Yani takım kendi geçmişini taşıyordu — sonraki çalıştırmalar
   * ilkinden farklı davranan bir test, güvenilmez bir testtir.
   * Aynı zamanda gerçek bir gerçeği gösteriyor: veritabanı ile medya klasörünün ömrü BİRLİKTE.
   * Biri sıfırlanıp diğeri kalırsa ortaya tutarsız bir durum çıkıyor (bkz. backend/.gitignore).
   */
  if (existsSync(MEDIA_DIR)) rmSync(MEDIA_DIR, { recursive: true, force: true });
  // better-sqlite3 çalışıyorsa yükleyici YOK: sunucu üretimdeki hâliyle başlıyor.
  const args = DRIVER?.kind === "node:sqlite"
    ? ["--experimental-loader", join(HERE, "loader.mjs"), join(ROOT, "backend", "server.js")]
    : [join(ROOT, "backend", "server.js")];
  child = spawn(process.execPath, args, {
    cwd: ROOT,
    env: {
      ...process.env,
      FIXPERTO_DB_PATH: DB_PATH,
      FIXPERTO_MEDIA_DIR: MEDIA_DIR,
      PORT: String(PORT),
      FIXPERTO_ADMIN_EMAIL: "admin@fixperto.test",
      FIXPERTO_ADMIN_PASSWORD: "e2e-admin-password",
      IP_HASH_SALT: "e2e-salt",
      /**
       * SINIRLAR YÜKSELTİLİYOR AMA ARTIK ÇAĞIRAN TARAF EZEBİLİYOR (ikinci denetimde bulundu).
       * ---------------------------------------------------------------------------------------
       * Bu üç değer SABİT "500" olarak yazılıydı ve yanındaki yorum "sınırın KENDİSİ ayrıca test
       * ediliyor" diyordu. Kontrol edildi: EDİLMİYORDU. Yani giriş hız sınırını sınayan bir test
       * yazmak, bu altyapıyı kullandığı sürece İMKÂNSIZDI — sınır her zaman 500'e ayarlanıyordu,
       * 14 yanlış denemede hiçbir şey olmuyordu ve bu "sınır çalışıyor" gibi görünüyordu.
       * Bu, testin ölçtüğünü sandığı şeyi ölçmemesinin bir örneği: altyapı sessizce korumayı
       * devre dışı bırakıyordu. Artık çağıran süreç değeri geçebiliyor, geçmezse eski davranış.
       */
      REGISTER_LIMIT_PER_HOUR: process.env.E2E_REGISTER_LIMIT || "500",
      LOGIN_LIMIT_PER_WINDOW: process.env.E2E_LOGIN_LIMIT || "500",
      OTP_IP_LIMIT_PER_WINDOW: process.env.E2E_OTP_LIMIT || "500",
      /**
       * MEDYA YÜKLEME: IP tavanı yükseltiliyor, KULLANICI başına sınır VARSAYILANDA kalıyor.
       * Sebebi tam da o sınırın var olma sebebi: testteki bütün kullanıcılar 127.0.0.1'den
       * bağlanıyor, yani aynı NAT arkasındaki gerçek kullanıcıların durumunu birebir taklit
       * ediyorlar. IP tavanı yükseltilmezse bir takımın erken adımları sonraki adımların
       * kotasını tüketir — ki bu da IP başına sınırın gerçek kullanıcılarda yarattığı sorunun
       * ta kendisi. Kullanıcı başına sınır (20) varsayılanıyla test ediliyor.
       */
      MEDIA_UPLOAD_LIMIT_PER_IP: "5000",
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
  if (!dbHandle) dbHandle = DRIVER.open(DB_PATH);
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
  // Başlıklar da dönüyor: "X-Total-Count" gibi sözleşmeler yalnızca gövdeye bakarak denetlenemez.
  return { status: res.status, body: data, raw: text, headers: Object.fromEntries(res.headers) };
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
