// app/dashboard/(public)/activities/index.tsx

import { useAccess } from "@/hooks/useAccess";
import {
  ActivityRecord,
  useActivitiesListener,
} from "@/hooks/useActivitiesListener";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// Helper Component for the Card View
const ActivityCard = ({ activity, index }: { activity: ActivityRecord; index: number }) => {
  const formattedDate = activity.activityDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Determine if the activity is in the past
  const isPast =
    activity.activityDate.getTime() < new Date().getTime() - 86400000; // 1 day buffer
  
  const textColor = isPast ? "text-gray-500" : "text-gray-800";

  return (
    <Link href={`/dashboard/(public)/activities/${activity.id}/`} asChild>
      <Pressable disabled={isPast}>
        <Animated.View 
          entering={FadeInDown.delay(index * 100).duration(600).springify()}
          style={{ marginBottom: 12 }}
        >
          <View className={`p-5 rounded-2xl bg-white shadow-sm border ${isPast ? 'border-gray-200 bg-gray-50' : 'border-indigo-100 shadow-indigo-100'}`}>
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-4">
                 <View className={`self-start px-3 py-1 rounded-full mb-3 ${isPast ? 'bg-gray-200' : 'bg-indigo-50'}`}>
                    <Text className={`text-xs font-bold ${isPast ? 'text-gray-500' : 'text-indigo-600'}`}>
                      {isPast ? "Selesai" : "Akan Datang"}
                    </Text>
                 </View>
                
                <Text className={`text-lg font-bold ${textColor} mb-1`}>
                  {activity.title}
                </Text>
                
                <View className="flex-row items-center mb-2">
                   <Ionicons name="calendar-outline" size={14} color={isPast ? "#9CA3AF" : "#4F46E5"} />
                   <Text className={`text-xs ml-1.5 font-medium ${isPast ? 'text-gray-400' : 'text-indigo-500'}`}>
                      {formattedDate}
                   </Text>
                </View>

                <Text className="text-gray-500 text-sm line-clamp-2 leading-5">
                  {activity.shortDescription}
                </Text>
              </View>

              <View className={`p-3 rounded-full ${isPast ? 'bg-gray-100' : 'bg-indigo-50'}`}>
                <Ionicons
                  name={isPast ? "checkmark-done" : "calendar"}
                  size={24}
                  color={isPast ? "#9CA3AF" : "#4F46E5"}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Link>
  );
};

export default function ActivitiesListScreen() {
  const { activities, loading, error } = useActivitiesListener();
  const { can, PERMISSIONS } = useAccess();

  const canCreate = can(PERMISSIONS.CREATE_ACTIVITY);

  // Filter to show only upcoming or recent activities (within 1 day)
  // Sort by date ascending (nearest first)
  const upcomingActivities = activities
    .filter((a) => a.activityDate.getTime() >= new Date().getTime() - 86400000)
    .sort((a, b) => a.activityDate.getTime() - b.activityDate.getTime());

  // --- UI Logic ---
  if (loading && activities.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-500 font-medium">Memuat Agenda...</Text>
      </View>
    );
  }

  // ... (error handling could be improved here similar to finance screen)

  return (
    <View className="flex-1 bg-gray-50">
       {/* Header */}
       <LinearGradient
          colors={["#4F46E5", "#818CF8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pt-12 pb-6 px-6 rounded-b-[32px] shadow-xl shadow-indigo-200 z-10"
        >
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-indigo-100 font-medium text-lg">Agenda Kegiatan</Text>
              <Text className="text-3xl font-extrabold text-white mt-1">
                 Warga
              </Text>
            </View>
            <View className="bg-white/20 p-2.5 rounded-full backdrop-blur-md">
               <Ionicons name="calendar" size={24} color="#fff" />
            </View>
          </View>

          {/* Guarded Creation Button in Header */}
          {canCreate && (
             <Link href="/dashboard/(public)/activities/create" asChild>
                <Pressable className="bg-white/10 border border-white/20 p-3 rounded-xl flex-row items-center justify-center mt-2 active:bg-white/20">
                   <Ionicons name="add-circle-outline" size={20} color="#fff" />
                   <Text className="text-white font-bold ml-2">Buat Kegiatan Baru</Text>
                </Pressable>
             </Link>
          )}
        </LinearGradient>

      {upcomingActivities.length === 0 && !loading ? (
        <View className="flex-1 items-center justify-center p-10 -mt-20">
          <View className="bg-white p-6 rounded-full shadow-sm mb-6">
             <Ionicons name="calendar-clear-outline" size={60} color="#9CA3AF" />
          </View>
          <Text className="text-xl text-center font-bold text-gray-800">
            Tidak Ada Agenda
          </Text>
          <Text className="text-gray-500 text-center mt-2 leading-6">
            Belum ada kegiatan yang dijadwalkan dalam waktu dekat.
          </Text>
        </View>
      ) : (
        <FlatList
          data={upcomingActivities}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <ActivityCard activity={item} index={index} />}
          contentContainerStyle={{ padding: 24, paddingTop: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
             <RefreshControl refreshing={loading} onRefresh={() => {}} tintColor="#4F46E5" />
          }
        />
      )}
    </View>
  );
}
