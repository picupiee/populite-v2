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
        drawerLabelStyle: { marginLeft: 5 },
        drawerItemStyle: { marginVertical: 5 },
      }}
      drawerContent={CustomDrawerContent}
    >
      <Drawer.Screen
        name="home"
        options={{
          title: "Home",
          drawerIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="summary"
        options={{
          title: "Summary",
        }}
      />
      <Drawer.Screen
        name="blog"
        options={{
          title: "Blog",
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
      <Drawer.Screen
        name="setting"
        options={{
          title: "Settings",
        }}
      />
      <Drawer.Screen
        name="(secure)/data-entry"
        options={{
          title: "Data Entry (Hidden)",
          drawerItemStyle: { height: 0, overflow: "hidden" },
        }}
      />
    </Drawer>
  );
}
