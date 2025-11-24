import AppButton from "@/components/ui/AppButton";
import FormInput from "@/components/ui/FormInput";
import { useAuth } from "@/context/AuthProvider";
import { useToastService } from "@/hooks/useToastService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import React, { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignIn() {
  const { login } = useAuth();
  const { showErrorToast } = useToastService();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordInputRef = useRef<TextInput>(null);

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
      router.push("/dashboard/home");
    } catch (error: any) {
      showErrorToast("Gagal Masuk !", `${error.message}`);
      console.error(error.message);
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
                  <Ionicons name="people" size={40} color="white" />
                </View>
                <Text className="text-4xl font-extrabold text-white tracking-tight">Populite</Text>
                <Text className="text-indigo-100 text-lg mt-1 font-medium">Sistem Pendataan Warga</Text>
              </View>
            </Animated.View>

            {/* Login Card */}
            <Animated.View 
              entering={FadeInDown.delay(300).duration(1000).springify()}
              style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}
            >
              <View className="bg-white rounded-3xl p-8 shadow-xl shadow-indigo-200 w-full">
                <Text className="text-2xl font-bold text-gray-800 mb-2 text-center">Selamat Datang</Text>
                <Text className="text-gray-500 mb-8 text-center">Silahkan masuk ke akun anda</Text>

                <FormInput
                  label="Email"
                  value={email}
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="nama@email.com"
                  icon={<Ionicons name="mail-outline" size={20} color="#9CA3AF" />}
                  onSubmitEditing={() => {
                    if (passwordInputRef.current) {
                      passwordInputRef.current.focus();
                    }
                  }}
                />

                <FormInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  icon={<Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />}
                  onSubmitEditing={handleLogin}
                  secureTextEntry={true}
                  inputStyle="text-black"
                />

                <View className="items-end mb-6">
                  <Link href="/(auth)/reset-password" asChild>
                    <TouchableOpacity>
                      <Text className="text-indigo-600 font-semibold text-sm">Lupa Password?</Text>
                    </TouchableOpacity>
                  </Link>
                </View>

                <AppButton title="Masuk Sekarang" onPress={handleLogin} variant="primary" className="mb-4 shadow-indigo-300 shadow-lg" />

                <View className="flex-row justify-center items-center mt-4">
                  <Text className="text-gray-500">Belum punya akun? </Text>
                  <Link href="/(auth)/signUp" asChild>
                    <TouchableOpacity>
                      <Text className="text-indigo-600 font-bold">Daftar Disini</Text>
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
