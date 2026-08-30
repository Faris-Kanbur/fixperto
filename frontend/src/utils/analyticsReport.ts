import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Tamirci "Analiz" sekmesindeki verilerden profesyonel görünümlü, indirilebilir bir PDF raporu
// üretir (bkz. AppShell.tsx mechTab === "analytics", downloadAnalyticsReport). Sunucu tarafında
// hiçbir şey oluşturmuyor — tamamen istemci tarafında (jsPDF + jspdf-autotable) çiziliyor, bu
// yüzden backend'in demo/tek-kullanıcı mimarisinden (bkz. REFACTOR_REPORT.md) bağımsız çalışır.

const BRAND = {
  rose: [225, 29, 72] as [number, number, number], // tailwind rose-600
  roseDark: [190, 18, 60] as [number, number, number], // rose-700
  roseTint: [255, 241, 242] as [number, number, number], // rose-50
  ink: [17, 24, 39] as [number, number, number], // gray-900
  slate: [71, 85, 105] as [number, number, number], // slate-600
  gray: [107, 114, 128] as [number, number, number], // gray-500
  lightGray: [243, 244, 246] as [number, number, number], // gray-100
  border: [229, 231, 235] as [number, number, number], // gray-200
  green: [22, 163, 74] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

interface TopService {
  name: string;
  count: number;
  total: number;
}

export interface AnalyticsReportData {
  mechanicName: string;
  mechanicSpecialty?: string;
  rangeLabel: string;
  generatedAtLabel: string;
  totalBooked: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  completionRate: number;
  avgRating: number;
  reviewCount: number;
  totalEarnings: number;
  topServices: TopService[];
  rangeViews: number;
  rangeConversions: number;
  viewConvRate: number;
  totalSharesAllTime: number;
  activeListingsCount: number;
  totalApplicantsCount: number;
  currencySuffix?: string; // default "₺"
  labels: Record<string, string>; // önceden çevrilmiş (t()) tüm metinler — bkz. çağrı yeri
}

// Sayfanın sol üstünde küçük bir "F" madalyonu + "FIXPERTO" markası çizer — gerçek bir raster logo
// dosyası olmadığı için (bkz. proje kökü — hiçbir logo asseti yok) vektörel olarak çiziliyor.
function drawBrandMark(doc: jsPDF, x: number, y: number, scale = 1) {
  const badgeSize = 8 * scale;
  doc.setFillColor(...BRAND.white);
  doc.roundedRect(x, y, badgeSize, badgeSize, 1.6 * scale, 1.6 * scale, "F");
  doc.setTextColor(...BRAND.rose);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12 * scale);
  doc.text("F", x + badgeSize / 2, y + badgeSize / 2 + 3 * scale * 0.72, { align: "center" });
}

function formatMoney(n: number, suffix: string) {
  return `${Math.round(n).toLocaleString("tr-TR")}${suffix}`;
}

