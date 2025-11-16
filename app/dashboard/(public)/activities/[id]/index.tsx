import AppButton from "@/components/ui/AppButton";
import { useAccess } from "@/hooks/useAccess";
import { useActivityDetail } from "@/hooks/useActivityDetail";
import { useToastService } from "@/hooks/useToastService";
import { db } from "@/lib/firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc } from "firebase/firestore";
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

// Helper component for display consistency
const ActivityDetailCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | React.ReactNode;
  icon: string;
}) => (
  <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
    <View className="flex-row items-center">
      <Ionicons name={icon as any} size={20} color="#4F46E5" />
      <Text className="ml-3 text-base text-gray-500">{title}</Text>
    </View>
    <Text className="text-base font-semibold text-gray-700">{value}</Text>
  </View>
);

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams();
  const activityId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const { activity, loading, error } = useActivityDetail(activityId || "");
  const { can, PERMISSIONS } = useAccess();
  const { showSuccessToast, showErrorToast } = useToastService();

  const canEdit = can(PERMISSIONS.EDIT_ACTIVITY);
  const canDelete = can(PERMISSIONS.DELETE_ACTIVITY);

  // --- Handlers ---

  const navigateToEdit = () => {
    if (canEdit && activityId) {
      // Navigate to the new nested edit route
      router.push(`/dashboard/(public)/activities/${activityId}/edit`);
    }
  };

  const navigateBack = () => {
    router.replace("/dashboard/(public)/activities");
  };

  const handleDelete = () => {
    // ... (Delete logic remains the same as your previous stable version) ...
    const runDelete = async () => {
      if (!activityId) return;
      try {
        await deleteDoc(doc(db, "activities", activityId));
        showSuccessToast("Dihapus", "Kegiatan berhasil dihapus.");
        router.replace("/dashboard/(public)/activities");
      } catch (e) {
        showErrorToast("Gagal", "Gagal menghapus kegiatan.");
      }
    };

    if (Platform.OS !== "web") {
      Alert.alert(
        "Konfirmasi Hapus",
        `Yakin ingin menghapus kegiatan "${activity?.title}"?`,
        [
          { text: "Batal", style: "cancel" },
          { text: "Hapus", style: "destructive", onPress: runDelete },
        ]
      );
    } else if (window.confirm(`Yakin ingin menghapus data kegiatan ini?`)) {
      runDelete();
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !activity) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-xl font-bold text-red-500">Error</Text>
        <Text className="text-center text-gray-600 mt-2">
          {error?.message || "Kegiatan tidak ditemukan."}
        </Text>
        <AppButton
          title="Kembali"
          onPress={() => router.back()}
          variant="secondary"
          className="mt-4"
        />
      </View>
    );
  }

  const formattedDate = activity.activityDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <ScrollView className="flex-1 p-5 bg-white">
      <Stack.Screen
        options={{
          title: activity.title,
          headerRight: () => (
            <Pressable
              onPress={navigateToEdit}
              disabled={!canEdit}
              className={`mr-3 ${!canEdit ? "opacity-30" : "opacity-100"}`}
            >
              <Ionicons name="create-outline" size={24} color="white" />
            </Pressable>
          ),
          headerLeft: () => (
            <Pressable onPress={navigateBack} className="p-2 ml-3">
              <Ionicons name="arrow-back-outline" size={20} color="white" />
            </Pressable>
          ),
        }}
      />

      <Text className="text-3xl font-bold mb-2 text-indigo-700">
        {activity.title}
      </Text>
      <Text className="text-xl font-semibold mb-6 text-red-600">
        {formattedDate}
      </Text>

      <View className="mb-6 border-b border-gray-200 pb-4">
        <Text className="text-sm font-medium text-gray-500 mb-1">
          Deskripsi Singkat
        </Text>
        <Text className="text-lg font-regular text-gray-900 mb-4">
          {activity.shortDescription}
        </Text>

        <Text className="text-sm font-medium text-gray-500 mb-1">
          Deskripsi Lengkap
        </Text>
        <Text className="text-lg font-regular text-gray-900" selectable>
          {activity.longDescription || "Tidak ada deskripsi lengkap."}
        </Text>
      </View>

      <ActivityDetailCard
        title="Tanggal Kegiatan"
        value={formattedDate}
        icon="calendar-outline"
      />

      <View className="mt-8 mb-4 p-4 border rounded-lg bg-gray-50">
        <Text className="text-sm font-medium text-gray-500">Dibuat Oleh:</Text>
        <Text className="text-base text-gray-700 mt-1">
          {activity.createdByUid}
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          Pada:{" "}
          {activity.createdAt.toLocaleDateString("id-ID", {
            dateStyle: "medium",
          })}
        </Text>
      </View>

      {/* Delete Button */}
      {canDelete && (
        <AppButton
          title="Hapus Kegiatan"
          onPress={handleDelete}
          variant="danger"
          className="mt-6"
        />
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}
