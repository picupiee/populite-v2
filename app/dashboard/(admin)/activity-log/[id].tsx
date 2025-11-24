import AppButton from "@/components/ui/AppButton";
import { ActivityLog } from "@/hooks/useActivityLog";
import { db } from "@/lib/firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function ActivityLogDetailScreen() {
  const { id } = useLocalSearchParams();
  const logId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const [log, setLog] = useState<ActivityLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      if (!logId) return;
      try {
        const docRef = doc(db, "activity_logs", logId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLog({ id: docSnap.id, ...docSnap.data() } as ActivityLog);
        }
      } catch (error) {
        console.error("Error fetching log detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!log) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-gray-500 mb-4">Log tidak ditemukan.</Text>
        <AppButton
          title="Kembali"
          onPress={() => router.back()}
          variant="secondary"
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 24 }}
    >
      <Stack.Screen options={{ title: "Detail Log" }} />

      <View className="mb-6">
        <Text className="text-xs font-bold text-gray-400 uppercase mb-1">
          Activity ID: {log.id}
        </Text>
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          {log.action}
        </Text>
        <Text className="text-base text-gray-600">{log.details}</Text>
      </View>

      <View className="bg-gray-50 p-4 rounded-xl mb-6">
        <View className="flex-row items-center mb-3">
          <Ionicons name="time-outline" size={20} color="#6B7280" />
          <Text className="ml-2 text-gray-700 font-medium">
            {new Date(log.timestamp).toLocaleString("id-ID")}
          </Text>
        </View>
        <View className="flex-row items-center mb-3">
          <Ionicons name="person-outline" size={20} color="#6B7280" />
          <View className="ml-2">
            <Text className="text-gray-900 font-medium">
              {log.performedBy.username}
            </Text>
            <Text className="text-xs text-gray-500">
              {log.performedBy.email}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="cube-outline" size={20} color="#6B7280" />
          <Text className="ml-2 text-gray-700 font-medium">
            Entity: {log.entityType} {log.entityId ? `(${log.entityId})` : ""}
          </Text>
        </View>
      </View>

      {log.metadata && (
        <View>
          <Text className="text-lg font-bold text-gray-900 mb-3">Metadata</Text>
          <View className="bg-gray-900 p-4 rounded-xl">
            <Text className="text-green-400 font-mono text-xs">
              {JSON.stringify(log.metadata, null, 2)}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
