import { router } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text
        className="text-xl font-semibold"
        onPress={() => router.replace("/(auth)/signIn")}
      >
        Login
      </Text>
    </View>
  );
}
