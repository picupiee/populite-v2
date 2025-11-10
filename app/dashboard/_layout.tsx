import { CustomDrawerContent } from "@/components/DrawerContent";
import { useAuth } from "@/context/AuthProvider";
import { useActivityMonitor } from "@/hooks/useActivityMonitor";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { ActivityIndicator, View } from "react-native";

export default function DashboardLayout() {
  const { user, loading } = useAuth();

  useActivityMonitor();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!user) {
    return <Redirect href="/(auth)/signIn" />;
  }

  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: "#4F46E5" },
        headerTintColor: "#fff",
        drawerActiveTintColor: "#4F46E5",
        drawerStyle: { paddingTop: 25 },
        drawerLabelStyle: { marginLeft: 0 },
        drawerItemStyle: { marginVertical: 3 },
      }}
      drawerContent={CustomDrawerContent}
    >
      <Drawer.Screen
        name="home"
        options={{
          drawerItemStyle: { height: 0, overflow: "hidden" },
        }}
      />
      <Drawer.Screen
        name="summary"
        options={{
          title: "Beranda",
          drawerIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="(secure)/data-entry"
        options={{
          title: "Pendataan Warga Baru",
          drawerIcon: ({ color }) => (
            <Ionicons name="create-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="(secure)/data-view/index"
        options={{
          title: "Data Warga",
          drawerIcon: ({ color }) => (
            <Ionicons name="people-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="finance"
        options={{
          title: "Laporan Kas / Keuangan",
          drawerIcon: ({ color }) => (
            <Ionicons name="cash-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="agenda"
        options={{
          title: "Agenda / Kegiatan",
          drawerIcon: ({ color }) => (
            <Ionicons name="radio-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="setting"
        options={{
          title: "Settings",
          drawerIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="(secure)/data-view/data/[id]"
        options={{
          drawerItemStyle: { height: 0, overflow: "hidden" },
        }}
      />
      <Drawer.Screen
        name="(secure)/data-view/edit/[id]"
        options={{
          drawerItemStyle: { height: 0, overflow: "hidden" },
        }}
      />
    </Drawer>
  );
}
