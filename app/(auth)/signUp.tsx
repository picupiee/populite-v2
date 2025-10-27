import { useAuth } from "@/context/AuthProvider";
import { useToastService } from "@/hooks/useToastService";
import { Link } from "expo-router";
import React, { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

export default function SignUp() {
  const { signup } = useAuth();
  const { showErrorToast, showSuccessToast } = useToastService();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      if (!email || !password) {
        showErrorToast(
          "Email / Password Tidak Valid",
          "Mohon isi email / password dengan benar."
        );
        return;
      }
      await signup(email, password);
    } catch (error: any) {
      showErrorToast(
        "Gagal Mendaftar",
        `Silahkan coba lagi nanti.\n\n${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text className="text-2xl mb-5">Create Account</Text>
      {/* Input fields and Button using Nativewind classes (className) */}
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        className="border p-3 mb-4 rounded"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="border p-3 mb-6 rounded"
      />

      <Button
        title={loading ? "Creating..." : "Sign Up"}
        onPress={handleSignUp}
        disabled={loading}
      />

      <View className="flex-row items-center justify-center mt-4 gap-2">
        <Text>Already Registered ?</Text>
        <Link href="/(auth)/signIn" className="text-center text-blue-500">
          Sign In
        </Link>
      </View>
    </View>
  );
}
