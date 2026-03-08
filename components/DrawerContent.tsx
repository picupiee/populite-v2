// components/DrawerContent.tsx
import { useToastService } from "@/hooks/useToastService";
import { auth } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Updates from "expo-updates";
import { Alert, Linking, Platform, Pressable, Text, View } from "react-native";
import { useAuth } from "../context/AuthProvider"; // Adjust path

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { logout, userProfile } = useAuth();
  const user = auth.currentUser;
  const router = useRouter();
  const { showSuccessToast, showInfoToast, showErrorToast } = useToastService();
  const checkUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          "Update Tersedia",
          "Versi baru aplikasi tersedia. Apakah Anda ingin mengunduhnya sekarang?",
          [
            {
              text: "Batal",
              style: "cancel",
            },
            {
              text: "Download",
              onPress: async () => {
                try {
                  showInfoToast("Mengunduh Update", "Mohon tunggu sebentar...");
                  await Updates.fetchUpdateAsync();
                  Alert.alert(
                    "Update Berhasil",
                    "Mulai ulang untuk menyelesaikan update.",
                    [
                      {
                        text: "Nanti",
                        style: "cancel",
                      },
                      {
                        text: "Mulai Ulang",
                        onPress: () => Updates.reloadAsync(),
                      },
                    ],
                  );
                } catch (error) {
                  console.log("Failed to fetch update: ", error);
                  showErrorToast(
                    "Gagal Mengunduh",
                    "Terjadi kesalahan saat mengunduh update.",
                  );
                }
              },
            },
          ],
        );
      } else {
        showInfoToast(
          "Aplikasi Terbaru",
          "Anda sudah menggunakan versi terbaru.",
        );
      }
    } catch (error) {
      console.log("Failed to check for updates: ", error);
      // Silent fail or show toast if explicitly requested by user action
      showErrorToast(
        "Gagal Cek Update",
        "Tidak dapat memeriksa update saat ini.",
      );
    }
  };

  return (
    <View style={{ flex: 1 }} className="bg-white">
      {/* 1. Styled Header */}
      <LinearGradient
        colors={["#4F46E5", "#818CF8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-16 pb-6 px-6"
      >
        <View className="flex-row items-center">
          <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-lg shadow-indigo-900/20">
            <Text className="text-2xl font-bold text-indigo-600">
              {userProfile?.username!.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-white font-bold text-lg" numberOfLines={1}>
              {userProfile?.username}
            </Text>
            <Text
              className="text-indigo-100 text-xs opacity-90"
              numberOfLines={1}
            >
              {user?.email}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* 2. Scrollable area for default navigation items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 10 }}
      >
        {/* Renders the list of screens defined in _layout.tsx */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* 3. Custom Footer Content (Logout Pressable) */}
      <View className="p-6 border-t border-gray-100 bg-gray-50">
        {Platform.OS !== "web" ? (
          <Pressable
            onPress={checkUpdate}
            className="w-full bg-indigo-500 p-3 mb-2 rounded-xl flex-row items-center justify-center border border-indigo-100 active:bg-indigo-100"
          >
            <Ionicons name="reload-circle-outline" size={20} color="white" />
            <Text className="font-semibold text-white ml-2">Cek Update</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() =>
              Linking.openURL(
                "https://expo.dev/accounts/picupiee/projects/populite/builds/fe417c7d-a281-4028-9f0c-240cb240ee5a",
              )
            }
            className="w-full bg-indigo-500 p-3 mb-2 rounded-xl flex-row items-center justify-center border border-indigo-100 active:bg-indigo-100"
          >
            <Ionicons name="download-outline" size={20} color="white" />
            <Text className="font-semibold text-white ml-2">
              Install Aplikasi
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={async () => {
            await logout();
            // AuthGuard handles the redirect
          }}
          className="w-full bg-red-50 p-3 rounded-xl flex-row items-center justify-center border border-red-100 active:bg-red-100"
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="font-semibold text-red-600 ml-2">
            Keluar Aplikasi
          </Text>
        </Pressable>

        <View className="mt-4 items-center">
          <Text className="text-xs text-gray-400 font-medium">
            Populite v2.0.2
          </Text>
          <Text className="text-[10px] text-gray-300 mt-1">
            Built with 🧠 + 🤖 by PicuPiee
          </Text>
        </View>
      </View>
    </View>
  );
}
