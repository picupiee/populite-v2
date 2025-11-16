// app/dashboard/(public)/activities/[id]/edit.tsx - EDIT FORM

import AppButton from "@/components/ui/AppButton";
import DatePickerInput from "@/components/ui/DatePickerInput";
import FormInput from "@/components/ui/FormInput";
import { useActivityDetail } from "@/hooks/useActivityDetail";
import { useToastService } from "@/hooks/useToastService";
import { db } from "@/lib/firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

// Define the partial type for editing (matching your Firestore structure)
type EditActivityData = {
  title: string;
  activityDate: Date | undefined;
  shortDescription: string;
  longDescription: string;
};

export default function EditActivityScreen() {
  const { id } = useLocalSearchParams();
  const activityId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { showSuccessToast, showErrorToast } = useToastService();

  const { activity, loading, error } = useActivityDetail(activityId || "");
  const [formData, setFormData] = useState<Partial<EditActivityData>>({});
  const [saving, setSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Effect 1: Initialize Form Data ---
  useEffect(() => {
    if (activity && !isInitialized) {
      setFormData({
        title: activity.title,
        shortDescription: activity.shortDescription,
        longDescription: activity.longDescription,
        activityDate: activity.activityDate, // Date object from hook
      });
      setIsInitialized(true);
    }
  }, [activity, isInitialized]);

  // --- Input Handler ---
  const handleChange = (key: keyof EditActivityData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // --- Navigation Handler ---
  const navigateBack = () => {
    router.replace(`/dashboard/(public)/activities/${activityId}`);
  };

  // --- Submission Logic ---
  const handleUpdate = async () => {
    if (!activityId || saving || !activity) return;

    setSaving(true);
    Keyboard.dismiss();

    // Basic validation
    if (
      !formData.title ||
      !formData.activityDate ||
      !formData.shortDescription
    ) {
      showErrorToast(
        "Validasi Gagal",
        "Judul, tanggal, dan deskripsi singkat wajib diisi."
      );
      setSaving(false);
      return;
    }

    try {
      const docRef = doc(db, "activities", activityId);

      // Prepare update object: convert Date object back to ISO string for Firestore
      const updatePayload = {
        ...formData,
        activityDate: formData.activityDate.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, updatePayload);

      showSuccessToast(
        "Berhasil",
        `Kegiatan "${formData.title}" berhasil diperbarui!`
      );
      // Navigate back to the stable detail view
      router.replace(`/dashboard/(public)/activities/${activityId}`);
    } catch (e) {
      console.error("Update failed:", e);
      showErrorToast("Gagal", "Gagal menyimpan perubahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  // --- Loading/Error UI ---
  if (loading || !activityId || !isInitialized) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-2 text-gray-600">Memuat data kegiatan...</Text>
      </View>
    );
  }
  if (error || !activity) {
    return null;
  }

  // --- Render Form ---
  return (
    <ScrollView className="flex-1 p-6 bg-white">
      <Stack.Screen
        options={{
          title: `Ubah Kegiatan : ${activity.title}`,
          headerTitleStyle: { fontSize: 16 },
          headerLeft: () => (
            <Pressable onPress={navigateBack} className="p-2 ml-3">
              <Ionicons name="arrow-back-outline" size={20} color="white" />
            </Pressable>
          ),
        }}
      />

      <Text className="text-2xl font-bold mb-6 text-gray-800">
        Ubah Detail Kegiatan
      </Text>

      {/* Input: Title */}
      <FormInput
        label="Judul Kegiatan"
        value={formData.title || ""}
        onChangeText={(val) => handleChange("title", val)}
        placeholder="Kerja Bakti Warga"
      />

      {/* Date Picker Input (Future/Present Range) */}
      <DatePickerInput
        label="Tanggal Kegiatan"
        value={formData.activityDate}
        onChange={(date) => handleChange("activityDate", date)}
        minDate={new Date()} // Enforce today or future date
      />

      {/* Short Description Input */}
      <FormInput
        label="Deskripsi Singkat"
        value={formData.shortDescription || ""}
        onChangeText={(val) => handleChange("shortDescription", val)}
        placeholder="Muncul di daftar kegiatan"
        multiline
      />

      {/* Long Description Input */}
      <FormInput
        label="Deskripsi Lengkap"
        value={formData.longDescription || ""}
        onChangeText={(val) => handleChange("longDescription", val)}
        placeholder="Detail lengkap kegiatan"
        multiline
      />

      {/* Save Button */}
      <AppButton
        onPress={handleUpdate}
        title="Simpan Perubahan"
        loadingText="Menyimpan..."
        variant="primary"
        className="mt-6"
      />
      <AppButton
        onPress={() =>
          router.replace(`/dashboard/(public)/activities/${activityId}`)
        }
        title="Batal"
        variant="danger"
        className="mt-3"
      />
    </ScrollView>
  );
}
