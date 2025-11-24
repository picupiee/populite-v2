import { addMonths, subMonths } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Hooks & Types
import { FINANCE_INCOME_SOURCES, FINANCE_SPENDING_TYPES } from '@/constants/finance';
import { useAccess } from '@/hooks/useAccess';
import { useMonthlyFinanceReport } from '@/hooks/useMonthlyFinanceReport';

// UI Components
import AppButton from '@/components/ui/AppButton';
import { generateFinanceReportHtml } from '@/utils/financePdf';
import Ionicons from '@expo/vector-icons/Ionicons';

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

// --- REPORT SCREEN COMPONENTS ---

// 1. Monthly Summary Card
const SummaryCard: React.FC<{ 
  title: string; 
  amount: number; 
  icon: React.ReactNode; 
  color: string;
  delay?: number;
}> = ({ title, amount, icon, color, delay = 0 }) => (
  <Animated.View 
    entering={FadeInDown.delay(delay).duration(600).springify()}
    style={{ flex: 1 }}
  >
    <View className={`flex-1 p-5 rounded-2xl shadow-lg m-1 bg-white border border-${color}-100`}>
      <View className="flex-row items-center justify-between mb-3">
        <View className={`p-2 rounded-full bg-${color}-50`}>
          {icon}
        </View>
      </View>
      <Text className="text-xs font-semibold uppercase text-gray-500 mb-1">{title}</Text>
      <Text className={`text-lg font-bold text-gray-900`}>
        {formatRupiah(amount)}
      </Text>
    </View>
  </Animated.View>
);

