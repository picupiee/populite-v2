// app/dashboard/(public)/activities/create.tsx - FINAL REFINEMENT

import AppButton from "@/components/ui/AppButton";
import DatePickerInput from "@/components/ui/DatePickerInput";
import FormInput from "@/components/ui/FormInput";
import { useAccess } from "@/hooks/useAccess";
import { auth, db } from "@/lib/firebase";
import { router, Stack } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";

// 🔑 CORRECT IMPORT: Use your toast service hook
import { useToastService } from "@/hooks/useToastService";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function CreateActivityScreen() {
  // 🔑 HOOK CALL: Get the toast functions
  const { showErrorToast, showSuccessToast } = useToastService();
  const { can, PERMISSIONS } = useAccess();
  const [isLoading, setIsLoading] = useState(false);

  // 🔑 Form State
  const [title, setTitle] = useState("");
  const [activityDate, setActivityDate] = useState<Date | undefined>(undefined);
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");

  // 🚩 Error State
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

  // --- Validation and Submission ---

  const validate = () => {
    const newErrors: { [key: string]: string | null } = {};
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = "Judul kegiatan wajib diisi.";
      isValid = false;
    }
    if (!activityDate) {
      newErrors.activityDate = "Tanggal kegiatan wajib diisi.";
      isValid = false;
    }
    if (!shortDescription.trim()) {
      newErrors.shortDescription = "Deskripsi singkat wajib diisi.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    setTitle("");
    setActivityDate(undefined);
    setShortDescription("");
    setLongDescription("");
    setErrors({});
  };

  const handleCreateActivity = async () => {
    if (!validate()) {
      showErrorToast(
        "Gagal Membuat Kegiatan",
        "Mohon periksa kembali input Anda."
      );
      return;
    }

    if (!activityDate) return;

    setIsLoading(true);
    try {
      const newActivity = {
        title,
        shortDescription,
        longDescription,
        activityDate: activityDate.toISOString(),
        createdByUid: auth.currentUser?.uid,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "activities"), newActivity);

      showSuccessToast("Berhasil", `Kegiatan "${title}" berhasil dibuat!`);
      resetForm();
      router.replace("/dashboard/(public)/activities");
    } catch (error) {
      console.error("Error creating activity:", error);
      showErrorToast("Gagal", "Gagal menyimpan kegiatan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

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
          variant="secondary"
          className="mt-4"
        />
      </View>
    );
  }

  const keyboardVerticalOffset = Platform.OS === "android" ? 75 : 100;

  return (
    <KeyboardAvoidingView
      behavior="height"
      style={{ flex: 1, paddingBottom: 0 }}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        <Stack.Screen
          options={{
            title: "Buat Kegiatan",
            headerLeft: () => (
              <Pressable
                onPress={() => router.replace("/dashboard/(public)/activities")}
                className="p-2 ml-3"
              >
                <Ionicons name="arrow-back-outline" size={20} color="white" />
              </Pressable>
            ),
          }}
        />

        {/* Title Input */}
        <FormInput
          label="Judul Kegiatan"
          value={title}
          onChangeText={setTitle}
          placeholder="Kerja Bakti Warga"
          error={errors.title}
          className="mb-4"
        />

        {/* Date Picker Input */}
        <DatePickerInput
          label="Tanggal Kegiatan"
          value={activityDate}
          onChange={setActivityDate}
          error={errors.activityDate}
          className="mb-4"
          minDate={new Date()}
        />

        {/* Short Description Input */}
        <FormInput
          label="Deskripsi Singkat"
          value={shortDescription}
          onChangeText={setShortDescription}
          placeholder="Kegiatan tentang..."
          error={errors.shortDescription}
          multiline
          className="mb-4"
        />

        {/* Long Description Input (Optional Field) */}
        <FormInput
          label="Deskripsi Lengkap"
          value={longDescription}
          onChangeText={setLongDescription}
          placeholder="Tulis secara lengkap tentang kegiatan ini"
          multiline
          className="mb-6"
        />

        {/* AppButton for Submission */}
        <AppButton
          title="Simpan Kegiatan"
          onPress={handleCreateActivity}
          isLoading={isLoading}
          variant="primary"
          className="mt-4"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
