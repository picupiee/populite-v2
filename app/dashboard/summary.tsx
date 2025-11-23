import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// Data and Hooks
import { PopulationRecord } from "@/constants/data";
import { useAuth } from "@/context/AuthProvider";
import { usePopulationRecordsListener } from "@/hooks/usePopulationRecordsListener"; // Stable List Listener
import { useToastService } from "@/hooks/useToastService";

// --- Interfaces and Calculation Logic ---

interface SummaryData {
  totalRecords: number;
  totalPopulation: number;
  statusCounts: { [key: string]: number };
  adultTotal: number;
  kidsTotal: number;
}

/**
 * Calculates key metrics from the full list of population records.
 */
const calculateSummary = (records: PopulationRecord[]): SummaryData => {
  const summary: SummaryData = {
    totalRecords: records.length,
    totalPopulation: 0,
    statusCounts: { Ditempati: 0, Sewa: 0, Kosong: 0 },
    adultTotal: 0,
    kidsTotal: 0,
  };

  records.forEach((record) => {
    const status = record.houseStatus;

    // Count by Status
    if (status in summary.statusCounts) {
      summary.statusCounts[status] = (summary.statusCounts[status] || 0) + 1;
    }

    // Calculate Total Population (only if occupied)
    if (status === "Ditempati" || status === "Sewa") {
      const adults = Number(record.adultTotal) || 0;
      const kids = Number(record.kidsTotal) || 0;
      summary.adultTotal += adults;
      summary.kidsTotal += kids;

      summary.totalPopulation += adults + kids;
    }
  });

  return summary;
};

// --- Helper Components for Rendering ---

const Card = ({
  title,
  value,
  icon,
  color,
  iconColor,
  delay = 0,
}: {
  title: string;
  value: string;
  icon: string;
  color: string; // Tailwind bg class
  iconColor: string;
  delay?: number;
}) => (
  <Animated.View 
    entering={FadeInDown.delay(delay).duration(600).springify()}
    style={{ width: '100%' }}
  >
    <View className={`flex-row items-center p-5 mb-4 rounded-2xl justify-between shadow-lg shadow-indigo-100 ${color}`}>
      <View className="flex-row items-center gap-3">
        <View className="bg-white/20 p-2 rounded-full">
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
        <Text
          className={`text-sm font-semibold ${iconColor === "#fff" ? "text-white" : "text-gray-700"}`}
        >
          {title}
        </Text>
      </View>
      <Text className={`text-2xl font-bold ${iconColor === "#fff" ? "text-white" : "text-gray-800"}`}>{value}</Text>
    </View>
  </Animated.View>
);

