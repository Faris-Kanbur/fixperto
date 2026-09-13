import { startServer, stopServer, api, createUser, row } from "./harness.mjs";
try {
  await startServer();
  const o = await createUser("owner", { name: "Ayşe Test", email: "ayse@example.com" });
  console.log("owner id:", o.id);
  const me = await api("GET", "/api/auth/me", { token: o.token });
  console.log("me:", me.status, me.body?.email);
  const v = await api("POST", "/api/vehicles", { token: o.token, body: { brand: "BMW", model: "320i", year: 2019, plate: "34ABC123" } });
  console.log("vehicle create:", v.status, JSON.stringify(v.body).slice(0, 120));
  console.log("DB:", JSON.stringify(row("SELECT id, ownerId, brand, plate FROM vehicles WHERE id = ?", v.body?.id)));
} catch (e) { console.error("HATA:", e.message); }
finally { stopServer(); }