// 2. Breakdown Card (Similar to StatusCard in Population Summary)
const BreakdownCard = ({
  label,
  note,
  amount,
  total,
  color,
  delay = 0,
}: {
  label: string;
  note?: string;
  amount: number;
  total: number;
  color: string;
  delay?: number;
}) => {
  const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : "0.0";
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(600).springify()}
    >
      <View className="flex-row justify-between items-center py-3 border-b border-gray-50 last:border-0">
        <View className="flex-row items-center flex-1 mr-4">
          <View
            className={`w-3 h-3 rounded-full ${color === "green" ? "bg-emerald-500" : "bg-rose-500"}`}
          />
          <View className="flex-col ml-3 flex-1">
            <Text className="text-base text-gray-800 font-medium">{label}</Text>
            {note && (
              <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
                {note}
              </Text>
            )}
          </View>
        </View>
        <View className="items-end">
          <Text className={`text-base font-bold ${color === "green" ? "text-emerald-600" : "text-rose-600"}`}>
            {formatRupiah(amount)}
          </Text>
          <Text className="text-xs text-gray-400 font-medium">{percentage}%</Text>
        </View>
      </View>
    </Animated.View>
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

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPdf = async () => {
    if (!report) return;

    setIsExporting(true);
    try {
      const html = generateFinanceReportHtml(report);

      if (Platform.OS === "web") {
        const iframe = document.createElement('iframe');
        iframe.style.height = '0';
        iframe.style.visibility = 'hidden';
        iframe.style.width = '0';
        iframe.style.position = 'absolute';
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
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
        });
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Laporan Keuangan - ${report.monthYear}`,
        });
      }
    } catch (error: any) {
      Alert.alert("Gagal Ekspor", `Terjadi kesalahan: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle data loading state
  if (loading && !report) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-500 font-medium">Memuat Data Keuangan...</Text>
      </View>
    );
  }

  // Handle error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-10 bg-white">
        <Ionicons name="warning-outline" size={60} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4 text-center">Kesalahan Data</Text>
        <Text className="text-center text-gray-500 mt-2 mb-6">{error.message}</Text>
        <AppButton title="Muat Ulang" onPress={() => setCurrentDate(new Date())} variant="primary" />
      </View>
    );
  }

  // Check if the report is null
  if (!report) {
    return (
      <View className="flex-1 justify-center items-center p-10 bg-white">
        <Ionicons name="document-text-outline" size={60} color="#9CA3AF" />
        <Text className="text-xl font-bold text-gray-800 mt-4">Tidak Ada Data</Text>
        <Text className="text-center text-gray-500 mt-2 mb-6">Tidak ada data transaksi yang ditemukan untuk bulan ini.</Text>
        {canCreate && (
          <AppButton title="Catat Transaksi Baru" onPress={() => router.push('/dashboard/(secure)/(finance)/create-income')} variant="primary" />
        )}
      </View>
    );
  }

  // --- MAIN RENDER ---
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => setCurrentDate(new Date(currentDate.getTime()))}
            tintColor="#4F46E5"
          />
        }
      >
        {/* --- Header & Month Navigation --- */}
        <LinearGradient
            colors={["#4F46E5", "#b5bdffff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="pt-12 pb-16 px-6 rounded-b-[40px] shadow-xl shadow-indigo-200"
          >
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <Text className="text-indigo-100 font-medium text-lg">Laporan Keuangan</Text>
                <Text className="text-3xl font-extrabold text-white mt-1">
                   Kas RT
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleExportPdf}
                disabled={isExporting}
                className="bg-white/20 p-2 rounded-full backdrop-blur-md"
              >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="print-outline" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Month Navigator */}
            <View className="bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/10 flex-row items-center justify-between">
               <TouchableOpacity onPress={() => navigateMonth('prev')} className="p-2 bg-white/10 rounded-xl">
                 <Ionicons name="chevron-back" size={20} color="#fff" />
               </TouchableOpacity>
               <Text className="text-white font-bold text-lg">
                 {report.monthYear}
               </Text>
               <TouchableOpacity onPress={() => navigateMonth('next')} className="p-2 bg-white/10 rounded-xl">
                 <Ionicons name="chevron-forward" size={20} color="#fff" />
               </TouchableOpacity>
            </View>
        </LinearGradient>

        <View className="px-6 -mt-10">
          {/* --- Net Balance Card --- */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(600).springify()}
          >
            <View className="bg-white p-6 rounded-3xl shadow-lg shadow-indigo-100 mb-6">
               <Text className="text-sm font-medium text-gray-500 mb-1 text-center uppercase tracking-wider">Saldo Bersih Bulan Ini</Text>
               <Text className={`text-3xl font-extrabold text-center ${report.netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatRupiah(report.netBalance)}
               </Text>
            </View>
          </Animated.View>

          {/* --- Summary Cards --- */}
          <View className="flex-row gap-4 mb-6">
            <SummaryCard
              title="Pemasukan"
              amount={report.totalIncome}
              icon={<Ionicons name="arrow-up" size={20} color="#10B981" />}
              color="emerald"
              delay={200}
            />
            <SummaryCard
              title="Pengeluaran"
              amount={report.totalSpending}
              icon={<Ionicons name='arrow-down' size={20} color="#F43F5E" />}
              color="rose"
              delay={300}
            />
          </View>

          {/* --- Action Buttons --- */}
          {canCreate && (
            <Animated.View 
              entering={FadeInDown.delay(400).duration(600).springify()}
            >
              <View className="flex-row mb-8">
                <AppButton
                  title="Pemasukan"
                  onPress={() => router.push('/dashboard/(secure)/(finance)/create-income')}
                  variant="primary"
                  className="flex-1 mr-2 shadow-indigo-200"
                  // icon={<Ionicons name="add-circle" size={18} color="white" />} // Assuming AppButton supports icon or we just use text
                />
                <AppButton
                  title="Pengeluaran"
                  onPress={() => router.push('/dashboard/(secure)/(finance)/create-spending')}
                  variant="danger"
                  className="flex-1 ml-2 shadow-rose-200"
                />
              </View>
            </Animated.View>
          )}

          {/* --- Income Breakdown --- */}
          <View className="bg-white p-6 rounded-3xl shadow-sm shadow-gray-200 mb-6">
            <View className="flex-row items-center mb-4 border-b border-gray-100 pb-2">
               <View className="bg-emerald-100 p-1.5 rounded-lg mr-3">
                  <Ionicons name="wallet-outline" size={18} color="#10B981" />
               </View>
               <Text className="text-lg font-bold text-gray-800">Rincian Pemasukan</Text>
            </View>
            
            {report.allIncomes.length === 0 ? (
              <Text className="text-gray-400 italic text-center py-4">Belum ada data pemasukan.</Text>
            ) : (
              report.allIncomes.map((record, index) => {
                const details = FINANCE_INCOME_SOURCES.find(s => s.id === record.source);
                const label = details?.label || record.source;
                return (
                  <BreakdownCard
                    key={record.id}
                    label={label}
                    note={record.note}
                    amount={record.amount}
                    total={report.totalIncome}
                    color="green"
                    delay={500 + (index * 100)}
                  />
                );
              })
            )}
          </View>

          {/* --- Spending Breakdown --- */}
          <View className="bg-white p-6 rounded-3xl shadow-sm shadow-gray-200 mb-8">
             <View className="flex-row items-center mb-4 border-b border-gray-100 pb-2">
               <View className="bg-rose-100 p-1.5 rounded-lg mr-3">
                  <Ionicons name="cart-outline" size={18} color="#F43F5E" />
               </View>
               <Text className="text-lg font-bold text-gray-800">Rincian Pengeluaran</Text>
            </View>

            {report.allSpendings.length === 0 ? (
              <Text className="text-gray-400 italic text-center py-4">Belum ada data pengeluaran.</Text>
            ) : (
              report.allSpendings.map((record, index) => {
                const details = FINANCE_SPENDING_TYPES.find(s => s.id === record.type);
                const label = details?.label || record.type;
                return (
                  <BreakdownCard
                    key={record.id}
                    label={label}
                    note={record.note}
                    amount={record.amount}
                    total={report.totalSpending}
                    color="red"
                    delay={600 + (index * 100)}
                  />
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}