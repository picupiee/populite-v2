import UserManagementSection from "@/components/settings/UserManagementSection";
import AppButton from "@/components/ui/AppButton";
import { useAuth } from "@/context/AuthProvider";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useToastService } from "@/hooks/useToastService";
import { db } from "@/lib/firebase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Settings() {
  const { user, userProfile, refreshProfile, role } = useAuth();
  const { showSuccessToast, showErrorToast } = useToastService();
  const { logActivity } = useActivityLog();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || "");
      setUsername(userProfile.username || "");
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      showErrorToast("Validasi Gagal", "Nama Lengkap tidak boleh kosong.");
      return;
    }
    if (!username.trim()) {
      showErrorToast("Validasi Gagal", "Username tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        fullName: fullName.trim(),
        username: username.trim().replace(/\s+/g, "").toLowerCase(), // Simple username formatting
      });

      await logActivity(
        "UPDATE",
        "USER_PROFILE",
        `Updated profile for user: ${user.email}`,
        user.uid,
        {
          before: {
            fullName: userProfile?.fullName,
            username: userProfile?.username,
          },
          after: {
            fullName: fullName.trim(),
            username: username.trim().replace(/\s+/g, "").toLowerCase(),
          },
        }
      );

      await refreshProfile();
      showSuccessToast("Berhasil", "Profil berhasil diperbarui.");
    } catch (error) {
      console.error("Error updating profile:", error);
      showErrorToast("Gagal", "Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="mb-8 items-center">
          <View className="bg-indigo-100 p-4 rounded-full mb-4">
            <Ionicons name="person" size={40} color="#4F46E5" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">
            {userProfile?.fullName}
          </Text>
          <Text className="text-gray-500 mt-1">{user?.email}</Text>
        </View>

        <View className="space-y-6">
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Nama Lengkap
            </Text>
            <TextInput
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-indigo-500 focus:bg-white"
              placeholder="Contoh: Budi Santoso"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Username
            </Text>
            <View className="flex-row items-center w-full bg-gray-50 border border-gray-200 rounded-xl px-4 focus:border-indigo-500 focus:bg-white">
              <Text className="text-gray-400 mr-1">@</Text>
              <TextInput
                className="flex-1 py-3 text-gray-900"
                placeholder="username"
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase())}
                autoCapitalize="none"
              />
            </View>
            <Text className="text-xs text-gray-400 mt-1 ml-1">
              Username digunakan untuk identifikasi di sistem.
            </Text>
          </View>

          <View className="pt-4">
            <AppButton
              title={isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              onPress={handleSave}
              variant="primary"
              disabled={isSaving}
            />
          </View>

          <AppButton
            title="Kembali ke Dashboard"
            onPress={() => router.back()}
            variant="secondary"
            className="mt-2"
          />

          {role === "admin" && (
            <>
              <UserManagementSection />
              <View className="h-4" />
              <AppButton
                title="Activity Log"
                onPress={() =>
                  router.push("/dashboard/(admin)/activity-log" as any)
                }
                variant="secondary"
                className="mt-2 border-indigo-200 bg-indigo-50"
                textClassName="text-indigo-600"
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
