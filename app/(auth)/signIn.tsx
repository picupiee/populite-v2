import { useAuth } from "@/context/AuthProvider";
import { useToastService } from "@/hooks/useToastService";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

export default function SignIn() {
  const { login } = useAuth();
  const { showErrorToast } = useToastService();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        showErrorToast(
          "Email dan Password Tidak Valid",
          "Mohon isi email dan password dengan benar"
        );
        return;
      }
      await login(email, password);
    } catch (error: any) {
      showErrorToast(
        "Gagal Masuk !",
        `Cek email / password anda.\n\n ${error.message}`
      );
    } finally {
      router.push("/dashboard/home");
    }
  };
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Sign In</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        // Add Nativewind styling here (e.g., className="border p-3 mb-4")
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        // Add Nativewind styling here
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />

      <Button title="Login" onPress={handleLogin} />

      {/* Links to other auth pages would go here */}
      <View className="flex-row items-center justify-center mt-4 gap-2">
        <Text>Don't have an account ?</Text>
        <Link href="/(auth)/signUp" className="text-center text-blue-500">
          Sign Up
        </Link>
      </View>
      <Link href="/(auth)/reset-password" className="text-center text-blue-500">
        Forgot Password ?
      </Link>
    </View>
  );
}
