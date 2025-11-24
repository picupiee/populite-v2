import { useAuth } from "@/context/AuthProvider";
import { ActivityLog } from "@/hooks/useActivityLog";
import { db } from "@/lib/firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

export default function ActivityLogListScreen() {
  const { role } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const q = query(
        collection(db, "activity_logs"),
        orderBy("timestamp", "desc"),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      const fetchedLogs: ActivityLog[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      setLogs(fetchedLogs);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (role !== "admin") {
      router.replace("/dashboard/home");
      return;
    }
    fetchLogs();
  }, [role]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderItem = ({ item }: { item: ActivityLog }) => (
    <Pressable
      onPress={() => router.push(`/dashboard/activity-log/${item.id}` as any)}
      className="bg-white p-4 border-b border-gray-100 active:bg-gray-50"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View
          className={`px-2 py-1 rounded text-xs ${getActionColor(item.action)}`}
        >
          <Text className="text-xs font-bold">{item.action}</Text>
        </View>
        <Text className="text-xs text-gray-400">
          {new Date(item.timestamp).toLocaleString("id-ID")}
        </Text>
      </View>
      <Text className="text-sm font-medium text-gray-900 mb-1">
        {item.details}
      </Text>
      <View className="flex-row items-center mt-1">
        <Ionicons name="person-circle-outline" size={16} color="#6B7280" />
        <Text className="text-xs text-gray-500 ml-1">
          {item.performedBy.username || item.performedBy.email}
        </Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: "Activity Log" }} />
      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || item.timestamp}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="p-8 items-center">
            <Text className="text-gray-500">Belum ada aktivitas tercatat.</Text>
          </View>
        }
      />
    </View>
  );
}
