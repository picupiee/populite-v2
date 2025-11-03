import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

// Data and Hooks
import { PopulationRecord } from "@/constants/data";
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
      //   summary.totalPopulation +=
      //     (record.adultTotal || 0) + (record.kidsTotal || 0);
      const adults = Number(record.adultTotal) || 0;
      const kids = Number(record.kidsTotal) || 0;
      summary.adultTotal += adults;
      summary.kidsTotal += kids;

      summary.totalPopulation += adults + kids;
    }
  });

  return summary;
};

// --- Helper Components for Rendering (omitted for brevity, assume they are included) ---

const Card = ({
  title,
  value,
  icon,
  color,
  iconColor,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
  iconColor: string;
}) => (
  // ... (Card component implementation)
  <View
    className={`flex-row items-center p-4 mb-4 rounded-xl justify-between ${color}`}
  >
    <View className="flex-row items-center gap-2">
      <Ionicons name={icon as any} size={30} color={iconColor} />
      <Text
        className={`text-sm font-medium ${iconColor === "#fff" ? "text-white" : "text-gray-200"}`}
      >
        {title}
      </Text>
    </View>
    <Text className="text-3xl font-bold text-white mr-2">{value}</Text>
  </View>
);

const StatusCard = ({
  status,
  count,
  total,
  color,
}: {
  status: string;
  count: number;
  total: number;
  color: string;
}) => {
  // ... (StatusCard component implementation)
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
  return (
    <View className="flex-row justify-between items-center py-1 border-b border-gray-100">
      <View className="flex-row items-center">
        <View
          className={`w-3 h-3 rounded-full ${status === "Kosong" ? "bg-red-500" : status === "Sewa" ? "bg-yellow-500" : "bg-green-500"}`}
        />
        <Text className="ml-3 text-md text-gray-700">{status}</Text>
      </View>
      <View className="items-end">
        <Text className={`text-lg font-semibold ${color}`}>{count}</Text>
        <Text className="text-xs text-gray-500">{percentage}%</Text>
      </View>
    </View>
  );
};

// --- Main Component ---

export default function SummaryScreen() {
  // 1. Get stable real-time data
  const { records, loading, error } = usePopulationRecordsListener();
  const { showErrorToast } = useToastService();

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
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600">Generating Summary...</Text>
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View className="flex-1 items-center justify-center p-10">
        <Ionicons name="warning-outline" size={60} color="#EF4444" />
        <Text className="text-xl font-bold text-red-500 mt-4">
          Failed to Load Summary
        </Text>
        <Pressable
          onPress={handleRefresh}
          className="mt-4 p-2 bg-gray-100 rounded"
        >
          <Text className="text-indigo-600 font-semibold">Try Refreshing</Text>
        </Pressable>
      </View>
    );
  }

  // --- Render Summary ---
  return (
    <View className="flex-1 bg-white">
      {/* <Stack.Screen options={{ title: "Population Summary" }} /> */}

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-gray-800">
          Ringkasan Data Hunian Warga
        </Text>
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          Rukun Tetangga 003
        </Text>

        {/* Key Metrics */}
        <Card
          title="Jumlah Populasi"
          value={summary.totalPopulation.toLocaleString()}
          icon="people-circle-outline"
          color="bg-indigo-600"
          iconColor="#fff"
        />
        <View className="flex-1">
          <View className="flex-row justify-evenly gap-2">
            <Card
              title="Dewasa  "
              value={summary.adultTotal}
              color="bg-gray-600"
              iconColor="#fff"
            />
            <Card
              title="Anak-anak  "
              value={summary.kidsTotal}
              color="bg-orange-600"
              iconColor="#fff"
            />
          </View>
        </View>

        <Card
          title="Jumlah Rumah Terdata"
          value={summary.totalRecords.toLocaleString()}
          icon="home-outline"
          color="bg-green-600"
          iconColor="#fff"
        />

        <Text className="text-md font-bold text-gray-800 mt-8 mb-4">
          Jumlah Rumah Berdasarkan Status Hunian
        </Text>

        {/* Status Breakdown */}
        <StatusCard
          status="Ditempati"
          count={summary.statusCounts["Ditempati"]}
          total={summary.totalRecords}
          color="text-green-600"
        />
        <StatusCard
          status="Sewa"
          count={summary.statusCounts["Sewa"]}
          total={summary.totalRecords}
          color="text-yellow-600"
        />
        <StatusCard
          status="Kosong"
          count={summary.statusCounts["Kosong"]}
          total={summary.totalRecords}
          color="text-red-600"
        />

        {/* Refresh button is now just for visual feedback, as data is real-time */}
        <Pressable
          onPress={handleRefresh}
          className="mt-8 p-3 bg-gray-100 rounded-lg active:bg-gray-200"
        >
          <Text className="text-indigo-600 text-center font-semibold">
            <Ionicons name="refresh-outline" size={16} color="#4F46E5" />{" "}
            {isRefreshing ? "Mohon Tunggu..." : "Cek Data Terbaru"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
