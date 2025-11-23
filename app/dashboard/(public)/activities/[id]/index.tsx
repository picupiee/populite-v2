import AppButton from "@/components/ui/AppButton";
import { useAccess } from "@/hooks/useAccess";
import { useActivityDetail } from "@/hooks/useActivityDetail";
import { useToastService } from "@/hooks/useToastService";
import { db } from "@/lib/firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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
  <View className="flex-row justify-between items-start py-4 border-b border-gray-100 last:border-0">
    <View className="flex-row items-center mr-4">
      <View className="bg-indigo-50 p-2 rounded-lg">
         <Ionicons name={icon as any} size={18} color="#4F46E5" />
      </View>
      <Text className="ml-3 text-sm font-medium text-gray-500">{title}</Text>
    </View>
    <Text className="text-base font-semibold text-gray-900 flex-1 text-right">{value}</Text>
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

  const [creatorName, setCreatorName] = useState<string>("Memuat...");

  // --- Handlers ---

  const navigateToEdit = () => {
    if (canEdit && activityId) {
      router.push(`/dashboard/(public)/activities/${activityId}/edit`);
    }
  };

  const navigateBack = () => {
    router.replace("/dashboard/(public)/activities");
  };

  const handleDelete = () => {
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

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (activity?.createdByUid) {
        try {
          const userRef = doc(db, "users", activity.createdByUid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Prioritize username, then fullName, then fallback to "Unknown"
            if (userData.username) {
              setCreatorName(`@${userData.username}`);
            } else if (userData.fullName) {
              setCreatorName(userData.fullName);
            } else {
              setCreatorName("Tanpa Nama");
            }
          } else {
            setCreatorName("User Tidak Dikenal");
          }
        } catch (error) {
          console.error("Error fetching creator:", error);
          setCreatorName("Error Memuat");
        }
      }
    };

    if (activity) {
      fetchCreatorName();
    }
  }, [activity]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (error || !activity) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-white">
        <View className="bg-red-50 p-4 rounded-full mb-4">
           <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
        </View>
        <Text className="text-lg font-bold text-gray-900">Terjadi Kesalahan</Text>
        <Text className="text-center text-gray-500 mt-2 mb-6">
          {error?.message || "Kegiatan tidak ditemukan."}
        </Text>
        <AppButton
          title="Kembali"
          onPress={() => router.back()}
          variant="secondary"
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
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: "Detail Kegiatan",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'white' },
          headerTitleStyle: { color: '#1F2937', fontWeight: '600' },
          headerTintColor: '#4F46E5',
          headerLeft: () => (
            <Pressable onPress={navigateBack} className="p-2 rounded-full active:bg-gray-100">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </Pressable>
          ),
          headerRight: () => canEdit ? (
            <View style={{ flexDirection: 'row', marginRight: Platform.OS === 'web' ? 16 : 10 }}>
              <Pressable
                onPress={navigateToEdit}
                className="p-2 bg-indigo-50 rounded-full active:bg-indigo-100"
              >
                <Ionicons name="create-outline" size={20} color="#4F46E5" />
              </Pressable>
            </View>
          ) : null,
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {/* Title Section */}
        <View className="mb-8">
           <Text className="text-2xl font-bold text-gray-900 leading-tight mb-2">
             {activity.title}
           </Text>
           <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text className="text-base font-medium text-gray-500 ml-2">
                {formattedDate}
              </Text>
           </View>
        </View>

        {/* Info Cards */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-8 border border-gray-100">
           <ActivityDetailCard
             title="Tanggal"
             value={formattedDate}
             icon="calendar"
           />
           <ActivityDetailCard
             title="Dibuat Oleh"
             value={creatorName}
             icon="person"
           />
           <ActivityDetailCard
             title="Dibuat Pada"
             value={activity.createdAt.toLocaleDateString("id-ID", { dateStyle: "medium" })}
             icon="time"
           />
        </View>

        {/* Description Section */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">Deskripsi</Text>
          
          <Text className="text-base text-gray-600 leading-relaxed mb-4 font-medium">
            {activity.shortDescription}
          </Text>
          
          <View className="h-px bg-gray-100 my-4" />
          
          <Text className="text-base text-gray-600 leading-relaxed" selectable>
            {activity.longDescription || "Tidak ada deskripsi lengkap."}
          </Text>
        </View>

        {/* Delete Button */}
        {canDelete && (
          <View className="mt-4">
            <AppButton
              title="Hapus Kegiatan"
              onPress={handleDelete}
              variant="danger"
              className="w-full"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
