// components/DrawerContent.tsx
import { auth } from "@/lib/firebase";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "../context/AuthProvider"; // Adjust path

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { logout } = useAuth();
  const user = auth.currentUser;

  return (
    <View style={{ flex: 1 }}>
      {/* 1. Scrollable area for default navigation items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        {/* Renders the list of screens defined in _layout.tsx */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* 2. Custom Footer Content (Logout Pressable) */}
      <Text className="text-center text-xs">
        UID: {user?.uid.slice(0, 12)}**********
      </Text>
      <Text className="mb-2 text-center font-medium text-sm">
        {user?.email}
      </Text>
      <View className="p-4 border-t border-gray-200">
        <Pressable
          onPress={async () => {
            await logout();
            // AuthGuard handles the redirect
          }}
          className="w-full bg-red-500 p-2 py-4 rounded-lg"
        >
          <Text className="font-semibold text-center text-white">Logout</Text>
        </Pressable>
        <Text className="text-xs text-gray-500 mt-2 text-center">
          Populite V2 | With 💪 by PicuPiee
        </Text>
      </View>
    </View>
  );
}
