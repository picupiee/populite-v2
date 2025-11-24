import AppButton from "@/components/ui/AppButton";
import FormInput from "@/components/ui/FormInput";
import { useToastService } from "@/hooks/useToastService";
import { auth } from "@/lib/firebase"; // Direct import of auth instance
import { getFirebaseErrorMessage } from "@/utils/firebaseErrorParser";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
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
            "Berhasil",
            "Link reset password telah dikirim! Silakan cek email anda.",
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
      const friendlyMessage = getFirebaseErrorMessage(error);
      Alert.alert("Gagal Reset", friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const keyboardVerticalOffset = Platform.OS === "android" ? 75 : 100;

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={["#4F46E5", "#818CF8"]} // Indigo-600 to Indigo-400
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '50%' }}
      />
      
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <Animated.View 
              entering={FadeInDown.delay(100).duration(1000).springify()}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <View className="items-center mb-8">
                <View className="bg-white/20 p-4 rounded-full mb-4 backdrop-blur-lg">
                  <Ionicons name="key" size={40} color="white" />
                </View>
                <Text className="text-4xl font-extrabold text-white tracking-tight">Populite</Text>
                <Text className="text-indigo-100 text-lg mt-1 font-medium">Pemulihan Akun</Text>
              </View>
            </Animated.View>

            {/* Reset Card */}
            <Animated.View 
              entering={FadeInDown.delay(300).duration(1000).springify()}
              style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}
            >
              <View className="bg-white rounded-3xl p-8 shadow-xl shadow-indigo-200 w-full">
                <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">Reset Password</Text>
                <Text className="text-gray-500 mb-8 text-center">
                  Masukkan email anda untuk menerima link reset password
                </Text>

                <FormInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholder="nama@email.com"
                  icon={<Ionicons name="mail-outline" size={20} color="#9CA3AF" />}
                />

                <AppButton
                  title="Kirim Link Reset"
                  loadingText="Mengirim..."
                  onPress={handleReset}
                  variant="primary"
                  isLoading={loading}
                  className="mb-6 mt-2 shadow-indigo-300 shadow-lg"
                />

                <View className="flex-row justify-center items-center">
                  <Link href="/(auth)/signIn" asChild>
                    <TouchableOpacity>
                      <Text className="text-gray-500 font-medium">Kembali ke <Text className="text-indigo-600 font-bold">Halaman Masuk</Text></Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </Animated.View>
            
            <View className="h-10" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
