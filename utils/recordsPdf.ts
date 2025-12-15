import {
  PopulationRecord,
  STREET_OPTIONS
} from "@/constants/data";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export interface PrintOptions {
  street: string[]; // Multiple streets
  populationFilter: "all" | "adults_only" | "kids_only";
  reportType: "summary" | "detailed";
  hideNames: boolean;
}

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
 * Generates the HTML content for the Records Data PDF.
 */
export const generateRecordsReportHtml = (
  records: PopulationRecord[],
  options: PrintOptions,
  username: string
): string => {
  const { street, populationFilter, reportType, hideNames } = options;

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
    }
  );

  const totalAdults = stats.adultMale + stats.adultFemale;
  const totalKids = stats.kidsMale + stats.kidsFemale;
  const totalMale = stats.adultMale + stats.kidsMale;
  const totalFemale = stats.adultFemale + stats.kidsFemale;
  const totalPopulation = totalAdults + totalKids;
  const totalHouses = filteredRecords.length;
  
  // Calculate Average Residents (Occupied + Rented only to avoid skewing by empty houses)
  const occupiedCount = stats.housesOccupied + stats.housesRented;
  const avgResidents = occupiedCount > 0 
    ? (totalPopulation / occupiedCount).toFixed(1) 
    : "0";

  const summarySection = `
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
                <td class="label-cell">Total Hunian</td>
                <td class="num-cell strong">${totalHouses} Unit</td>
            </tr>
            <tr>
                <td class="label-cell" style="padding-left: 10px; color: #555;">• Ditempati (Milik)</td>
                <td class="num-cell">${stats.housesOccupied}</td>
            </tr>
             <tr>
                <td class="label-cell" style="padding-left: 10px; color: #555;">• Disewa / Kontrak</td>
                <td class="num-cell">${stats.housesRented}</td>
            </tr>
             <tr>
                <td class="label-cell" style="padding-left: 10px; color: #888;">• Kosong</td>
                <td class="num-cell text-muted">${stats.housesEmpty}</td>
            </tr>
            <tr class="highlight-row">
                <td class="label-cell" style="padding-top: 10px;">Rata-rata Warga / Rumah</td>
                <td class="num-cell strong" style="padding-top: 10px;">${avgResidents}</td>
            </tr>
         </table>
      </div>
    </div>
  `;

  // 3. Generate Tables (if detailed)
  let tablesHtml = "";
  if (reportType === "detailed") {
    // Dynamically identify which streets are present in the filtered records
    const distinctStreets = Array.from(new Set(filteredRecords.map(r => r.street)));
    
    // Sort streets
    distinctStreets.sort((a, b) => {
        const idxA = STREET_OPTIONS.indexOf(a);
        const idxB = STREET_OPTIONS.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    distinctStreets.forEach((currentStreet) => {
      const streetRecords = filteredRecords.filter(
        (r) => r.street === currentStreet
      );

      if (streetRecords.length > 0) {
        streetRecords.sort((a, b) =>
          (a.houseId || "").localeCompare(b.houseId || "")
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
                 <td style="text-align:center;">${adultCount}</td>
                  <td style="text-align:center;">${kidCount}</td>
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
                <th style="width: 10%">Dewasa</th>
                 <th style="width: 10%">Anak</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
             <tfoot>
              <tr style="background-color: #f9fafb; font-weight: bold;">
                <td colspan="4" style="text-align: right; padding-right: 15px;">Total:</td>
                <td style="text-align: center;">${subTotalAdults}</td>
                <td style="text-align: center;">${subTotalKids}</td>
              </tr>
            </tfoot>
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
  
  const streetLabel = isAllStreets 
    ? "Semua Jalan" 
    : street.join(", ");
    
  const filterDesc = `Lokasi: ${streetLabel} | Kategori: ${
    populationFilter === "all"
      ? "Semua"
      : populationFilter === "kids_only"
      ? "Anak-anak"
      : "Dewasa"
  }`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Laporan Data Warga - ${dateStr}</title>
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
        <h1>Laporan Data Warga Populite</h1>
        <h2>${filterDesc}</h2>
        
        <h3 style="font-size:14px; margin-bottom:10px; color:#333; border-left:4px solid #4F46E5; padding-left:10px;">Ringkasan Eksekutif</h3>
        ${summarySection}
        
        ${reportType === 'detailed' ? `<h3 style="font-size:14px; margin-bottom:10px; color:#333; border-left:4px solid #4F46E5; padding-left:10px;">Rincian Data</h3>` : ''}
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
