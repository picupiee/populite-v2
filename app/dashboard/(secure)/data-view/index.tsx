// app/dashboard/(secure)/data-view/index.tsx
import CompactListItem from "@/components/data/CompactListItem";
import MonthlyReportModal from "@/components/print/MonthlyReportModal";
import RecordPrintListModal from "@/components/print/RecordPrintListModal";
import {
  GENDER_OPTIONS,
  PopulationRecord,
  STREET_OPTIONS,
} from "@/constants/data";
import { useAuth } from "@/context/AuthProvider";
import { usePopulationRecordsListener } from "@/hooks/usePopulationRecordsListener";
import { db } from "@/lib/firebase";
import { generateRecordsReportHtml, PrintOptions } from "@/utils/recordsPdf";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Button, Divider, Modal, Portal } from "react-native-paper";

// Type Definitions for Filter and Sort
export type HouseStatusFilter = "Semua" | "Ditempati" | "Sewa" | "Kosong";
export type StreetFilter =
  | "Semua"
  | "Pinus 1"
  | "Pinus 2"
  | "Edelweis"
  | "Mawar";
export type GenderFilter = "Semua" | "Pria" | "Wanita";
export type DomicileFilter = "Semua" | "Gunung Sari" | "Lainnya";

export type SortKey = "houseId" | "entryDate" | "dateOccupied";
export type SortDirection = "asc" | "desc";

