import AppButton from "@/components/ui/AppButton";
import { useAccess } from "@/hooks/useAccess";
import { usePopulationMutations } from "@/hooks/useFirestoreMutations"; // New Mutation Hook
import { usePopulationRecordListener } from "@/hooks/usePopulationRecordListener"; // New Read Hook
import { useToastService } from "@/hooks/useToastService";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
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
  const { can, PERMISSIONS } = useAccess();
  const canDelete = can(PERMISSIONS.DELETE_RECORD);
  const canEdit = can(PERMISSIONS.UPDATE_RECORD);
  // --- Stable Read ---
  const { record, loading, error } = usePopulationRecordListener(id || null);
  // --- Stable Mutation ---
  const { deleteRecord } = usePopulationMutations();
  const { showSuccessToast, showErrorToast } = useToastService();

  // 2. Format Dates (safely)
  const formattedDate = record?.entryDate.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedOccupiedDate = record?.dateOccupied ? (
    record.dateOccupied.toLocaleDateString("en-US", {
      year: "numeric",
    })
  ) : (
    <Text className="text-gray-400">Belum Diisi</Text>
  );

  // Edit permit logic
  const navigateToEdit = () => {
    if (canEdit) {
      router.push(`/dashboard/(secure)/data-view/edit/${record.id}`);
    } else {
      showErrorToast("Tidak Diizinkan", "Anda tidak diizinkan mengedit data!");
    }
  };

  // 3. Delete Logic
  const handleDelete = async () => {
    // Made async for proper error handling
    if (!canDelete || !id || !record) {
      showErrorToast(
        "TIDAK DIIZINKAN !",
        "Hubungi admin untuk info lebih lanjut."
      );
    }

    const confirmDelete =
      Platform.OS !== "web"
        ? () =>
            Alert.alert(
              "Konfirmasi",
              `Yakin ingin menghapus data ${record?.houseId}?`,
              [
                { text: "Batal", style: "cancel" },
                { text: "Hapus", style: "destructive", onPress: runDelete },
              ]
            )
        : () => {
            if (
              window.confirm(`Yakin ingin menghapus data ${record?.houseId}?`)
            ) {
              runDelete();
              router.replace("/dashboard/(secure)/data-view");
            }
          };

    const runDelete = async () => {
      try {
        await deleteRecord(id);
        showSuccessToast("Sukses Dihapus!", "Data Berhasil Dihapus");
      } catch (err) {
        showErrorToast(
          "Gagal menghapus",
          "Terjadi kesalahan saat menghapus data"
        );
      }
    };

    confirmDelete();
  };

  // --- Loading/Error UI ---
  if (loading || !id) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600">Memuat Data...</Text>
      </View>
    );
  }

  if (!record) {
    // This state should mostly be caught by the useEffect above
    return (
      <View className="flex-1 items-center justify-center p-10">
        <Text className="text-xl font-bold text-red-500">
          Data Tidak Ditemukan !
        </Text>
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
            <Pressable
              onPress={navigateToEdit}
              disabled={!canEdit}
              className={`mr-3 ${!canEdit ? "opacity-30" : "opacity-100"}`}
            >
              <Ionicons
                name="create-outline"
                size={24}
                color={canEdit ? "#fff" : "#A0A0A0"} // White when active, gray when disabled
              />
            </Pressable>
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
          value={formattedOccupiedDate}
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
        <AppButton
          title={
            <Text className="text-white font-semibold ml-2">
              <Ionicons name="trash-outline" size={20} color="#fff" /> Hapus
              Data
            </Text>
          }
          variant="danger"
          onPress={
            canDelete
              ? handleDelete
              : () => {
                  showErrorToast(
                    "Hapus Data Ditolak",
                    "Anda tidak mempunyai izin untuk menghapus."
                  );
                }
          }
          className={
            `mt-6 flex-row items-center justify-center p-3 rounded-lg active:opacity-80 
                    ${canDelete ? "bg-red-500" : "bg-gray-300"} 
                    ${!canDelete && "opacity-60"}` // Reduce opacity for a "greyed out" effect
          }
          disabled={!canDelete}
        />
      </ScrollView>
    </View>
  );
}
