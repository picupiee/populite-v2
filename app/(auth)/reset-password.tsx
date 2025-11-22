import AppButton from "@/components/ui/AppButton";
import FormInput from "@/components/ui/FormInput";
import { useToastService } from "@/hooks/useToastService";
import { auth } from "@/lib/firebase"; // Direct import of auth instance
import { Link, useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
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

  const keyboardVerticalOffset = Platform.OS === "android" ? 75 : 100;

  return (
    <SafeAreaView className="flex-1 bg-indigo-300">
      <KeyboardAvoidingView
        behavior="height"
        style={{ flex: 1, paddingBottom: 0 }}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        >
          <View className="flex-1 items-center justify-center p-10 md:scale-125">
            <View className="my-10 w-full md:w-1/2">
              <Text className="text-2xl mb-2 text-center">Reset Password</Text>
              <Text className="text-sm mb-4 text-gray-600 text-center">
                Silahkan masukkan alamat email untuk mereset password.
              </Text>
              <FormInput
                label=""
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="Alamat Email"
              />

              <AppButton
                title="Reset Password"
                loadingText="Mohon Tunggu..."
                onPress={handleReset}
                variant="primary"
                className="mb-8"
              />

              <Link href="/(auth)/signIn" className="text-center text-black">
                Kembali ke Form Masuk
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
