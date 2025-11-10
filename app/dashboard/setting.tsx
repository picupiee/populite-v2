// app/dashboard/home.tsx
import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function Settings() {
  const user = auth.currentUser;

  return (
    <View className="flex-1 items-center justify-center p-5 bg-white">
      <Text className="text-3xl font-bold text-indigo-700 mb-4">Akun Anda</Text>
      <View>
        <View className="flex-row">
          <Text className="text-lg text-gray-700 text-center">Email: </Text>
          <Text className="text-lg text-gray-700 text-center">
            {user?.email}
          </Text>
        </View>
        <Text className="text-center text-gray-700">
          UID: {user?.uid.slice(0, 10) + "*****************"}
        </Text>
      </View>
      {/* <Text className="mt-2 font-medium text-md">
        Halaman ini belum tersedia.
      </Text> */}
      <Pressable className="mt-2" onPress={() => router.back()}>
        <Text className="text-lg text-blue-600 underline">
          Kembali ke Beranda
        </Text>
      </Pressable>
    </View>
  );
}
