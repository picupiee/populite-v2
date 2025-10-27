import { AuthProvider } from "@/context/AuthProvider";
import "@/global.css";
import { Stack } from "expo-router";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}></Stack>
      <Toast />
    </AuthProvider>
  );
}
