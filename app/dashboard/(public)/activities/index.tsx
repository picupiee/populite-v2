// app/dashboard/(public)/activities/index.tsx

import AppButton from "@/components/ui/AppButton";
import { useAccess } from "@/hooks/useAccess";
import {
  ActivityRecord,
  useActivitiesListener,
} from "@/hooks/useActivitiesListener";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

// Helper Component for the Card View
const ActivityCard = ({ activity }: { activity: ActivityRecord }) => {
  const formattedDate = activity.activityDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Determine if the activity is in the past
  const isPast =
    activity.activityDate.getTime() < new Date().getTime() - 86400000; // 1 day buffer
  const statusColor = isPast
    ? "bg-gray-100 border-gray-300"
    : "bg-white border-indigo-400";
  const textColor = isPast ? "text-gray-500" : "text-gray-800";

  return (
    <Link href={`/dashboard/(public)/activities/detail/${activity.id}`} asChild>
      <Pressable
        className={`p-4 mb-3 rounded-xl border-2 ${statusColor}`}
        disabled={isPast}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className={`text-xl font-bold ${textColor}`}>
              {activity.title}
            </Text>
            <Text className="text-sm text-indigo-600 font-medium mt-1">
              {formattedDate}
            </Text>
            <Text className="text-gray-700 mt-2 line-clamp-2">
              {activity.shortDescription}
            </Text>
          </View>

          <View className="ml-4 items-end">
            <Ionicons
              name={isPast ? "archive-outline" : "calendar-outline"}
              size={24}
              color={isPast ? "#9CA3AF" : "#4F46E5"}
            />
            {isPast && (
              <Text className="text-xs text-red-500 mt-1">Selesai</Text>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

export default function ActivitiesListScreen() {
  const { activities, loading, error } = useActivitiesListener();
  const { can, PERMISSIONS } = useAccess();

  const canCreate = can(PERMISSIONS.CREATE_ACTIVITY);

  // Filter to show only upcoming or recent activities (within 1 day)
  const upcomingActivities = activities.filter(
    (a) => a.activityDate.getTime() >= new Date().getTime() - 86400000
  );

  // --- UI Logic ---
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600">Memuat data kegiatan...</Text>
      </View>
    );
  }

  // ... (error handling) ...

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 bg-white border-b border-gray-200 flex-row justify-between items-center">
        {/* 🛡️ Guarded Creation Button (Visible only to Admin/Staff) */}
        {canCreate && (
          <Link href="/dashboard/(public)/activities/create" asChild>
            <AppButton
              title="Buat Kegiatan"
              onPress={() =>
                router.push("/dashboard/(public)/activities/create")
              }
              variant="primary"
              className="w-full px-4"
            />
          </Link>
        )}
      </View>

      {upcomingActivities.length === 0 ? (
        <View className="flex-1 items-center justify-center p-10">
          <Ionicons name="bulb-outline" size={60} color="#9CA3AF" />
          <Text className="text-xl text-center font-semibold text-gray-500 mt-4">
            Belum Ada Kegiatan Terjadwal
          </Text>
          {canCreate && (
            <Text className="text-gray-400 text-center mt-2">
              Tekan 'Buat Kegiatan' untuk menambahkan kegiatan baru.
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={upcomingActivities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ActivityCard activity={item} />}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}
