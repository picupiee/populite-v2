// app/_layout.tsx (The necessary AuthGuard is back!)
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
// Ensure these paths are correct based on your setup
import { AuthProvider, useAuth } from "@/context/AuthProvider";
import "@/global.css";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

// 1. The AuthGuard Component: Handles Loading and Redirection
function AuthGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Check if the current route is within the (auth) group
  const inAuthGroup = useMemo(() => {
    return segments[0] === "(auth)";
  }, [segments]);

  useEffect(() => {
    // Stop any redirects until Firebase has loaded the initial user state
    if (loading) return;

    if (user && inAuthGroup) {
      // User is logged in AND is on a sign-in/sign-up screen -> Redirect to the main app
      router.replace("/dashboard/home");
    } else if (!user && !inAuthGroup) {
      // User is NOT logged in AND is trying to access a protected route -> Redirect to sign-in
      // The sign-in route is at /app/(auth)/signIn
      router.replace("/(auth)/signIn");
    }
  }, [user, loading, inAuthGroup]); // IMPORTANT: useEffect watches the 'user' state

  // Optional: Display a loading screen while Firebase initializes
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Securing routes...</Text>
      </View>
    );
  }

  // Render the actual navigation stack once logic is complete
  // The router will determine which screen group to show based on the redirects above
  return (
    <Stack
      screenOptions={{ headerShown: false, keyboardHandlingEnabled: false }}
    />
  );
}

// 2. The Root Layout: Provides Context and Renders the Guard
export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard />
      <Toast />
    </AuthProvider>
  );
}
