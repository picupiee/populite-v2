// app/dashboard/(secure)/data-entry.tsx
import { Text, View } from "react-native";

export default function DataEntry() {
  return (
    <View className="flex-1 items-center justify-center p-5 bg-yellow-50">
      <Text className="text-2xl font-bold text-red-500 mb-4">
        Data Entry (Secured)
      </Text>
      <Text className="text-gray-700">
        This page is protected and hidden from the main menu.
      </Text>
      {/* Placeholder for your population data form */}
    </View>
  );
}
