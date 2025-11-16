// app/dashboard/(public)/activities/[id].tsx

import AppButton from "@/components/ui/AppButton";
import { useAccess } from "@/hooks/useAccess";
import { useActivityDetail } from "@/hooks/useActivityDetail";
import { useToastService } from "@/hooks/useToastService";
import { db } from "@/lib/firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams();
  const activityId = Array.isArray(id) ? id[0] : id;

  const { activity, loading, error } = useActivityDetail(activityId || "");
  const { can, PERMISSIONS } = useAccess();
  const { showSuccessToast, showErrorToast } = useToastService();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    longDescription: "",
    shortDescription: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize edit state when activity data loads
  useEffect(() => {
    if (activity) {
      setEditData({
        title: activity.title,
        longDescription: activity.longDescription,
        shortDescription: activity.shortDescription,
      });
    }
  }, [activity]);

  // Check permissions
  const canEdit = can(PERMISSIONS.EDIT_ACTIVITY);
  const canDelete = can(PERMISSIONS.DELETE_ACTIVITY);

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
      </View>
    );
  }

  // --- Handlers ---

  const handleUpdate = async () => {
    if (!activityId) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, "activities", activityId);
      await updateDoc(docRef, {
        title: editData.title,
        longDescription: editData.longDescription,
        shortDescription: editData.shortDescription,
        updatedAt: new Date().toISOString(),
      });

      setIsEditing(false);
      showSuccessToast("Berhasil", "Detail kegiatan berhasil diperbarui.");
    } catch (e) {
      console.error("Update failed:", e);
      showErrorToast("Gagal", "Gagal memperbarui kegiatan. Coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (Platform.OS !== "web") {
      Alert.alert(
        "Konfirmasi Hapus",
        `Yakin ingin menghapus kegiatan "${activity.title}"?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Hapus",
            style: "destructive",
            onPress: async () => {
              if (!activityId) return;
              try {
                await deleteDoc(doc(db, "activities", activityId));
                showSuccessToast("Dihapus", "Kegiatan berhasil dihapus.");
                router.replace("/dashboard/(public)/activities");
              } catch (e) {
                showErrorToast("Gagal", "Gagal menghapus kegiatan.");
              }
            },
          },
        ]
      );
    } else if (window.confirm(`Yakin ingin menghapus data kegiatan ini?`)) {
      const runDelete = async () => {
        await deleteDoc(doc(db, "activities", activityId));
        router.replace("/dashboard/(public)/activities");
      };
      runDelete();
    }
  };

  // --- Render Logic ---

  const formattedDate = activity.activityDate.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const DetailField = ({ label, value, multiline = false }) => (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-500">{label}</Text>
      {isEditing && canEdit ? (
        <TextInput
          value={value}
          onChangeText={(text) =>
            setEditData((prev) => ({
              ...prev,
              [label === "Judul"
                ? "title"
                : label === "Deskripsi Singkat"
                  ? "shortDescription"
                  : "longDescription"]: text,
            }))
          }
          className="border-b border-indigo-400 text-lg py-1 mt-1 text-gray-900"
          multiline={multiline}
          style={{ minHeight: multiline ? 80 : undefined }}
        />
      ) : (
        <Text className="text-lg font-regular text-gray-900 mt-1">{value}</Text>
      )}
    </View>
  );

  return (
    <ScrollView className="flex-1 p-5 bg-white">
      <Stack.Screen
        options={{
          title: activity.title,
          headerLeft: () => (
            <Pressable
              onPress={() => router.replace("/dashboard/(public)/activities")}
              className="p-2 ml-3"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
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
        <DetailField
          label="Deskripsi Singkat"
          value={
            isEditing ? editData.shortDescription : activity.shortDescription
          }
        />

        <DetailField
          label="Deskripsi Lengkap"
          value={
            isEditing ? editData.longDescription : activity.longDescription
          }
          multiline={true}
        />
      </View>
      <View className="mb-8">
        <Text className="text-sm font-medium text-gray-500">Dibuat Oleh:</Text>
        <Text className="text-sm text-gray-700">{activity.createdByUid}</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Pada: {activity.createdAt.toLocaleDateString("id-ID")}
        </Text>
      </View>
      {/* --- Action Buttons (Guarded) --- */}
      {canEdit && (
        <View className="flex-col space-y-3">
          {isEditing ? (
            <>
              <AppButton
                title="Simpan Perubahan"
                onPress={handleUpdate}
                variant="primary"
                isLoading={isSaving}
              />
              <AppButton
                title="Batal Edit"
                onPress={() => setIsEditing(false)}
                variant="secondary"
              />
            </>
          ) : (
            <AppButton
              title="Edit Kegiatan"
              onPress={() => setIsEditing(true)}
              variant="secondary"
            />
          )}

          {canDelete && (
            <AppButton
              title="Hapus Kegiatan"
              onPress={handleDelete}
              variant="danger"
              className="mt-4"
            />
          )}
        </View>
      )}
      <View style={{ height: 100 }} /> {/* Spacer */}
    </ScrollView>
  );
}
