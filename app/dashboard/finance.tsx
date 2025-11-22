import { addMonths, subMonths } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';

// Hooks & Types
import { FINANCE_SPENDING_TYPES } from '@/constants/finance';
import { useAccess } from '@/hooks/useAccess';
import { useMonthlyFinanceReport } from '@/hooks/useMonthlyFinanceReport';

// UI Components
import AppButton from '@/components/ui/AppButton';
import Ionicons from '@expo/vector-icons/Ionicons';
// import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale } from 'lucide-react-native';

// --- UTILITY FUNCTIONS ---

/**
 * Formats a number into Indonesian Rupiah (Rp) currency string.
 * @param amount - The number to format.
 * @returns Formatted Rupiah string.
 */
const formatRupiah = (amount: number): string => {
  if (isNaN(amount)) return 'Rp 0';
  const cleanAmount = Math.round(amount); // Round to nearest integer for typical IDR
  return 'Rp ' + cleanAmount.toLocaleString('id-ID', { minimumFractionDigits: 0 });
};

/**
 * Retrieves the display label for a spending type ID.
 * @param typeId - The spending type ID from the record.
 * @returns The label or the raw ID if not found.
 */
const getSpendingTypeLabel = (typeId: string): string => {
  return FINANCE_SPENDING_TYPES.find(t => t.id === typeId)?.label || typeId;
};

// --- REPORT SCREEN COMPONENTS ---

// --- REPORT SCREEN COMPONENTS ---

// 1. Monthly Summary Card
const SummaryCard: React.FC<{ title: string; amount: number; icon: React.ReactNode; color: string }> = ({ title, amount, icon, color }) => (
  <View className={`flex-1 p-4 rounded-xl shadow-lg m-1 bg-white border border-${color}-100`}>
    <View className="flex-row items-center justify-between">
      <Text className={`text-xs font-semibold uppercase text-${color}-600`}>{title}</Text>
      {icon}
    </View>
    <Text className={`text-xl font-bold mt-1 text-gray-800`}>
      {formatRupiah(amount)}
    </Text>
  </View>
);

// 2. Breakdown Card (Similar to StatusCard in Population Summary)
const BreakdownCard = ({
  label,
  amount,
  total,
  color,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
}) => {
  const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : "0.0";
  return (
    <View className="flex-row justify-between items-center py-1 border-b border-gray-100">
      <View className="flex-row items-center flex-1">
        <View
          className={`w-3 h-3 rounded-full ${color === "green" ? "bg-green-500" : "bg-red-500"}`}
        />
        <Text className="ml-3 text-md text-gray-700 font-medium">{label}</Text>
      </View>
      <View className="items-end">
        <Text className={`text-base font-semibold ${color === "green" ? "text-green-700" : "text-red-700"}`}>
          {formatRupiah(amount)}
        </Text>
        <Text className="text-xs text-gray-500">{percentage}%</Text>
      </View>
    </View>
  );
};

