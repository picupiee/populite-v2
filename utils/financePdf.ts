import { FINANCE_INCOME_SOURCES, FINANCE_SPENDING_TYPES } from "@/constants/finance";
import { MonthlyReport } from "@/hooks/useMonthlyFinanceReport";
import { format } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Formats a number into Indonesian Rupiah (Rp) currency string.
 */
const formatRupiah = (amount: number): string => {
    if (isNaN(amount)) return "Rp 0";
    const cleanAmount = Math.round(amount);
    return "Rp " + cleanAmount.toLocaleString("id-ID", { minimumFractionDigits: 0 });
};

/**
 * Escapes HTML characters to prevent XSS attacks.
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
 * Generates the HTML content for the Finance Report PDF.
 */
export const generateFinanceReportHtml = (report: MonthlyReport): string => {
    const { monthYear, totalIncome, totalSpending, netBalance, allIncomes, allSpendings } = report;

    const incomeRows = allIncomes.map((record) => {
        const sourceLabel = FINANCE_INCOME_SOURCES.find((s) => s.id === record.source)?.label || record.source;
        const dateStr = format(new Date(record.date), "dd MMM yyyy", { locale: id });
        return `
      <tr>
        <td>${dateStr}</td>
        <td>${escapeHtml(sourceLabel)}</td>
        <td>${escapeHtml(record.note || "-")}</td>
        <td class="amount">${formatRupiah(record.amount)}</td>
      </tr>
    `;
    }).join("");

    const spendingRows = allSpendings.map((record) => {
        const typeLabel = FINANCE_SPENDING_TYPES.find((t) => t.id === record.type)?.label || record.type;
        const dateStr = format(new Date(record.date), "dd MMM yyyy", { locale: id });
        return `
      <tr>
        <td>${dateStr}</td>
        <td>${escapeHtml(typeLabel)}</td>
        <td>${escapeHtml(record.note || "-")}</td>
        <td class="amount">${formatRupiah(record.amount)}</td>
      </tr>
    `;
    }).join("");

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Laporan Keuangan - ${monthYear}</title>
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            padding: 20px;
            color: #333;
          }
          h1 {
            text-align: center;
            color: #4F46E5;
            margin-bottom: 10px;
          }
          h2 {
            text-align: center;
            font-size: 16px;
            color: #666;
            margin-top: 0;
            margin-bottom: 30px;
          }
          .periode {
            text-align: center;
            font-size: 22px;
            color: #666;
            margin-top: 0;
            margin-bottom: 20;
            }
          .subtitle {
            text-align: center;
            font-size: 26px;
            color: #666;
            margin-top: 0;
            margin-bottom: 10px;
            }
          .maintitle {
            text-align: center;
            font-size: 32px;
            color: #4F46E5;
            margin-bottom: 5px
            }
          .summary-box {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
            background-color: #f9fafb;
          }
          .summary-item {
            text-align: center;
            flex: 1;
          }
          .summary-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
          }
          .summary-value {
            font-size: 18px;
            font-weight: bold;
          }
          .text-green { color: #10B981; }
          .text-red { color: #EF4444; }
          .text-blue { color: #3B82F6; }
          
          h3 {
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-top: 30px;
            color: #333;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #eee;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #555;
          }
          .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <h1 class="maintitle">Laporan Kas RT 003</h1>
        <h2 class="subtitle">Puri Harmoni Pasir Mukti</h2>
        <p class="periode">Periode: ${monthYear}</p>
        <div class="summary-box">
          <div class="summary-item">
            <div class="summary-label">Total Pemasukan</div>
            <div class="summary-value text-green">${formatRupiah(totalIncome)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total Pengeluaran</div>
            <div class="summary-value text-red">${formatRupiah(totalSpending)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Saldo Bersih</div>
            <div class="summary-value text-blue">${formatRupiah(netBalance)}</div>
          </div>
        </div>

        <h3>Rincian Pemasukan</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 15%">Tanggal</th>
              <th style="width: 25%">Sumber</th>
              <th style="width: 40%">Catatan</th>
              <th style="width: 20%">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${incomeRows.length > 0 ? incomeRows : '<tr><td colspan="4" style="text-align:center; font-style:italic; padding: 20px;">Tidak ada data pemasukan</td></tr>'}
            <tr>
              <td colspan="3" style="text-align:right; font-weight:bold;">Total Pemasukan</td>
              <td style="text-align:right; font-weight:bold;">${formatRupiah(totalIncome)}</td>
            </tr>
          </tbody>
        </table>

        <h3>Rincian Pengeluaran</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 15%">Tanggal</th>
              <th style="width: 25%">Tipe</th>
              <th style="width: 40%">Catatan</th>
              <th style="width: 20%">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${spendingRows.length > 0 ? spendingRows : '<tr><td colspan="4" style="text-align:center; font-style:italic; padding: 20px;">Tidak ada data pengeluaran</td></tr>'}
            <tr>
              <td colspan="3" style="text-align:right; font-weight:bold;">Total Pengeluaran</td>
              <td style="text-align:right; font-weight:bold;">${formatRupiah(totalSpending)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          Dicetak pada: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}<br>
          Populite - Sistem Pendataan Warga
        </div>
      </body>
    </html>
  `;
};
