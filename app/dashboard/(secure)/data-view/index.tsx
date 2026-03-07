// app/dashboard/(secure)/data-view/index.tsx
import CompactListItem from "@/components/data/CompactListItem";
import RecordPrintListModal from "@/components/print/RecordPrintListModal";
import SelectGroup from "@/components/ui/SelectGroup";
import {
  GENDER_OPTIONS,
  PopulationRecord,
  STREET_OPTIONS,
} from "@/constants/data";
import { useAuth } from "@/context/AuthProvider";
import { usePopulationRecordsListener } from "@/hooks/usePopulationRecordsListener";
import { generateRecordsReportHtml, PrintOptions } from "@/utils/recordsPdf";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Print from "expo-print";
import { Link, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import MonthlyReportModal from "@/components/print/MonthlyReportModal";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

// Type Definitions for Filter and Sort
export type HouseStatusFilter = "Semua" | "Ditempati" | "Sewa" | "Kosong";
export type StreetFilter =
  | "Semua"
  | "Pinus 1"
  | "Pinus 2"
  | "Edelweis"
  | "Mawar";
export type GenderFilter = "Semua" | "Pria" | "Wanita";

export type SortKey = "houseId" | "entryDate" | "dateOccupied";
export type SortDirection = "asc" | "desc";

interface FilterState {
  street: StreetFilter;
  status: HouseStatusFilter;
  gender: GenderFilter;
}

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

// Component to display a single record item
const RecordItem = ({ record }: { record: PopulationRecord }) => {
  const router = useRouter();
  const entryDate = record.entryDate.toLocaleDateString();
  const houseStatusColor =
    record.houseStatus === "Kosong"
      ? "bg-red-100"
      : record.houseStatus === "Sewa"
        ? "bg-yellow-100"
        : "bg-green-100";

  return (
    <Pressable
      className={`p-4 mb-3 rounded-xl border border-gray-200 ${houseStatusColor} active:opacity-75`}
      onPress={() =>
        router.push(`/dashboard/(secure)/data-view/data/${record.id}`)
      }
    >
      <View className="flex-row justify-between items-center">
        {/* Left Side: Details */}
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">
            {record.name} - {record.houseId} - {record.street}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            Status Hunian: {record.houseStatus} | Domisili: {record.domicile}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            Adults: {record.adultTotal} | Kids: {record.kidsTotal}
          </Text>
        </View>

        {/* Right Side: Actions/Info */}
        <View className="flex-col items-end">
          <Ionicons name="chevron-forward-outline" size={24} color="#4F46E5" />
          {/* <Text className="text-xs text-gray-500 mt-1">
              Entry: {entryDate}
            </Text> */}
        </View>
      </View>
      <Text className="text-xs text-gray-500 absolute right-2 bottom-2 underline underline-offset-4">
        Didata Pada: {entryDate}
      </Text>
    </Pressable>
  );
};

export default function DataViewListScreen() {
  const { records, loading, error } = usePopulationRecordsListener();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    street: "Semua",
    status: "Semua",
    gender: "Semua",
  });
  const [sort, setSort] = useState<SortState>({
    key: "entryDate",
    direction: "asc",
  });
  const HOUSE_STATUS_OPTIONS = ["Semua", "Ditempati", "Sewa", "Kosong"];
  const STREET_FILTER_OPTIONS = ["Semua", ...STREET_OPTIONS];
  const GENDER_FILTER_OPTIONS = ["Semua", ...GENDER_OPTIONS];

  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [isMonthlyModalVisible, setIsMonthlyModalVisible] = useState(false);
  const { userProfile, user } = useAuth();

  const handlePrintPdf = async (options: PrintOptions) => {
    setIsPrintModalVisible(false);
    try {
      const username =
        userProfile?.fullName || userProfile?.username || "Admin";
      // Use 'records' from the hook which contains ALL currently loaded records.
      // The utility function handles filtering based on options.
      const html = generateRecordsReportHtml(records || [], options, username);
      const { printHtmlReport } = await import("@/utils/recordsPdf");
      await printHtmlReport(html, "Laporan Data Warga");
    } catch (error) {
      console.error("Print Error:", error);
    }
  };

  const handleGenerateMonthlyReport = async (revisionNumber?: string) => {
    setIsMonthlyModalVisible(false);
    try {
      const username =
        userProfile?.fullName || userProfile?.username || "Admin";

      // 1. Calculate Exact Stats for Firestore Metrics
      const allRecords = records || [];
      const stats = allRecords.reduce(
        (acc, r) => {
          acc.adultMale += r.adultMale || 0;
          acc.adultFemale += r.adultFemale || 0;
          acc.kidsMale += r.kidsMale || 0;
          acc.kidsFemale += r.kidsFemale || 0;
          
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
      const totalHouses = allRecords.length;

      // 2. Save metadata to Firestore
      const now = new Date();
      await addDoc(collection(db, "monthly_reports"), {
        createdAt: serverTimestamp(),
        generatedBy: user?.uid || "unknown",
        generatedByName: username,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        revisionNumber: revisionNumber || null,
        totalPopulation,
        totalAdults,
        totalKids,
        totalMale,
        totalFemale,
        totalHouses,
        housesOccupied: stats.housesOccupied,
        housesRented: stats.housesRented,
        housesEmpty: stats.housesEmpty,
        streetsCovered: ["Semua"]
      });

      // 3. Generate HTML & Print
      const options: PrintOptions = {
         street: ["Semua"],
         populationFilter: "all",
         reportType: "summary",
         hideNames: false,
         isMonthly: true,
         revisionNumber,
      };

      const html = generateRecordsReportHtml(allRecords, options, username);
      const { printHtmlReport } = await import("@/utils/recordsPdf");
      
      const monthYearStr = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      let title = `Laporan Bulanan Warga - ${monthYearStr}`;
      if (revisionNumber && revisionNumber.trim() !== "") {
        title += ` (Revisi ${revisionNumber.trim()})`;
      }

      await printHtmlReport(html, title);
    } catch (error) {
       console.error("Monthly Print Error:", error);
       alert("Gagal membuat laporan bulanan.");
    }
  };

  // Use useFocusEffect to reload data whenever the screen becomes focused (e.g., after saving a new record)

  const sortedAndFilterRecords = React.useMemo(() => {
    if (!records) return [];
    let results = [...records];

    // A. Filtering
    // 1. Filter by Street
    if (filters.street !== "Semua") {
      results = results.filter((record) => record.street === filters.street);
    }
    // 2. Filter by Status
    if (filters.status !== "Semua") {
      results = results.filter(
        (record) => record.houseStatus === filters.status
      );
    }

    // 3. Filter by Gender
    if (filters.gender !== "Semua") {
      results = results.filter((record) => record.gender === filters.gender);
    }

    // B. Sorting
    const compare = (
      a: PopulationRecord,
      b: PopulationRecord,
      key: SortKey
    ) => {
      const typedKey = key as keyof PopulationRecord;
      let aVal: any = a[typedKey];
      let bVal: any = b[typedKey];

      if (key === "entryDate" || key === "dateOccupied") {
        aVal = aVal instanceof Date ? aVal.getTime() : 0;
        bVal = bVal instanceof Date ? bVal.getTime() : 0;
      }

      if (key === "houseId") {
        const getSuffixNumber = (id: string) => {
          const match = id.match(/\/(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        };
        aVal = getSuffixNumber(a.houseId || "");
        bVal = getSuffixNumber(b.houseId || "");
      }
      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "desc" ? 1 : -1;
      return 0;
    };
    results.sort((a, b) => compare(a, b, sort.key));
    return results;
  }, [records, filters, sort]);

  const activeFilters = React.useMemo(() => {
    const filtersArray = [];

    if (filters.street !== "Semua") {
      filtersArray.push(`Jalan: ${filters.street}`);
    }
    if (filters.status !== "Semua") {
      filtersArray.push(`Status: ${filters.status}`);
    }
    // Only include Gender filter if it's not 'Semua' and we are in 'list' view mode
    // (Gender filtering typically only makes sense when listing individuals, though we include it here)
    if (filters.gender !== "Semua") {
      filtersArray.push(`Gender: ${filters.gender}`);
    }

    return filtersArray;
  }, [filters]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600">Memuat Data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Text className="italic text-xs font-semibold bg-red-100 p-2 rounded-md text-center">
        Data yang ditampilkan adalah data mockup / tidak asli. Mohon untuk tidak
        menggunakan data asli sebelum proyek ini sudah dalam status
        "In-Production"
      </Text>
      <View className="p-4 bg-white border-b border-gray-100">
        {/* --- Top Row: Title and Actions (Add Button, View Switcher, Filter Toggle) --- */}
        <View className="flex-row justify-between items-center mb-4">
          {/* Left Side: Title & Add Button */}
          <Link href="/dashboard/(secure)/data-entry" asChild>
            <Pressable className="flex-row items-center justify-center p-3 bg-indigo-600 rounded-lg active:opacity-80">
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text className="text-white font-semibold ml-2">
                Warga / Hunian Baru
              </Text>
            </Pressable>
          </Link>

          {/* Right Side: View Switcher, Filter Toggle Group, and PRINT Button */}
          <View className="flex-row items-center gap-2">
            {/* Monthly Report Button */}
            <Pressable
              onPress={() => setIsMonthlyModalVisible(true)}
              className="px-3 py-2 flex-row items-center bg-purple-50 border border-purple-200 rounded-lg active:opacity-80"
            >
              <Ionicons name="document-text-outline" size={18} color="#7E22CE" />
              <Text className="ml-1 text-xs font-semibold text-purple-700 hidden sm:flex">Laporan Bulanan</Text>
            </Pressable>

            {/* Print Button */}
            <Pressable
              onPress={() => setIsPrintModalVisible(true)}
              className="p-2 border border-blue-200 bg-blue-50 rounded-lg active:opacity-80"
            >
              <Ionicons name="print-outline" size={20} color="#2563EB" />
            </Pressable>

            {/* View Switcher */}
            <View className="flex-row border border-gray-300 rounded-lg overflow-hidden">
              <Pressable
                onPress={() => setViewMode("list")}
                className={`p-2 border-r border-gray-300 ${viewMode === "list" ? "bg-indigo-600" : "bg-white"}`}
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={viewMode === "list" ? "#fff" : "#4F46E5"}
                />
              </Pressable>
              <Pressable
                onPress={() => setViewMode("card")}
                className={`p-2 ${viewMode === "card" ? "bg-indigo-600" : "bg-white"}`}
              >
                <Ionicons
                  name="apps-outline"
                  size={20}
                  color={viewMode === "card" ? "#fff" : "#4F46E5"}
                />
              </Pressable>
            </View>

            {/* Filter/Sort Toggle Button */}
            <Pressable
              onPress={() => setIsControlsVisible(!isControlsVisible)}
              className={`p-2 border-l rounded-lg border flex-row items-center ${isControlsVisible ? "bg-indigo-600 border-indigo-700" : "bg-gray-100 border-gray-300"}`}
            >
              <Ionicons
                name={isControlsVisible ? "close-outline" : "filter-outline"}
                size={20}
                color={isControlsVisible ? "#fff" : "#4F46E5"}
              />
            </Pressable>
          </View>
        </View>

        {/* Print Modal */}
        <RecordPrintListModal
          visible={isPrintModalVisible}
          onClose={() => setIsPrintModalVisible(false)}
          onPrint={handlePrintPdf}
        />

        {/* Monthly Report Modal */}
        <MonthlyReportModal
          visible={isMonthlyModalVisible}
          onClose={() => setIsMonthlyModalVisible(false)}
          onConfirm={handleGenerateMonthlyReport}
        />

        {/* --- Collapsible Filter/Sort Panel --- */}
        {isControlsVisible && (
          <View className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            {/* Filter Row */}
            <View className="flex-row gap-4 mb-4">
              {/* Filter 1: Street */}
              <SelectGroup
                label="Filter Jalan"
                options={STREET_FILTER_OPTIONS}
                selectedValue={filters.street}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    street: value as StreetFilter,
                  }))
                }
                horizontal={false}
                className="flex-1"
              />

              {/* Filter 2: Status */}
              <SelectGroup
                label="Filter Status"
                options={HOUSE_STATUS_OPTIONS}
                selectedValue={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: value as HouseStatusFilter,
                  }))
                }
                horizontal={false}
                className="flex-1"
              />
              <SelectGroup
                label="Jenis Kelamin"
                options={GENDER_FILTER_OPTIONS}
                selectedValue={filters.gender}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    gender: value as GenderFilter,
                  }))
                }
                horizontal={true}
                className="flex-1"
              />
            </View>

            {/* Sort Controls */}
            <Text className="text-sm font-medium mb-2 text-gray-700">
              Sort By
            </Text>
            <View className="flex-row gap-3">
              {/* Sort Button 1: House ID */}
              <Pressable
                onPress={() =>
                  setSort((prev) => ({
                    key: "houseId",
                    direction:
                      prev.key === "houseId" && prev.direction === "asc"
                        ? "desc"
                        : "asc",
                  }))
                }
                className={`p-2 rounded-lg border flex-row items-center ${sort.key === "houseId" ? "bg-indigo-600 border-indigo-700" : "bg-white border-gray-300"}`}
              >
                <Text
                  className={`font-semibold text-sm mr-1 ${sort.key === "houseId" ? "text-white" : "text-gray-700"}`}
                >
                  ID{" "}
                  {sort.key === "houseId" &&
                    (sort.direction === "asc" ? " (↑)" : " (↓)")}
                </Text>
              </Pressable>

              {/* Sort Button 2: Entry Date */}
              <Pressable
                onPress={() =>
                  setSort((prev) => ({
                    key: "entryDate",
                    direction:
                      prev.key === "entryDate" && prev.direction === "desc"
                        ? "asc"
                        : "desc",
                  }))
                }
                className={`p-2 rounded-lg border flex-row items-center ${sort.key === "entryDate" ? "bg-indigo-600 border-indigo-700" : "bg-white border-gray-300"}`}
              >
                <Text
                  className={`font-semibold text-sm mr-1 ${sort.key === "entryDate" ? "text-white" : "text-gray-700"}`}
                >
                  Entry Date{" "}
                  {sort.key === "entryDate" &&
                    (sort.direction === "asc" ? " (↑)" : " (↓)")}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        <View>
          {activeFilters.length > 0 && (
            <View className="px-4 bg-white border-b border-gray-100">
              <View className="flex-row items-center flex-wrap">
                <Text className="text-sm text-gray-700 font-semibold mr-3">
                  Filter Aktif :
                </Text>
                {activeFilters.map((filter, index) => (
                  <View
                    key={index}
                    className="flex-row items-center bg-indigo-100 px-3 py-1 mr-2 mb-1 rounded-full border border-indigo-200"
                  >
                    <Text className="text-xs font-medium text-indigo-700">
                      {filter}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-2 text-gray-600">Loading data...</Text>
        </View>
      ) : records && records.length === 0 ? (
        <View className="flex-1 items-center justify-center p-10">
          <Ionicons name="documents-outline" size={60} color="#9CA3AF" />
          <Text className="text-xl font-semibold text-gray-500 mt-4">
            Data Hunian Masih Kosong
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Mulai pendataan warga / hunian dengan mengklik tombol{" "}
            <strong>+ Warga / Hunian Baru</strong> diatas.
          </Text>
        </View>
      ) : sortedAndFilterRecords.length === 0 ? (
        <View className="flex-1 items-center justify-center p-10">
          <Ionicons name="search-outline" size={60} color="#9CA3AF" />
          <Text className="text-xl font-semibold text-gray-500 mt-4">
            Data Tidak Ditemukan !
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Coba lagi dengan pilihan filter yang lain.
          </Text>
        </View>
      ) : (
        <FlatList
          // 💡 Use the sorted and filtered array!
          data={sortedAndFilterRecords}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            viewMode === "card" ? (
              <RecordItem record={item} /> // Existing, verbose card view
            ) : (
              <CompactListItem record={item} /> // New, compact list view
            )
          }
          contentContainerStyle={{
            paddingHorizontal: viewMode === "card" ? 10 : 10,
            paddingBottom: 20,
          }}
        />
      )}
    </View>
  );
}