// --- MAIN SCREEN ---
export default function FinanceReportScreen() {
  const router = useRouter();
  const { can, PERMISSIONS } = useAccess();
  const canCreate = can(PERMISSIONS.CREATE_FINANCE_ENTRY);

  const { report, loading, error, currentDate, setCurrentDate } = useMonthlyFinanceReport();

  // Handlers for month navigation
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  }, [setCurrentDate]);

  // Handle data loading state
  if (loading && !report) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-600">Memuat data keuangan bulanan...</Text>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-white">
        <Text className="text-xl font-bold text-red-500">Kesalahan Data</Text>
        <Text className="text-center text-gray-600 mt-2">{error.message}</Text>
        <AppButton title="Muat Ulang" onPress={() => setCurrentDate(new Date())} variant="primary" className="mt-4" />
      </View>
    );
  }

  // Check if the report is null (should only happen during initial load/error, but defensive check)
  if (!report) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-white">
        <Text className="text-xl font-bold text-gray-800">Tidak Ada Data</Text>
        <Text className="text-center text-gray-600 mt-2">Tidak ada data transaksi yang ditemukan untuk bulan ini.</Text>
        {canCreate && (
          <AppButton title="Catat Pemasukan/Pengeluaran" onPress={() => router.push('/dashboard/(secure)/(finance)/create-income')} variant="primary" className="mt-4" />
        )}
      </View>
    );
  }

  // --- MAIN RENDER ---
  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        // Simple refresh control to force data reload by resetting date state to current value
        <RefreshControl
          refreshing={loading}
          onRefresh={() => setCurrentDate(new Date(currentDate.getTime()))}
          colors={['#4F46E5']}
        />
      }
    >

      {/* --- Month Navigation and Title --- */}
      <View className="bg-white p-5 shadow-sm border-b border-gray-200">
        <Text className="text-xl font-extrabold text-gray-900 mb-3">
          Laporan Kas RT (Bulanan)
        </Text>

        <View className="flex-row items-center justify-between bg-gray-100 rounded-lg p-2">
          <TouchableOpacity onPress={() => navigateMonth('prev')} className="p-2">
            <Ionicons name="chevron-back" size={24} color="#4F46E5" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">
            {report.monthYear}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth('next')} className="p-2">
            <Ionicons name="chevron-forward" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>


      {/* --- Summary Cards --- */}
      <View className="px-4 pt-4">
        <View className="flex-row mb-2">
          <SummaryCard
            title="Total Pemasukan"
            amount={report.totalIncome}
            icon={
              <Ionicons name="trending-up" size={20} color="#10B981" />}
            color="green"
          />
          <SummaryCard
            title="Total Pengeluaran"
            amount={report.totalSpending}
            icon={<Ionicons name='trending-down' size={20} color="#EF4444" />}
            color="red"
          />
        </View>
        <SummaryCard
          title="Saldo Bersih Bulan Ini"
          amount={report.netBalance}
          icon={<Ionicons name={report.netBalance >= 0 ? "trending-up" : "trending-down"} size={20} color={report.netBalance >= 0 ? "#10B981" : "#EF4444"} />}
          color={report.netBalance >= 0 ? "green" : "red"}
        />
      </View>

      {/* --- Action Buttons (Quick Entry) --- */}
      {canCreate && (
        <View className="flex-row p-4 pt-2">
          <AppButton
            title="Catat Pemasukan"
            onPress={() => router.push('/dashboard/(secure)/(finance)/create-income')}
            variant="primary"
            className="flex-1 mr-2"
          />
          <AppButton
            title="Catat Pengeluaran"
            onPress={() => router.push('/dashboard/(secure)/(finance)/create-spending')}
            variant="danger"
            className="flex-1 ml-2"
          />
        </View>
      )}

      {/* --- Income Breakdown --- */}
      <View className="p-4 pt-0 bg-white mt-4 mx-4 rounded-xl shadow-sm border border-gray-100">
        <Text className="text-lg font-bold text-gray-800 mb-4 pt-2 border-b border-gray-100 pb-2">
          Rincian Pemasukan
        </Text>
        {Object.keys(report.incomeBySource).length === 0 ? (
          <Text className="text-gray-500 italic">Belum ada data pemasukan.</Text>
        ) : (
          Object.entries(report.incomeBySource).map(([source, amount]) => (
            <BreakdownCard
              key={source}
              label={source}
              amount={amount}
              total={report.totalIncome}
              color="green"
            />
          ))
        )}
      </View>

      {/* --- Spending Breakdown --- */}
      <View className="p-4 pt-0 bg-white mt-4 mx-4 rounded-xl shadow-sm border border-gray-100 mb-8">
        <Text className="text-lg font-bold text-gray-800 mb-4 pt-2 border-b border-gray-100 pb-2">
          Rincian Pengeluaran
        </Text>
        {Object.keys(report.spendingByType).length === 0 ? (
          <Text className="text-gray-500 italic">Belum ada data pengeluaran.</Text>
        ) : (
          Object.entries(report.spendingByType).map(([typeId, amount]) => (
            <BreakdownCard
              key={typeId}
              label={getSpendingTypeLabel(typeId)}
              amount={amount}
              total={report.totalSpending}
              color="red"
            />
          ))
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}