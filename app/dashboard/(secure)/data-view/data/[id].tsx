import { usePopulationMutations } from "@/hooks/useFirestoreMutations"; // New Mutation Hook
import { usePopulationRecordListener } from "@/hooks/usePopulationRecordListener"; // New Read Hook
import { useToastService } from "@/hooks/useToastService";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

// Helper component (DetailCard) definition goes here (copied from your previous code)
const DetailCard = ({
  title,
  value,
  icon,
  color = "text-gray-700",
}: {
  title: string;
  value: string;
  icon: string;
  color?: string;
}) => (
  <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
    <View className="flex-row items-center">
      <Ionicons name={icon as any} size={20} color="#4F46E5" />
      <Text className="ml-3 text-base text-gray-500">{title}</Text>
    </View>
    <Text className={`text-base font-semibold ${color}`}>{value}</Text>
  </View>
);

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // --- Stable Read ---
  const { record, loading, error } = usePopulationRecordListener(id || null);

  // --- Stable Mutation ---
  const { deleteRecord } = usePopulationMutations();

  const { showSuccessToast, showErrorToast } = useToastService();

  // 1. Handle Not Found Error
  useEffect(() => {
    if (!loading && error && error.message === "Record not found") {
      showErrorToast("Not Found", `Record with ID ${id} not found.`);
      router.back();
    }
  }, [loading, error, id]); // Stable dependencies: only runs on state change

  // 2. Format Dates (safely)
  const formattedDate = record?.entryDate.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedOccupiedDate = record?.dateOccupied
    ? record.dateOccupied.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  // 3. Delete Logic
  const handleDelete = async () => {
    // Made async for proper error handling
    if (!id || !record) return;

    const confirmDelete =
      Platform.OS !== "web"
        ? () =>
            Alert.alert(
              "Confirm Deletion",
              `Are you sure you want to delete ${record.houseId}?`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: runDelete },
              ]
            )
        : () => {
            if (
              window.confirm(
                `Are you sure you want to delete ${record.houseId}?`
              )
            ) {
              runDelete();
            }
          };

    const runDelete = async () => {
      try {
        await deleteRecord(id);
        showSuccessToast("Deleted!", "Record successfully removed.");
        router.replace("/dashboard/(secure)/data-view"); // Go back to the list
      } catch (err) {
        showErrorToast("Delete Failed", "Could not delete the record.");
      }
    };

    confirmDelete();
  };

  // --- Loading/Error UI ---
  if (loading || !id) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600">Loading record...</Text>
      </View>
    );
  }

  if (!record) {
    // This state should mostly be caught by the useEffect above
    return (
      <View className="flex-1 items-center justify-center p-10">
        <Text className="text-xl font-bold text-red-500">Record Not Found</Text>
      </View>
    );
  }

  // --- Render Details ---
  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: `Penghuni Rumah: ${record.houseId}`,
          headerRight: () => (
            <Link
              href={`/dashboard/(secure)/data-view/edit/${record.id}`}
              asChild
            >
              <Pressable className="mr-3">
                <Ionicons name="create-outline" size={24} color="#fff" />
              </Pressable>
            </Link>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* ... (Your detail presentation using 'record' data) ... */}
        <Text className="text-3xl font-bold text-indigo-700 mb-2">
          {record.houseId}
        </Text>
        <Text className="text-lg text-gray-600 border-b pb-4 mb-4">
          Jalan {record.street}
        </Text>

        {/* Example Detail Cards */}
        <DetailCard
          title="Nama Penghuni"
          value={record.name}
          icon="person-outline"
        />
        <DetailCard
          title="Status Hunian"
          value={record.houseStatus}
          icon="home-outline"
        />
        <DetailCard
          title="Mulai Menghuni Sejak"
          value={record.dateOccupied.toLocaleDateString("id-ID", {
            year: "numeric",
          })}
          icon="calendar-outline"
        />
        <Text className="mt-5 pt-2 border-t-2 border-gray-200 text-lg font-semibold text-center">
          Jumlah Penghuni Rumah
        </Text>
        <DetailCard
          title="Dewasa"
          value={record.adultTotal}
          icon="woman-outline"
        />
        <DetailCard
          title="Anak-anak"
          value={record.kidsTotal}
          icon="people-outline"
        />
        <Text className="mt-4 text-xs font-normal text-gray-400">
          Data Masuk:{" "}
          {record.entryDate.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </Text>
        {/* Delete Button */}
        <Pressable
          onPress={handleDelete}
          className="mt-6 flex-row items-center justify-center p-3 bg-red-500 rounded-lg active:opacity-80"
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text className="text-white font-semibold ml-2">Delete Record</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
