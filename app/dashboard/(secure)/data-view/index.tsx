// app/dashboard/(secure)/data-view/index.tsx
import CompactListItem from "@/components/data/CompactListItem";
import SelectGroup from "@/components/ui/SelectGroup";
import {
  GENDER_OPTIONS,
  PopulationRecord,
  STREET_OPTIONS,
} from "@/constants/data";
import { usePopulationRecordsListener } from "@/hooks/usePopulationRecordsListener";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
  const entryDate = record.entryDate.toLocaleDateString();
  const houseStatusColor =
    record.houseStatus === "Kosong"
      ? "bg-red-100"
      : record.houseStatus === "Sewa"
        ? "bg-yellow-100"
        : "bg-green-100";

  return (
    <Link href={`/dashboard/(secure)/data-view/data/${record.id}`} asChild>
      <Pressable
        className={`p-4 mb-3 rounded-xl border border-gray-200 ${houseStatusColor} active:opacity-75`}
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
            <Ionicons
              name="chevron-forward-outline"
              size={24}
              color="#4F46E5"
            />
            {/* <Text className="text-xs text-gray-500 mt-1">
              Entry: {entryDate}
            </Text> */}
          </View>
        </View>
        <Text className="text-xs text-gray-500 absolute right-2 bottom-2 underline underline-offset-4">
          Didata Pada: {entryDate}
        </Text>
      </Pressable>
    </Link>
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

  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [isControlsVisible, setIsControlsVisible] = useState(false);

  // Use useFocusEffect to reload data whenever the screen becomes focused (e.g., after saving a new record)

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600">Loading data...</Text>
      </View>
    );
  }

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

  return (
    <View className="flex-1 bg-white">
      {/* Configure Stack Header */}
      {/* <Stack.Screen options={{ title: "Population Records" }} /> */}
      {/* Header For Add new Entry, Filter and Sort options */}
      <Text className="italic text-xs font-semibold bg-gray-100 p-2 rounded-md text-center">
        Data yang ditampilkan adalah <strong>data mockup / tidak asli</strong>.
        Mohon untuk tidak menggunakan data asli sebelum proyek ini bersifat
        final dan sudah dalam status "in-production"
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

          {/* Right Side: View Switcher and Filter Toggle Group */}
          <View className="flex-row items-center gap-3">
            {/* View Switcher */}
            <View className="flex-row border border-gray-300 rounded-lg overflow-hidden">
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
              <Pressable
                onPress={() => setViewMode("list")}
                className={`p-2 border-l border-gray-300 ${viewMode === "list" ? "bg-indigo-600" : "bg-white"}`}
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={viewMode === "list" ? "#fff" : "#4F46E5"}
                />
              </Pressable>
            </View>

            {/* Filter/Sort Toggle Button */}
            <Pressable
              onPress={() => setIsControlsVisible(!isControlsVisible)}
              className={`p-2 rounded-lg border flex-row items-center ${isControlsVisible ? "bg-indigo-600 border-indigo-700" : "bg-gray-100 border-gray-300"}`}
            >
              <Ionicons
                name={isControlsVisible ? "close-outline" : "filter-outline"}
                size={20}
                color={isControlsVisible ? "#fff" : "#4F46E5"}
              />
            </Pressable>
          </View>
        </View>

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
      </View>
      {sortedAndFilterRecords.length === 0 && !loading ? (
        <View className="flex-1 items-center justify-center p-10">
          <Ionicons name="search-outline" size={60} color="#9CA3AF" />
          <Text className="text-xl font-semibold text-gray-500 mt-4">
            No Data Matches Filters
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Try adjusting your sorting or filtering criteria.
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
            paddingHorizontal: viewMode === "card" ? 10 : 0,
            paddingBottom: 20,
          }}
          // ... (rest of FlatList props like RefreshControl)
        />
      )}
    </View>
  );
}
