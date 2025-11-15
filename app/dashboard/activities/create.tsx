import AppButton from "@/components/ui/AppButton"; // Reusable Button
import { useAccess } from "@/hooks/useAccess"; // The Guard Hook
import { useToastService } from "@/hooks/useToastService";
import { auth, db } from "@/lib/firebase";
import { router } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

export default function CreateActivityScreen() {
  const { can, PERMISSIONS } = useAccess();
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const { showSuccessToast, showErrorToast } = useToastService();
  const [longDescription, setLongDescription] = useState("");
  const [date, setDate] = useState(""); // Simple text input for now, use a date picker later
  const [isLoading, setIsLoading] = useState(false);

  // 🛡️ ROLE GUARD: Check permission upfront
  if (!can(PERMISSIONS.CREATE_ACTIVITY)) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-xl font-bold text-red-600">Akses Ditolak</Text>
        <Text className="text-center text-gray-600 mt-2">
          Anda tidak memiliki izin untuk membuat kegiatan baru. (Hanya untuk
          Admin & Staff)
        </Text>
        <AppButton
          title="Kembali"
          onPress={() => router.back()}
          className="mt-4"
          variant="secondary"
        />
      </View>
    );
  }

  // 💾 Submission Handler
  const handleCreateActivity = async () => {
    if (!title || !shortDescription || !date) {
      return showErrorToast(
        "Error",
        "Judul, Deskripsi Singkat, dan Tanggal harus diisi."
      );
    }

    setIsLoading(true);
    try {
      const newActivity = {
        title,
        shortDescription,
        longDescription,
        activityDate: new Date(date).toISOString(), // Convert to ISO for storage
        createdByUid: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "activities"), newActivity);

      showSuccessToast("Berhasil", `Kegiatan "${title}" berhasil dibuat!`);
      router.back();
    } catch (error) {
      console.error("Error creating activity:", error);
      showErrorToast("Gagal", "Gagal menyimpan kegiatan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 p-5 bg-white">
      <Text className="text-2xl font-bold mb-6">Buat Kegiatan Baru</Text>

      <TextInput
        placeholder="Judul Kegiatan (e.g., Kerja Bakti Warga)"
        value={title}
        onChangeText={setTitle}
        className="border p-4 mb-4 rounded-lg text-base border-gray-300"
      />

      <TextInput
        placeholder="Tanggal Kegiatan (e.g., YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        className="border p-4 mb-4 rounded-lg text-base border-gray-300"
      />

      <TextInput
        placeholder="Deskripsi Singkat (Muncul di daftar)"
        value={shortDescription}
        onChangeText={setShortDescription}
        maxLength={100}
        multiline
        className="border p-4 mb-4 rounded-lg text-base border-gray-300 h-20"
      />

      <TextInput
        placeholder="Deskripsi Lengkap Kegiatan"
        value={longDescription}
        onChangeText={setLongDescription}
        multiline
        className="border p-4 mb-6 rounded-lg text-base border-gray-300 h-32"
      />

      <AppButton
        title="Simpan Kegiatan"
        onPress={handleCreateActivity}
        loading={isLoading}
      />
    </ScrollView>
  );
}
