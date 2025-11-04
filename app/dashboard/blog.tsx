// app/dashboard/home.tsx
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Blog() {
  return (
    <View className="flex-1 items-center justify-center p-5 bg-white">
      <Text className="text-3xl font-bold text-indigo-700 mb-4">
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