export function generateAnalyticsPdf(data: AnalyticsReportData) {
  const suffix = data.currencySuffix || "₺";
  const L = data.labels;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentW = pageW - marginX * 2;

  // ---- Üst marka bandı --------------------------------------------------------------------
  const headerH = 34;
  doc.setFillColor(...BRAND.rose);
  doc.rect(0, 0, pageW, headerH, "F");
  drawBrandMark(doc, marginX, 9, 1);
  doc.setTextColor(...BRAND.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("FIXPERTO", marginX + 11, 15.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 228, 230);
  doc.text(L.reportSubtitle, marginX + 11, 20.2);

  // Sağ üstte rapor meta bilgisi (tamirci adı, dönem, oluşturulma tarihi)
  doc.setTextColor(...BRAND.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(data.mechanicName, pageW - marginX, 13, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 228, 230);
  if (data.mechanicSpecialty) doc.text(data.mechanicSpecialty, pageW - marginX, 17.5, { align: "right" });
  doc.text(`${L.periodLabel}: ${data.rangeLabel}`, pageW - marginX, 22, { align: "right" });
  doc.text(`${L.generatedLabel}: ${data.generatedAtLabel}`, pageW - marginX, 26, { align: "right" });

  let y = headerH + 11;

  // ---- Bölüm başlığı ------------------------------------------------------------------------
  doc.setTextColor(...BRAND.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(L.summaryTitle, marginX, y);
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.3);
  doc.line(marginX, y + 2.2, pageW - marginX, y + 2.2);
  y += 10;

  // ---- KPI kartları (2x2) ---------------------------------------------------------------------
  const kpis: { label: string; value: string; accent: [number, number, number] }[] = [
    { label: L.totalBookingsLabel, value: String(data.totalBooked), accent: BRAND.rose },
    { label: L.completionRateLabel, value: `%${data.completionRate}`, accent: BRAND.green },
    { label: L.totalEarningsLabel, value: formatMoney(data.totalEarnings, suffix), accent: BRAND.roseDark },
    { label: L.avgRatingLabel, value: `${data.avgRating.toFixed(1)} / 5`, accent: BRAND.amber },
  ];
  const cardGap = 4;
  const cardW = (contentW - cardGap) / 2;
  const cardH = 20;
  kpis.forEach((k, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = marginX + col * (cardW + cardGap);
    const cy = y + row * (cardH + cardGap);
    doc.setFillColor(...BRAND.lightGray);
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "F");
    doc.setFillColor(...k.accent);
    doc.roundedRect(cx, cy, 1.6, cardH, 0.8, 0.8, "F");
    doc.setTextColor(...BRAND.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(k.value, cx + 6, cy + 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.gray);
    doc.text(k.label, cx + 6, cy + 16.5);
  });
  y += 2 * cardH + cardGap + 11;

  // ---- Randevu dağılımı (mini tablo) ----------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.ink);
  doc.text(L.bookingBreakdownTitle, marginX, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [[L.cameLabel, L.cancelledRejectedLabel, L.noShowLabel]],
    body: [[String(data.completedCount), String(data.cancelledCount), String(data.noShowCount)]],
    theme: "grid",
    styles: { halign: "center", fontSize: 10, cellPadding: 3, textColor: BRAND.ink, lineColor: BRAND.border, lineWidth: 0.2 },
    headStyles: { fillColor: BRAND.ink, textColor: BRAND.white, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontStyle: "bold", fontSize: 12 },
  });
  // `lastAutoTable` gibi jspdf-autotable'ın çalışma zamanında doc'a eklediği alanlar, yüklü
  // sürümün kendi type tanımlarında olup olmadığına bakılmaksızın güvenle okunsun diye `any`
  // üzerinden erişiliyor (bkz. jspdf-autotable resmi kullanım örnekleri).
  y = (doc as any).lastAutoTable.finalY + 11;

  // ---- En çok kazandıran hizmetler ---------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.ink);
  doc.text(L.topEarningServicesTitle, marginX, y);
  y += 5;
  if (data.topServices.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...BRAND.gray);
    doc.text(L.noPaidWorkYet, marginX, y + 4);
    y += 14;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [[L.serviceColumn, L.transactionsColumn, L.earningsColumn]],
      body: data.topServices.map(s => [s.name, String(s.count), formatMoney(s.total, suffix)]),
      theme: "striped",
      styles: { fontSize: 9.5, cellPadding: 3, textColor: BRAND.ink, lineColor: BRAND.border },
      headStyles: { fillColor: BRAND.rose, textColor: BRAND.white, fontStyle: "bold", fontSize: 8.5 },
      alternateRowStyles: { fillColor: BRAND.roseTint },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "right", fontStyle: "bold" } },
    });
    // `lastAutoTable` gibi jspdf-autotable'ın çalışma zamanında doc'a eklediği alanlar, yüklü
    // sürümün kendi type tanımlarında olup olmadığına bakılmaksızın güvenle okunsun diye `any`
    // üzerinden erişiliyor (bkz. jspdf-autotable resmi kullanım örnekleri).
    y = (doc as any).lastAutoTable.finalY + 11;
  }

  // Sayfa taşarsa yeni sayfa aç
  const pageH = doc.internal.pageSize.getHeight();
  if (y > pageH - 70) {
    doc.addPage();
    y = 18;
  }

  // ---- Profil ziyaretleri --------------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.ink);
  doc.text(L.profileVisitsTitle, marginX, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [[L.analyticsVisitsLabel, L.analyticsConversionsLabel, L.conversionRateLabel]],
    body: [[String(data.rangeViews), String(data.rangeConversions), `%${data.viewConvRate}`]],
    theme: "grid",
    styles: { halign: "center", fontSize: 10, cellPadding: 3, textColor: BRAND.ink, lineColor: BRAND.border, lineWidth: 0.2 },
    headStyles: { fillColor: BRAND.ink, textColor: BRAND.white, fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontStyle: "bold", fontSize: 12 },
  });
  // `lastAutoTable` gibi jspdf-autotable'ın çalışma zamanında doc'a eklediği alanlar, yüklü
  // sürümün kendi type tanımlarında olup olmadığına bakılmaksızın güvenle okunsun diye `any`
  // üzerinden erişiliyor (bkz. jspdf-autotable resmi kullanım örnekleri).
  y = (doc as any).lastAutoTable.finalY + 11;

  // ---- Genel bakış (satır satır özet) ---------------------------------------------------------
  if (y > pageH - 55) { doc.addPage(); y = 18; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.ink);
  doc.text(L.periodSummaryReportTitle, marginX, y);
  y += 5;
  const summaryRows: [string, string][] = [
    [L.profileAndListingSharesRow, String(data.totalSharesAllTime)],
    [L.activeCarListingsRow, String(data.activeListingsCount)],
    [L.totalJobApplicantsRow, String(data.totalApplicantsCount)],
    [L.reviewsCountRow, String(data.reviewCount)],
  ];
  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    body: summaryRows,
    theme: "plain",
    styles: { fontSize: 9.5, cellPadding: 2.2, textColor: BRAND.ink, lineColor: BRAND.border },
    columnStyles: { 0: { textColor: BRAND.gray }, 1: { halign: "right", fontStyle: "bold" } },
  });

  // ---- Alt bilgi (her sayfa) -------------------------------------------------------------------
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const fy = pageH - 10;
    doc.setDrawColor(...BRAND.border);
    doc.setLineWidth(0.2);
    doc.line(marginX, fy - 4, pageW - marginX, fy - 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.rose);
    doc.text("Fixperto", marginX, fy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.gray);
    doc.setFontSize(7.5);
    doc.text(L.footerNote, marginX + 16, fy);
    doc.text(`${L.pageLabel} ${p}/${pageCount}`, pageW - marginX, fy, { align: "right" });
  }

  const fileSafeDate = data.generatedAtLabel.replace(/[^\d]/g, "-");
  doc.save(`fixperto-analiz-raporu-${fileSafeDate}.pdf`);
}
