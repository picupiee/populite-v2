import { CustomDrawerContent } from "@/components/DrawerContent";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Drawer } from "expo-router/drawer";

export default function DashboardLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: "#4F46E5" },
        headerTintColor: "#fff",
        headerShadowVisible: false,
        drawerActiveTintColor: "#4F46E5",
        drawerActiveBackgroundColor: "#EEF2FF",
        drawerInactiveTintColor: "#6B7280",
        drawerStyle: { width: "80%" },
        drawerLabelStyle: { marginLeft: -10, fontWeight: "600" },
        drawerItemStyle: {
          marginVertical: 4,
          borderRadius: 12,
          paddingHorizontal: 4,
        },
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
          title: "Keuangan",
          drawerIcon: ({ color }) => (
            <Ionicons name="cash-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="(public)/activities/index"
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
        name="(public)/activities/create"
        options={{
          drawerItemStyle: { height: 0, overflow: "hidden" },
        }}
      />
      <Drawer.Screen
        name="(public)/activities/[id]/index"
        options={{
          drawerItemStyle: { height: 0, overflow: "hidden" },
        }}
      />
      <Drawer.Screen
        name="(public)/activities/[id]/edit"
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
      <Drawer.Screen
        name="(secure)/(finance)/create-income"
        options={{
          drawerItemStyle: { height: 0, overflow: "hidden" },
        }}
      />
      <Drawer.Screen
        name="(secure)/(finance)/create-spending"
        options={{
          drawerItemStyle: { height: 0, overflow: "hidden" },
        }}
      />
      <Drawer.Screen
        name="(admin)/activity-log/index"
        options={{
          drawerItemStyle: { height: 0, overflow: "hidden" },
        }}
      />
      <Drawer.Screen
        name="(admin)/activity-log/[id]"
        options={{
          drawerItemStyle: { height: 0, overflow: "hidden" },
        }}
      />
    </Drawer>
  );
}
