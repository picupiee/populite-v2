// app/dashboard/(secure)/data-view/index.tsx
import { PopulationRecord } from "@/constants/data";
import { usePopulationRecordsListener } from "@/hooks/usePopulationRecordsListener";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

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
              {record.houseId} - {record.street}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Status: {record.houseStatus} | Domicile: {record.domicile}
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
            <Text className="text-xs text-gray-500 mt-1">
              Entry: {entryDate}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

export default function DataViewListScreen() {
  const { records, loading, error } = usePopulationRecordsListener();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  return (
    <View className="flex-1 bg-white">
      {/* Configure Stack Header */}
      {/* <Stack.Screen options={{ title: "Population Records" }} /> */}

      {/* Add a button to navigate to the entry screen */}
      <View className="p-4 border-b border-gray-100">
        <Link href="/dashboard/(secure)/data-entry" asChild>
          <Pressable className="flex-row items-center justify-center p-3 bg-indigo-500 rounded-lg active:opacity-80">
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text className="text-white font-semibold ml-2">
              Add New Record
            </Text>
          </Pressable>
        </Link>
      </View>

      {records.length === 0 ? (
        <View className="flex-1 items-center justify-center p-10">
          <Ionicons name="alert-circle-outline" size={60} color="#9CA3AF" />
          <Text className="text-xl font-semibold text-gray-500 mt-4">
            No Records Found
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Start by adding a new population record using the button above.
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecordItem record={item} />}
          contentContainerStyle={{ padding: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#4F46E5"]}
            />
          }
        />
      )}
    </View>
  );
}
