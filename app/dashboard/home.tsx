// app/dashboard/home.tsx
import { Text, View } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center p-5 bg-white">
      <Text className="text-3xl font-bold text-indigo-700 mb-4">
        Welcome Back!
      </Text>
      <Text className="text-lg text-gray-600 text-center">
        This is your dashboard overview. Click the menu ☰ to navigate.
      </Text>
    </View>
  );
}
