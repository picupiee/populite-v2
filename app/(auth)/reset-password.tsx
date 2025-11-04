import AppButton from "@/components/ui/AppButton";
import { useToastService } from "@/hooks/useToastService";
import { auth } from "@/lib/firebase"; // Direct import of auth instance
import { Link, useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView className="flex-1">
      <View className="flex-1 items-center justify-center p-10 md:scale-125 bg-slate-200">
        <View className="my-10 w-full md:w-1/2">
          <Text className="text-2xl mb-2 text-center">Reset Password</Text>
          <Text className="text-xs mb-4 text-gray-600 text-center">
            Silahkan masukkan alamat email untuk mereset password.
          </Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            className="border-b-2 border-slate-300 outline-none focus:border-slate-500 bg-slate-200 transition-colors ease-out p-3 mb-4"
          />

          <AppButton
            title="Reset Password"
            loadingText="Mohon Tunggu..."
            onPress={handleReset}
            variant="primary"
          />

          <Link
            href="/(auth)/signIn"
            className="text-center mt-4 text-blue-500"
          >
            Back to Sign In
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
