import { useToastService } from "@/hooks/useToastService";
import { auth } from "@/lib/firebase"; // Direct import of auth instance
import { Link, useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { showErrorToast, showSuccessToast } = useToastService();

  const handleReset = async () => {
    setLoading(true);
    try {
      if (!email) {
        showErrorToast(
          "Email Tidak Valid",
          "Masukkan alamat email dengan benar."
        );
        return;
      }

      await sendPasswordResetEmail(auth, email);

      showSuccessToast("Berhasil Reset Password", "Cek email sekarang", {
        onPress() {
          Alert.alert(
            "Success",
            "Password reset link sent! Check your email.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/(auth)/signIn"),
              },
            ]
          );
        },
        onHide() {
          router.replace("/(auth)/signIn");
        },
      });
    } catch (error: any) {
      Alert.alert("Reset Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text className="text-2xl mb-5">Reset Password</Text>
      <Text className="text-base mb-4 text-gray-600">
        Enter your email to receive a password reset link.
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        className="border p-3 mb-6 rounded"
      />

      <Button
        title={loading ? "Sending..." : "Send Reset Link"}
        onPress={handleReset}
        disabled={loading}
      />

      <Link href="/(auth)/signIn" className="text-center mt-4 text-blue-500">
        Back to Sign In
      </Link>
    </View>
  );
}
