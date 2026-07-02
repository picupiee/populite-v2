import { PopulationRecord, STREET_OPTIONS } from "@/constants/data";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export interface PrintOptions {
  street: string[]; // Multiple streets
  populationFilter: "all" | "adults_only" | "kids_only";
  reportType: "summary" | "detailed" | "simple_list";
  hideNames: boolean;
  hideSummary?: boolean;
  isMonthly?: boolean;
  revisionNumber?: string;
  customTitle?: string;
}

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

/**
 * Escapes HTML characters to prevent XSS.
 */
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Shared utility to print or share an HTML string.
 */
export const printHtmlReport = async (html: string, title?: string) => {
  try {
    if (Platform.OS === "web") {
      const iframe = document.createElement("iframe");
      iframe.style.height = "0";
      iframe.style.visibility = "hidden";
      iframe.style.width = "0";
      iframe.style.position = "absolute";
      iframe.srcdoc = html;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 100);
      };
    } else {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: title || "Laporan Data Warga",
      });
    }
  } catch (error) {
    console.error("Print Error:", error);
    throw error;
  }
};

/**
 * Generates the HTML content for the Records Data PDF.
 */
export const generateRecordsReportHtml = (
  records: PopulationRecord[],
  options: PrintOptions,
  username: string,
): string => {
  const {
    street,
    populationFilter,
    reportType,
    hideNames,
    hideSummary,
    isMonthly,
    revisionNumber,
    customTitle,
  } = options;

  // 1. Filter Records based on options
  let filteredRecords = records;

  // Filter by Street (Multiple)
  // Logic: If street array is empty or contains "Semua" (if passed), include all.
  // Otherwise, include only if record.street is in the street array.
  // We assume the modal passes specific streets OR ["Semua"].
  const isAllStreets = street.includes("Semua") || street.length === 0;

  if (!isAllStreets) {
    filteredRecords = filteredRecords.filter((r) => street.includes(r.street));
  }

  // Filter by Population Category
  if (populationFilter === "kids_only") {
    filteredRecords = filteredRecords.filter((r) => r.kidsTotal > 0);
  }

  // 2. Calculate Summaries
  const stats = filteredRecords.reduce(
    (acc, r) => {
      // Demographics
      acc.adultMale += r.adultMale || 0;
      acc.adultFemale += r.adultFemale || 0;
      acc.kidsMale += r.kidsMale || 0;
      acc.kidsFemale += r.kidsFemale || 0;

      // Totals from fields (fallback to male+female if needed, but per user request data is entered)
      // We will derive totals from the male/female sums to ensure table consistency

      // House Status
      if (r.houseStatus === "Ditempati") acc.housesOccupied++;
      else if (r.houseStatus === "Sewa") acc.housesRented++;
      else if (r.houseStatus === "Kosong") acc.housesEmpty++;

      return acc;
    },
    {
      adultMale: 0,
      adultFemale: 0,
      kidsMale: 0,
      kidsFemale: 0,
      housesOccupied: 0,
      housesRented: 0,
      housesEmpty: 0,
    },
  );

  const totalAdults = stats.adultMale + stats.adultFemale;
  const totalKids = stats.kidsMale + stats.kidsFemale;
  const totalMale = stats.adultMale + stats.kidsMale;
  const totalFemale = stats.adultFemale + stats.kidsFemale;
  const totalPopulation = totalAdults + totalKids;
  const totalHouses = filteredRecords.length;

  // Calculate Average Residents (Occupied + Rented only to avoid skewing by empty houses)
  const occupiedCount = stats.housesOccupied + stats.housesRented;
  const avgResidents =
    occupiedCount > 0 ? (totalPopulation / occupiedCount).toFixed(1) : "0";

  // Group Records by Street (used by both Monthly and Detailed reports)
  const needsStreetGrouping = isMonthly || reportType === "detailed" || reportType === "simple_list";
  const recordsByStreet = new Map<string, PopulationRecord[]>();
  let distinctStreets: string[] = [];

  if (needsStreetGrouping) {
    filteredRecords.forEach((r) => {
      if (!recordsByStreet.has(r.street)) recordsByStreet.set(r.street, []);
      recordsByStreet.get(r.street)!.push(r);
    });

    distinctStreets = Array.from(recordsByStreet.keys()).sort((a, b) => {
      const idxA = STREET_OPTIONS.indexOf(a);
      const idxB = STREET_OPTIONS.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }

  const summarySection = hideSummary ? "" : `
    <div class="summary-container">
      <!-- Card 1: Demografi Warga -->
      <div class="summary-card">
        <div class="summary-title">Demografi Sebaran Warga</div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40%; text-align:left;">Kategori</th>
                    <th style="width: 20%;">L</th>
                    <th style="width: 20%;">P</th>
                    <th style="width: 20%;">Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="label-cell">Dewasa</td>
                    <td class="num-cell">${stats.adultMale}</td>
                    <td class="num-cell">${stats.adultFemale}</td>
                    <td class="num-cell strong">${totalAdults}</td>
                </tr>
                <tr>
                    <td class="label-cell">Anak-Anak</td>
                    <td class="num-cell">${stats.kidsMale}</td>
                    <td class="num-cell">${stats.kidsFemale}</td>
                    <td class="num-cell strong">${totalKids}</td>
                </tr>
                <tr class="total-row">
                    <td class="label-cell">Total</td>
                    <td class="num-cell">${totalMale}</td>
                    <td class="num-cell">${totalFemale}</td>
                    <td class="num-cell">${totalPopulation}</td>
                </tr>
            </tbody>
        </table>
      </div>

      <!-- Card 2: Statistik Hunian -->
      <div class="summary-card">
         <div class="summary-title">Statistik Hunian & Warga</div>
         <table class="report-table no-border">
            <tr>
                <td class="label-cell" style="padding-left: 5px;">Total Hunian</td>
                <td class="num-cell strong" style="padding-right: 2px;">${totalHouses} Unit</td>
            </tr>
            <tr>
                <td class="label-cell" style="padding-left: 10px; color: #555;">• Ditempati (Milik)</td>
                <td class="num-cell" style="padding-right: 2px;">${stats.housesOccupied}</td>
            </tr>
             <tr>
                <td class="label-cell" style="padding-left: 10px; color: #555;">• Disewa / Kontrak</td>
                <td class="num-cell" style="padding-right: 2px;">${stats.housesRented}</td>
            </tr>
             <tr>
                <td class="label-cell" style="padding-left: 10px; color: #888;">• Kosong</td>
                <td class="num-cell text-muted" style="padding-right: 2px;">${stats.housesEmpty}</td>
            </tr>
            <tr class="highlight-row">
                <td class="label-cell" style="padding-top: 10px; padding-left: 5px;">Rata-Rata Penghuni / Rumah</td>
                <td class="num-cell strong" style="padding-top: 10px; padding-right: 2px;">${avgResidents}</td>
            </tr>
         </table>
       </div>
    </div>
  `;

  // 2.5 Generate Per-Street Summary Table (Only for Monthly Report)
  let streetSummarySection = "";
  if (isMonthly && !hideSummary) {
    let streetRows = "";
    let totalSOccupied = 0;
    let totalSRented = 0;
    let totalSEmpty = 0;
    let totalSAdults = 0;
    let totalSKids = 0;

    distinctStreets.forEach((currentStreet) => {
      const sRecords = recordsByStreet.get(currentStreet) || [];

      const sStats = sRecords.reduce(
        (acc, r) => {
          acc.adults += (r.adultMale || 0) + (r.adultFemale || 0);
          acc.kids += (r.kidsMale || 0) + (r.kidsFemale || 0);
          if (r.houseStatus === "Ditempati") acc.occupied++;
          else if (r.houseStatus === "Sewa") acc.rented++;
          else if (r.houseStatus === "Kosong") acc.empty++;
          return acc;
        },
        { adults: 0, kids: 0, occupied: 0, rented: 0, empty: 0 },
      );

      totalSAdults += sStats.adults;
      totalSKids += sStats.kids;
      totalSOccupied += sStats.occupied;
      totalSRented += sStats.rented;
      totalSEmpty += sStats.empty;

      streetRows += `
        <tr>
          <td class="label-cell" style="text-align:center;">${currentStreet}</td>
          <td class="num-cell" style="text-align:center;">${sStats.adults}</td>
          <td class="num-cell" style="text-align:center;">${sStats.kids}</td>
          <td class="num-cell strong" style="text-align:center;">${sStats.adults + sStats.kids}</td>
          <td class="num-cell" style="text-align:center; border-left: 1px solid #e5e7eb;">${sStats.occupied}</td>
          <td class="num-cell" style="text-align:center;">${sStats.rented}</td>
          <td class="num-cell text-muted" style="text-align:center;">${sStats.empty}</td>
          <td class="num-cell strong" style="text-align:center;">${sStats.occupied + sStats.rented + sStats.empty}</td>
        </tr>
      `;
    });

    streetSummarySection = `
      <div class="summary-card" style="margin-bottom: 40px;">
        <div class="summary-title" style="text-align:center;">Rekapitulasi Demografi & Hunian per Jalan</div>
        <table class="report-table">
          <thead>
            <tr>
              <th rowspan="2" style="vertical-align:middle; border-right: 1px solid #e5e7eb;">Nama Jalan</th>
              <th colspan="3" style="text-align:center; border-bottom: 1px solid #e5e7eb;">Populasi Warga</th>
              <th colspan="4" style="text-align:center; border-left: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">Status Hunian (Unit)</th>
            </tr>
            <tr>
              <th style="width:10%;">Dewasa</th>
              <th style="width:10%;">Anak</th>
              <th style="width:12%;">Total</th>
              <th style="width:10%; border-left: 1px solid #e5e7eb;">Milik</th>
              <th style="width:10%;">Sewa</th>
              <th style="width:10%;">Kosong</th>
              <th style="width:12%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${streetRows}
          </tbody>
          <tfoot>
             <tr class="total-row">
                <td class="label-cell" style="text-align:center; border-right: 1px solid #e5e7eb;">Total Keseluruhan</td>
                <td class="num-cell" style="text-align:center;">${totalSAdults}</td>
                <td class="num-cell" style="text-align:center;">${totalSKids}</td>
                <td class="num-cell strong" style="text-align:center;">${totalSAdults + totalSKids}</td>
                <td class="num-cell" style="text-align:center; border-left: 1px solid #e5e7eb;">${totalSOccupied}</td>
                <td class="num-cell" style="text-align:center;">${totalSRented}</td>
                <td class="num-cell" style="text-align:center;">${totalSEmpty}</td>
                <td class="num-cell strong" style="text-align:center;">${totalSOccupied + totalSRented + totalSEmpty}</td>
             </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  // 3. Generate Tables (if detailed or simple_list)
  let tablesHtml = "";
  if (reportType === "detailed" || reportType === "simple_list") {
    const isSimple = reportType === "simple_list";

    distinctStreets.forEach((currentStreet) => {
      const streetRecords = recordsByStreet.get(currentStreet) || [];

      if (streetRecords.length > 0) {
        streetRecords.sort((a, b) =>
          (a.houseId || "").localeCompare(b.houseId || ""),
        );

        let subTotalAdults = 0;
        let subTotalKids = 0;

        const rows = streetRecords
          .map((r, index) => {
            const residentName = hideNames
              ? `<span style="color:#999; font-style:italic;">Nama Disembunyikan</span>`
              : escapeHtml(r.name);

            // For the table, we use the specific breakdown if available or just Total?
            // The old table just showed Adult Total and Kid Total.
            // We can keep that simple or expand it. The user requirement was about the "Summary" lacking breakdown.
            // The "Detailed Data" lists each house.
            // "We split these data into detailed data like from the adult and kids total now include how many women and men... Then make an averege... So this "Ringkasan" will be looked like a proper summary report"
            // It implies modifying the "Ringkasan" (Summary) section mainly.
            // I'll keep the detailed table columns simple (Total Adult, Total Kids) to save space, unless requested.

            const adultCount = r.adultTotal;
            const kidCount = r.kidsTotal;

            subTotalAdults += adultCount;
            subTotalKids += kidCount;

            return `
            <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td style="text-align:center;">${escapeHtml(r.houseId || "-")}</td>
                <td style="text-align:center;">${escapeHtml(r.houseStatus)}</td>
                <td>${residentName}</td>
                 ${!isSimple ? `<td style="text-align:center;">${adultCount}</td><td style="text-align:center;">${kidCount}</td>` : ""}
            </tr>
            `;
          })
          .join("");

        const tableFragment = `
          <h3 class="street-header">Jalan ${currentStreet} <span style="font-size:12px; font-weight:normal; color:#666;">(${streetRecords.length} Hunian)</span></h3>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">No</th>
                <th style="width: 15%">No. Rumah</th>
                <th style="width: 15%">Status</th>
                <th style="width: 45%">Warga</th>
                ${!isSimple ? `<th style="width: 10%">Dewasa</th><th style="width: 10%">Anak</th>` : ""}
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
             ${!isSimple ? `<tfoot>
              <tr style="background-color: #f9fafb; font-weight: bold;">
                <td colspan="4" style="text-align: right; padding-right: 15px;">Total:</td>
                <td style="text-align: center;">${subTotalAdults}</td>
                <td style="text-align: center;">${subTotalKids}</td>
              </tr>
            </tfoot>` : ""}
          </table>
          <div style="margin-bottom: 20px;"></div>
        `;

        tablesHtml += tableFragment;
      }
    });

    if (tablesHtml === "") {
      tablesHtml = `<p style="text-align:center; padding: 20px; font-style:italic; color:#999;">Tidak ada data untuk kriteria yang dipilih.</p>`;
    }
  }

  // 4. HTML Template
  const dateStr = format(new Date(), "dd MMMM yyyy HH:mm", { locale: id });

  const streetLabel = isAllStreets ? "Semua Jalan" : street.join(", ");

  const filterDesc = `Lokasi: ${streetLabel} | Kategori: ${
    populationFilter === "all"
      ? "Semua"
      : populationFilter === "kids_only"
        ? "Anak-anak"
        : "Dewasa"
  }`;

  const monthYearStr = format(new Date(), "MMMM yyyy", { locale: id });
  
  let baseTitle = isMonthly
    ? `Laporan Bulanan Warga - ${monthYearStr}`
    : "Laporan Data Warga";

  // Use custom title if provided
  if (customTitle && customTitle.trim() !== "") {
    baseTitle = customTitle.trim();
  }

  let documentTitle = baseTitle;
  let headerTitleHtml = escapeHtml(baseTitle);

  if (isMonthly && revisionNumber && revisionNumber.trim() !== "") {
    const revText = `(Revisi ${revisionNumber.trim()})`;
    documentTitle += ` ${revText}`;
    headerTitleHtml += `<br>${escapeHtml(revText)}`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(documentTitle)} - ${dateStr}</title>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; }
          h1 { text-align: center; color: #4F46E5; margin-bottom: 5px; }
          h2 { text-align: center; font-size: 14px; color: #666; margin-top: 0; margin-bottom: 30px; font-weight: normal; }
          
          /* Summary Section CSS */
          .summary-container { display: flex; gap: 20px; margin-bottom: 40px; }
          .summary-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px 20px; background-color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
          .summary-title { font-size: 14px; font-weight: bold; color: #111827; margin-bottom: 12px; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          
          .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
          .report-table th { text-align: center; padding: 8px; border-bottom: 1px solid #e5e7eb; background-color: #f9fafb; color: #666; font-size: 11px; text-transform: uppercase; }
          .report-table td { padding: 8px 4px; border-bottom: 1px solid #f3f4f6; }
          
          .report-table.no-border td { border-bottom: none; padding: 5px 0; }
          
          .label-cell { color: #374151; font-weight: 500; }
          .num-cell { text-align: right; color: #111827; }
          .strong { font-weight: bold; }
          .text-muted { color: #9ca3af; }
          
          .total-row td { border-top: 2px solid #e5e7eb; font-weight: bold; color: #000; background-color: #fafafa; }
          .highlight-row td { border-top: 1px dashed #e5e7eb; margin-top: 5px; color: #4F46E5; }
          
          /* Detailed Table CSS */
          .street-header { border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 25px; color: #333; font-size: 16px; font-weight: bold; page-break-after: avoid; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; color: #555; text-align: center; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>${headerTitleHtml}</h1>
        <h2>${filterDesc}</h2>
        
        <h3 style="font-size:14px; margin-bottom:10px; color:#333; border-left:4px solid #4F46E5; padding-left:10px;">Ringkasan Eksekutif</h3>
        ${summarySection}
        ${streetSummarySection}
        
        ${reportType === "detailed" || reportType === "simple_list" ? `<h3 style="font-size:14px; margin-bottom:10px; color:#333; border-left:4px solid #4F46E5; padding-left:10px;">Rincian Data</h3>` : ""}
        ${tablesHtml}
        
        <div class="footer">
          Dicetak pada: ${dateStr}<br>
          Generated by: ${escapeHtml(username)}<br>
          Populite - Sistem Pendataan Warga
        </div>
      </body>
    </html>
  `;
};
