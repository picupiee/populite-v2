// app/dashboard/home.tsx
import { View, Text } from 'react-native';

export default function Blog() {
  return (
    <View className="flex-1 items-center justify-center p-5 bg-white">
      <Text className="text-3xl font-bold text-indigo-700 mb-4">Welcome Back!</Text>
      <Text className="text-lg text-gray-600 text-center">
        This is your Blog Page. Click the menu ☰ to navigate.
      </Text>
    </View>
  );
}