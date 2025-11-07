// app/dashboard/home.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Agenda() {
  return (
    <View className="flex-1 items-center justify-center p-5 bg-white">
      <View className="flex-row gap-4 items-center mb-4">
        <Ionicons name="radio-outline" size={40} />
        <Text className="text-lg font-bold">Agenda / Kegiatan</Text>
      </View>
      <Text className="text-2xl font-bold text-indigo-700 mb-4">
        Segera Hadir
      </Text>
      <Text className="text-lg text-gray-600 text-center">
        Halaman Ini Belum Tersedia !
      </Text>
      <Pressable className="mt-4" onPress={() => router.back()}>
        <Text className="text-lg text-blue-600 underline">
          Kembali ke Beranda
        </Text>
      </Pressable>
    </View>
  );
}
