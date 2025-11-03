import { CustomDrawerContent } from "@/components/DrawerContent";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Drawer } from "expo-router/drawer";

export default function DashboardLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: { backgroundColor: "#4F46E5" },
        headerTintColor: "#fff",
        drawerActiveTintColor: "#4F46E5",
        drawerStyle: { paddingTop: 40 },
        drawerLabelStyle: { marginLeft: 5 },
        drawerItemStyle: { marginVertical: 1 },
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
        name="blog"
        options={{
          title: "Blog",
          drawerIcon: ({ color }) => (
            <Ionicons name="list-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: "Profile",
          drawerIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
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
