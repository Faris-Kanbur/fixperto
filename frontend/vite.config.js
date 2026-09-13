import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path aliases mirror tsconfig.json's "paths" below — keep both in sync when adding a new one.
/**
 * İÇERİK GÜVENLİK POLİTİKASI (CSP) — YALNIZCA ÜRETİM DERLEMESİNDE.
 * ================================================================================================
 * NEDEN GEREKLİ: oturum jetonu localStorage'da tutuluyor. Bu, sayfa yenilemesinde oturumun
 * sürmesi için pratik bir seçim ama şu bedeli var: sayfaya SCRIPT sokabilen biri jetonu okuyup
 * hesabı devralır. CSP, o "script sokma" adımını en baştan imkânsıza yakın hâle getiren ikinci
 * savunma hattıdır — kodda XSS olmadığını denetledik (dangerouslySetInnerHTML yok, tehlikeli
 * JS havuzu yok, kullanıcı adresleri safeHref'ten geçiyor), ama tek bir gelecekteki hata
 * yeterli olur. Derinlemesine savunmanın anlamı budur.
 *
 * NEDEN SADECE ÜRETİMDE: Vite geliştirme sunucusu sıcak yenileme (HMR) için index.html'e SATIR İÇİ
 * script enjekte ediyor. `script-src 'self'` bunu engeller ve `npm run dev` çalışmaz hâle gelir.
 * Geliştiriciyi engelleyen bir güvenlik önlemi, kapatılana kadar yaşar — o yüzden yalnızca
 * derlenmiş çıktıya ekliyoruz.
 *
 * NELERİ KAPSIYOR ve NEDEN BU KADARI:
 *   script-src 'self'  → sayfaya dışarıdan ya da satır içi script sokulamaz. XSS'in asıl kazancı budur.
 *   object-src 'none'  → <object>/<embed> ile eklenti tabanlı kaçış yolu kapalı.
 *   base-uri 'self'    → <base> etiketi enjekte edip TÜM göreli adresleri saldırgan sunucusuna
 *                        yönlendirme numarası kapalı (sık atlanan bir açık).
 *   form-action 'self' → enjekte edilmiş bir formun veriyi dışarı POST etmesi engellenir.
 *   img-src / connect-src GENİŞ bırakıldı: ilan fotoğrafları dış adreslerden geliyor ve API'nin
 *   adresi dağıtıma göre değişiyor (VITE_API_URL). Buraya dar bir liste yazmak, yanlış
 *   yapılandırmada siteyi tamamen çalışmaz hâle getirirdi — ve çalışmayan site, kapatılan CSP demek.
 *
 * frame-ancestors BURADA YOK: meta etiketiyle verildiğinde tarayıcılar onu YOK SAYAR. Çerçeveleme
 * (clickjacking) koruması sunucu başlığıyla verilmeli — API tarafında X-Frame-Options: DENY var,
 * ön yüzü barındıran sunucuda da aynısının ayarlanması gerekiyor (bkz. el kitabı).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",   // React satır içi style={{...}} nitelikleri
  "img-src 'self' data: https: http:",
  "font-src 'self' data:",
  "connect-src 'self' https: http:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const cspPlugin = {
  name: "fixperto-csp",
  apply: "build",
  transformIndexHtml(html) {
    return html.replace("</title>", `</title>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
  },
};

export default defineConfig({
  plugins: [react(), cspPlugin],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/data": path.resolve(__dirname, "./src/data"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/app": path.resolve(__dirname, "./src/app"),
    },
  },
  server: {
    port: 5173,
  },
});
