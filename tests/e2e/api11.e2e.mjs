// tests/e2e/api11.e2e.mjs
// UÇTAN UCA: /api/theme — gerçek sunucu + gerçek SQLite üzerinden.
import { startServer, stopServer, api, adminToken, skipIfUnsupported } from "./harness.mjs";
import { eq, ok, report } from "../_harness.mjs";

if (skipIfUnsupported("uçtan uca tema/palet uç noktası")) process.exit(0);

await startServer();
try {
  // 1) GET herkese açık, satır yokken varsayılan "default" dönüyor.
  const initial = await api("GET", "/api/theme");
  eq(initial.status, 200, "GET /api/theme 200");
  eq(initial.body.palette, "default", "hiç ayarlanmamışken varsayılan palet 'default'");

  // 2) PATCH admin girişi olmadan reddediliyor.
  const noAuth = await api("PATCH", "/api/theme", { body: { palette: "trust" } });
  eq(noAuth.status, 401, "admin girişi olmadan PATCH 401");

  const admin = await adminToken();

  // 3) Geçersiz palet adı reddediliyor.
  const invalid = await api("PATCH", "/api/theme", { body: { palette: "not-a-real-palette" }, token: admin });
  eq(invalid.status, 400, "bilinmeyen palet adı 400");

  // 4) Admin girişiyle geçerli bir palet başarıyla ayarlanıyor ve GET bunu yansıtıyor.
  const setRes = await api("PATCH", "/api/theme", { body: { palette: "trust" }, token: admin });
  eq(setRes.status, 200, "geçerli palet + admin girişi 200");
  eq(setRes.body.palette, "trust", "PATCH yanıtı yeni paleti döndürüyor");

  const after = await api("GET", "/api/theme");
  eq(after.body.palette, "trust", "PATCH sonrası GET yeni paleti gösteriyor (kalıcı)");

  // 5) Farklı bir palete geçiş de kalıcı oluyor (tek satırlık upsert doğru çalışıyor).
  const setRes2 = await api("PATCH", "/api/theme", { body: { palette: "minimal" }, token: admin });
  eq(setRes2.status, 200, "ikinci palet değişikliği 200");
  const after2 = await api("GET", "/api/theme");
  eq(after2.body.palette, "minimal", "ikinci GET güncel paleti gösteriyor");

  report("tema/palet uç noktası (e2e)");
} finally {
  await stopServer();
}