const StatusCard = ({
  status,
  count,
  total,
  color,
  delay = 0,
}: {
  status: string;
  count: number;
  total: number;
  color: string;
  delay?: number;
}) => {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
  return (
    <Animated.View 
      entering={FadeInDown.delay(delay).duration(600).springify()}
      style={{ width: '100%' }}
    >
      <View className="flex-row justify-between items-center py-3 border-b border-gray-50 last:border-0">
        <View className="flex-row items-center">
          <View
            className={`w-3 h-3 rounded-full ${status === "Kosong" ? "bg-red-500" : status === "Sewa" ? "bg-yellow-500" : "bg-green-500"}`}
          />
          <Text className="ml-3 text-base font-medium text-gray-700">{status}</Text>
        </View>
        <View className="items-end">
          <Text className={`text-lg font-bold ${color}`}>{count}</Text>
          <Text className="text-xs text-gray-400 font-medium">{percentage}%</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const QuickAction = ({ 
  title, 
  icon, 
  onPress, 
  color = "bg-indigo-50" 
}: { 
  title: string; 
  icon: string; 
  onPress: () => void; 
  color?: string;
}) => (
  <TouchableOpacity 
    onPress={onPress}
    className="items-center mr-4"
  >
    <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-2 ${color}`}>
      <Ionicons name={icon as any} size={24} color="#4F46E5" />
    </View>
    <Text className="text-xs font-medium text-gray-600 text-center w-16">{title}</Text>
  </TouchableOpacity>
);

// --- Main Component ---

export default function SummaryScreen() {
  // 1. Get stable real-time data
  const { records, loading, error } = usePopulationRecordsListener();
  const { showErrorToast } = useToastService();
  const router = useRouter();
  const {userProfile} = useAuth()

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 2. Calculate summary ONLY when stable 'records' list updates
  useEffect(() => {
    if (!loading && records) {
      const summaryData = calculateSummary(records);
      setSummary(summaryData);
    }

    if (error) {
      console.error("Summary Load Error:", error);
      showErrorToast(
        "Data Error",
        "Failed to load real-time data for summary."
      );
      setSummary(null);
    }
  }, [records, loading, error]);

  // 3. Visual refresh handler (data is updated by the listener automatically)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Wait a short time to show the refresh indicator
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // --- UI Rendering ---
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-500 font-medium">Memuat Data Ringkasan...</Text>
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View className="flex-1 items-center justify-center p-10 bg-white">
        <Ionicons name="warning-outline" size={60} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
          Gagal Memuat Data
        </Text>
        <Text className="text-gray-500 text-center mt-2 mb-6">Terjadi kesalahan saat mengambil data terbaru.</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          className="px-6 py-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"
        >
          <Text className="text-white font-bold">Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Render Summary ---
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#4F46E5" />
        }
      >
        <View className="w-full max-w-4xl">
          {/* Welcome Header */}
          <LinearGradient
            colors={["#4F46E5", "#b5bdffff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="pt-8 pb-12 px-6 rounded-b-[40px] shadow-xl shadow-indigo-200"
          >
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-indigo-100 font-medium text-lg">Selamat Datang,</Text>
                <Text className="text-3xl font-extrabold text-white mt-1">
                  {userProfile?.fullName || 'User'}
                </Text>
              </View>
              <View className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                <Ionicons name="notifications-outline" size={24} color="white" />
              </View>
            </View>
            
            <View className="mt-6 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 flex-row items-center">
              <Ionicons name="location" size={24} color="#fff" />
              <View className="ml-3">
                <Text className="text-white font-bold text-lg">RT 003 / RW 004</Text>
                <Text className="text-indigo-100 text-sm">Puri Harmoni Pasir Mukti</Text>
              </View>
            </View>
          </LinearGradient>

          <View className="px-6 -mt-8">
            {/* Quick Actions */}
            <View className="bg-white p-5 rounded-2xl shadow-sm shadow-gray-200 mb-6">
               <Text className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Akses Cepat</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 px-1">
                  <QuickAction 
                    title="Warga Baru" 
                    icon="person-add" 
                    onPress={() => router.push("/dashboard/(secure)/data-entry")} 
                  />
                  <QuickAction 
                    title="Data Warga" 
                    icon="people" 
                    onPress={() => router.push("/dashboard/(secure)/data-view")} 
                    color="bg-blue-50"
                  />
                  <QuickAction 
                    title="Keuangan" 
                    icon="wallet" 
                    onPress={() => router.push("/dashboard/finance")} 
                    color="bg-green-50"
                  />
                  <QuickAction 
                    title="Kegiatan" 
                    icon="calendar" 
                    onPress={() => router.push("/dashboard/(public)/activities")} 
                    color="bg-orange-50"
                  />
               </ScrollView>
            </View>

            {/* Key Metrics */}
            <Text className="text-lg font-bold text-gray-800 mb-4">Statistik Utama</Text>
            
            <Card
              title="Total Populasi"
              value={summary.totalPopulation.toLocaleString()}
              icon="people"
              color="bg-indigo-600"
              iconColor="#fff"
              delay={100}
            />
            
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Card
                  title="Dewasa"
                  value={summary.adultTotal.toString()}
                  icon="person"
                  color="bg-white"
                  iconColor="#4F46E5"
                  delay={200}
                />
              </View>
              <View className="flex-1">
                <Card
                  title="Anak-anak"
                  value={summary.kidsTotal.toString()}
                  icon="happy"
                  color="bg-white"
                  iconColor="#F59E0B"
                  delay={300}
                />
              </View>
            </View>

            <Card
              title="Total Rumah Terdata"
              value={summary.totalRecords.toLocaleString()}
              icon="home"
              color="bg-emerald-500"
              iconColor="#fff"
              delay={400}
            />

            {/* Status Breakdown */}
            <View className="bg-white p-6 rounded-3xl shadow-sm shadow-gray-200 mt-2 mb-8">
              <Text className="text-lg font-bold text-gray-800 mb-4">Status Hunian</Text>
              <StatusCard
                status="Ditempati"
                count={summary.statusCounts["Ditempati"]}
                total={summary.totalRecords}
                color="text-green-600"
                delay={500}
              />
              <StatusCard
                status="Sewa"
                count={summary.statusCounts["Sewa"]}
                total={summary.totalRecords}
                color="text-yellow-600"
                delay={600}
              />
              <StatusCard
                status="Kosong"
                count={summary.statusCounts["Kosong"]}
                total={summary.totalRecords}
                color="text-red-600"
                delay={700}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