interface FilterState {
  street: StreetFilter;
  status: HouseStatusFilter;
  gender: GenderFilter;
  domicile: DomicileFilter;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    street: "Semua",
    status: "Semua",
    gender: "Semua",
    domicile: "Semua"
  });
  const [sort, setSort] = useState<SortState>({
    key: "entryDate",
    direction: "asc",
  });
  const HOUSE_STATUS_OPTIONS = ["Semua", "Ditempati", "Sewa", "Kosong"];
  const STREET_FILTER_OPTIONS = ["Semua", ...STREET_OPTIONS];
  const GENDER_FILTER_OPTIONS = ["Semua", ...GENDER_OPTIONS];
  const DOMICILE_FILTER_OPTIONS = ["Semua", "Gunung Sari", "Lainnya"];

  const [viewMode, setViewMode] = useState<"card" | "list">("list");
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [isMonthlyModalVisible, setIsMonthlyModalVisible] = useState(false);
  const { userProfile, user, role } = useAuth();
  const isAdminOrStaff = role === "admin" || role === "staff";

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
        },
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
        streetsCovered: ["Semua"],
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

      const monthYearStr = now.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
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
    // 0. Search Query
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase().trim();
      const queryParts = lowerQuery.split(/\s+/);

      results = results.filter((record) => {
        const hId = (record.houseId || "").toLowerCase();
        const hPre = (record.housePrefix || "").toLowerCase();
        const hSuf = String(record.houseSuffix || "").toLowerCase();
        const name = record.name.toLowerCase();
        const street = record.street.toLowerCase();
        const status = record.houseStatus.toLowerCase();
        const domicile = record.domicile.toLowerCase();

        // For each part, check if it matches EXACTLY one of the house components, OR is a substring of the text fields
        return queryParts.every((part) => {
          return (
            hId === part ||
            hPre === part ||
            hSuf === part ||
            name.includes(part) ||
            street.includes(part) ||
            status.includes(part) ||
            domicile.includes(part)
          );
        });
      });
    }

    // 1. Filter by Street
    if (filters.street !== "Semua") {
      results = results.filter((record) => record.street === filters.street);
    }
    // 2. Filter by Status
    if (filters.status !== "Semua") {
      results = results.filter(
        (record) => record.houseStatus === filters.status,
      );
    }

    // 3. Filter by Gender
    if (filters.gender !== "Semua") {
      results = results.filter((record) => record.gender === filters.gender);
    }

    // 4. Filter by Domicile
    if (filters.domicile !== "Semua") {
      results = results.filter((record) => record.domicile === filters.domicile);
    }

    // B. Sorting
    const compare = (
      a: PopulationRecord,
      b: PopulationRecord,
      key: SortKey,
    ) => {
      const typedKey = key as keyof PopulationRecord;
      let aVal: any = a[typedKey];
      let bVal: any = b[typedKey];

      if (key === "entryDate" || key === "dateOccupied") {
        aVal = aVal instanceof Date ? aVal.getTime() : 0;
        bVal = bVal instanceof Date ? bVal.getTime() : 0;
      }

      if (key === "houseId") {
        // Parse both prefix number (e.g. "08" from "C08") and suffix number
        // (e.g. "01" from "/01") so sorting is: C08/01 < C08/03 < C09/01
        const parseHouseId = (id: string): [number, number] => {
          const match = id.match(/[A-Za-z](\d+)\/(\d+)/);
          return match
            ? [parseInt(match[1], 10), parseInt(match[2], 10)]
            : [0, 0];
        };
        const [aPre, aSuf] = parseHouseId(a.houseId || "");
        const [bPre, bSuf] = parseHouseId(b.houseId || "");
        // Compare prefix first; use suffix as tiebreaker
        if (aPre !== bPre) {
          return sort.direction === "asc" ? aPre - bPre : bPre - aPre;
        }
        return sort.direction === "asc" ? aSuf - bSuf : bSuf - aSuf;
      }
      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
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

    if (filters.domicile !== "Semua") {
      filtersArray.push(`Domisili: ${filters.domicile}`)
    }

    if (searchQuery.trim() !== "") {
      filtersArray.push(`Pencarian: "${searchQuery}"`);
    }

    return filtersArray;
  }, [filters, searchQuery]);
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
      <View className="p-4 bg-white border-b border-gray-100 drop-shadow-lg">
        {/* --- Top Row: Title and Actions (Add Button, View Switcher, Filter Toggle) --- */}
        <View className="flex-row justify-between items-center mb-4">
          {/* Left Side: Title & Add Button */}
          <Link href="/dashboard/(secure)/data-entry" asChild>
            <Pressable className="flex-row items-center justify-center p-3 bg-indigo-600 rounded-lg active:opacity-80">
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text className="text-white font-semibold ml-2 hidden sm:flex">
                Tambah Warga
              </Text>
            </Pressable>
          </Link>

          {/* Right Side: View Switcher, Filter Toggle Group, and PRINT Button */}
          <View className="flex-row items-center gap-2">
            {/* Monthly Report Button */}
            {isAdminOrStaff && (
              <>
                <Pressable
                  onPress={() => setIsPrintModalVisible(true)}
                  className="px-3 py-2 flex-row items-center bg-green-50 border border-green-200 rounded-lg active:opacity-80"
                >
                  <Ionicons
                    name="list-outline"
                    size={18}
                    color="#22C55E"
                  />
                  <Text className="ml-1 text-xs font-semibold text-green-700 hidden sm:flex">
                    Cetak Daftar Warga
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setIsMonthlyModalVisible(true)}
                  className="px-3 py-2 flex-row items-center bg-blue-50 border border-blue-200 rounded-lg active:opacity-80"
                >
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#60A5FA"
                  />
                  <Text className="ml-1 text-xs font-semibold text-blue-700 hidden sm:flex">
                    Laporan Bulanan
                  </Text>
                </Pressable>
              </>
            )}

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

            {/* Filter/Sort Button */}
            <Pressable
              onPress={() => setIsControlsVisible(true)}
              className={`p-2 border rounded-lg flex-row items-center ${activeFilters.length > 0 ? "bg-indigo-600 border-indigo-700" : "bg-gray-100 border-gray-300"}`}
            >
              <Ionicons
                name="filter-outline"
                size={20}
                color={activeFilters.length > 0 ? "#fff" : "#4F46E5"}
              />
              {activeFilters.length > 0 && (
                <View className="ml-1 bg-white rounded-full px-1.5 py-0.5">
                  <Text className="text-[10px] font-bold text-indigo-600">
                    {activeFilters.length}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Print Modal */}
        <RecordPrintListModal
          visible={isPrintModalVisible}
          onClose={() => setIsPrintModalVisible(false)}
          onPrint={handlePrintPdf}
        />
        <MonthlyReportModal
          visible={isMonthlyModalVisible}
          onClose={() => setIsMonthlyModalVisible(false)}
          onConfirm={handleGenerateMonthlyReport}
        />

        {/* --- Native Filter & Sort Modal (React Native Paper) --- */}
        <Portal>
          <Modal
            visible={isControlsVisible}
            onDismiss={() => setIsControlsVisible(false)}
            contentContainerStyle={{
              backgroundColor: "white",
              marginHorizontal: 20,
              borderRadius: 16,
              maxHeight: "85%",
              overflow: "hidden",
            }}
          >
            <View className="p-2 border-b border-gray-200 flex-row justify-between items-center">
              <View className="flex-row">
                <Text className="text-lg font-bold text-gray-800 ml-2">
                  Filter & Urutkan Data
                </Text>
              </View>
              <Pressable
                onPress={() => setIsControlsVisible(false)}
                className="p-1 rounded-full active:bg-gray-100"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              {/* Filter 1: Jalan */}
              <Text className="text-sm font-bold text-gray-700 mb-2">
                Pilih Jalan
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {STREET_FILTER_OPTIONS.map((opt) => {
                  const isSelected = filters.street === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          street: opt as StreetFilter,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full border ${isSelected ? "bg-indigo-600 border-indigo-600" : "bg-gray-100 border-gray-200"}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${isSelected ? "text-white" : "text-gray-700"}`}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Divider className="my-3" />

              {/* Filter 2: Status Hunian */}
              <Text className="text-sm font-bold text-gray-700 mb-2">
                Status Hunian
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {HOUSE_STATUS_OPTIONS.map((opt) => {
                  const isSelected = filters.status === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          status: opt as HouseStatusFilter,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full border ${isSelected ? "bg-indigo-600 border-indigo-600" : "bg-gray-100 border-gray-200"}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${isSelected ? "text-white" : "text-gray-700"}`}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Divider className="my-3" />

              {/* Filter 3: Jenis Kelamin */}
              <Text className="text-sm font-bold text-gray-700 mb-2">
                Jenis Kelamin
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {GENDER_FILTER_OPTIONS.map((opt) => {
                  const isSelected = filters.gender === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          gender: opt as GenderFilter,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full border ${isSelected ? "bg-indigo-600 border-indigo-600" : "bg-gray-100 border-gray-200"}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${isSelected ? "text-white" : "text-gray-700"}`}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Divider className="my-3" />

              {/* Filter 4: Domicile */}
              <Text className="text-sm font-bold text-gray-700 mb-2">
                Domisili
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {DOMICILE_FILTER_OPTIONS.map((opt) => {
                  const isSelected = filters.domicile === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() =>
                        setFilters((prev) => ({
                          ...prev,
                          domicile: opt as DomicileFilter,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-full border ${isSelected ? "bg-indigo-600 border-indigo-600" : "bg-gray-100 border-gray-200"}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${isSelected ? "text-white" : "text-gray-700"}`}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Divider className="my-3" />

              {/* Sort Section */}
              <Text className="text-sm font-bold text-gray-700 mb-2">
                Urutkan Berdasarkan
              </Text>
              <View className="flex-row gap-2 mb-6">
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
                  className={`flex-1 p-2.5 rounded-xl border flex-row items-center justify-center ${sort.key === "houseId" ? "bg-indigo-600 border-indigo-600" : "bg-gray-50 border-gray-200"}`}
                >
                  <Text
                    className={`font-semibold text-xs ${sort.key === "houseId" ? "text-white" : "text-gray-700"}`}
                  >
                    No. Rumah{" "}
                    {sort.key === "houseId" &&
                      (sort.direction === "asc" ? "↑" : "↓")}
                  </Text>
                </Pressable>

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
                  className={`flex-1 p-2.5 rounded-xl border flex-row items-center justify-center ${sort.key === "entryDate" ? "bg-indigo-600 border-indigo-600" : "bg-gray-50 border-gray-200"}`}
                >
                  <Text
                    className={`font-semibold text-xs ${sort.key === "entryDate" ? "text-white" : "text-gray-700"}`}
                  >
                    Tgl Pendataan{" "}
                    {sort.key === "entryDate" &&
                      (sort.direction === "asc" ? "↑" : "↓")}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="p-4 border-t border-gray-200 bg-gray-50 flex-row gap-2">
              <Button
                mode="outlined"
                textColor="#4B5563"
                style={{ flex: 1, borderColor: "#D1D5DB" }}
                onPress={() => {
                  setFilters({ street: "Semua", status: "Semua", gender: "Semua", domicile: "Semua" });
                  setSort({ key: "entryDate", direction: "asc" });
                }}
              >
                Reset
              </Button>
              <Button
                mode="contained"
                buttonColor="#4F46E5"
                textColor="white"
                style={{ flex: 1 }}
                onPress={() => setIsControlsVisible(false)}
              >
                Terapkan
              </Button>
            </View>
          </Modal>
        </Portal>
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
            paddingBottom: 20, paddingTop: 20
          }}
        />
      )}
    </View>
  );
}
