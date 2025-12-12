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
  const totalPopulation = filteredRecords.reduce((sum, r) => {
    if (populationFilter === "adults_only") return sum + r.adultTotal;
    if (populationFilter === "kids_only") return sum + r.kidsTotal;
    return sum + r.adultTotal + r.kidsTotal;
  }, 0);

  const totalAdults = filteredRecords.reduce((sum, r) => sum + r.adultTotal, 0);
  const totalKids = filteredRecords.reduce((sum, r) => sum + r.kidsTotal, 0);

  const housesOccupied = filteredRecords.filter(
    (r) => r.houseStatus === "Ditempati"
  ).length;
  const housesRented = filteredRecords.filter(
    (r) => r.houseStatus === "Sewa"
  ).length;
  const housesEmpty = filteredRecords.filter(
    (r) => r.houseStatus === "Kosong"
  ).length;
  const totalHouses = filteredRecords.length;

  const summarySection = `
    <div class="summary-box">
      <div class="summary-item">
        <div class="summary-label">Total Warga</div>
        <div class="summary-value text-blue">${totalPopulation}</div>
        <div class="summary-sublabel">Total Keseluruhan</div>
      </div>
       <div class="summary-item">
        <div class="summary-label">Dewasa</div>
        <div class="summary-value text-gray-dark">${totalAdults}</div>
         <div class="summary-sublabel">Warga Dewasa</div>
      </div>
       <div class="summary-item">
        <div class="summary-label">Anak-anak</div>
        <div class="summary-value text-gray-dark">${totalKids}</div>
         <div class="summary-sublabel">Warga Anak</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Total Hunian</div>
        <div class="summary-value text-gray-dark">${totalHouses}</div>
        <div class="summary-sublabel">
           (Tetap: ${housesOccupied}, Sewa: ${housesRented}, Kosong: ${housesEmpty})
        </div>
      </div>
    </div>
  `;

  // 3. Generate Tables (if detailed)
  let tablesHtml = "";
  if (reportType === "detailed") {
    // Dynamically identify which streets are present in the filtered records
    // This ensures we show tables for data that exists, avoiding mismatches with STREET_OPTIONS
    const distinctStreets = Array.from(new Set(filteredRecords.map(r => r.street)));
    
    // Sort streets to match STREET_OPTIONS order if possible, or alphabetical
    distinctStreets.sort((a, b) => {
        const idxA = STREET_OPTIONS.indexOf(a);
        const idxB = STREET_OPTIONS.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    distinctStreets.forEach((currentStreet) => {
      // Get records for this street from our ALREADY FILTERED list
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
            
             // Calculate display values based on filter
             // Even if filter is 'all', we separate columns.
             // If filter is 'kids_only', does the user want the Adult column to be 0 or show actual adults in that house?
             // Usually filters narrow down RECORDS. The columns should show data for those records.
             // However, for totals, the requirements say "population number either all or selected".
             // If filtered to 'Kids Only', likely we care about kids count.
             // But showing context (Adults in that house) is helpful.
             // Let's stick to showing actual data of the record.
            
             const adultCount = r.adultTotal;
             const kidCount = r.kidsTotal;
             
             // Update subtotals
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
          h2 { text-align: center; font-size: 14px; color: #666; margin-top: 0; margin-bottom: 20px; font-weight: normal; }
          
          .summary-box { display: flex; justify-content: center; gap: 10px; margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #f9fafb; }
          .summary-item { text-align: center; flex: 1; padding: 0 5px; border-right: 1px solid #eee; }
          .summary-item:last-child { border-right: none; }
          .summary-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
          .summary-value { font-size: 20px; font-weight: bold; }
          .summary-sublabel { font-size: 10px; color: #888; margin-top: 4px; }
          
          .text-blue { color: #3B82F6; }
          .text-gray-dark { color: #374151; }
          
          .street-header { border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 20px; color: #333; font-size: 16px; font-weight: bold; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th, td { border: 1px solid #eee; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; color: #555; text-align: center; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <h1>Laporan Data Warga</h1>
        <h2>${filterDesc}</h2>
        
        ${summarySection}
        
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
