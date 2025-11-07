import AppButton from "@/components/ui/AppButton";
import FormInput from "@/components/ui/FormInput";
import { useAuth } from "@/context/AuthProvider";
import { useToastService } from "@/hooks/useToastService";
import { Link, router } from "expo-router";
import React, { useRef, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
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
  return (
    <SafeAreaView className="flex-1 bg-indigo-300">
      <View
        className={`min-h-24 items-center justify-center bg-gradient-to-b from-white to-indigo-300 from-30 ${Platform.OS != "web" ? "bg-indigo-200" : ""}`}
      >
        <View className="flex-row items-start mt-20">
          <Text className="text-5xl font-medium">Populite</Text>
          <Text className="text-sm flex items-center justify-center font-medium border-2 rounded-full h-6 w-6">
            v2
          </Text>
        </View>
        <Text className="mt-2">Pendataan Warga Jadi Lebih Mudah</Text>
      </View>
      <View className="flex-col items-center justify-center p-10 md:scale-125">
        <View className="my-8 w-full md:w-1/2">
          <Text className="text-2xl mb-5">Masuk</Text>
          <FormInput
            label=""
            value={email}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Alamat Email"
            onSubmitEditting={() => {
              if (passwordInputRef.current) {
                passwordInputRef.current.focus();
              }
            }}
          />

          <FormInput
            label=""
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            onSubmitEditting={handleLogin}
            secureTextEntry={true}
          />
          <AppButton title="Masuk" onPress={handleLogin} variant="primary" />
        </View>

        {/* Links to other auth pages would go here */}
        <View className="flex-row items-center justify-center mt-4 mb-4 gap-2">
          <Text>Belum Terdaftar ?</Text>
          <Link
            href="/(auth)/signUp"
            className="text-center text-blue-700 underline"
          >
            Daftar
          </Link>
        </View>
        <Link
          href="/(auth)/reset-password"
          className="text-center text-blue-800"
        >
          Lupa Password ?
        </Link>
      </View>
    </SafeAreaView>
  );
}
