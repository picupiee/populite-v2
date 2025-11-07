import AppButton from "@/components/ui/AppButton";
import FormInput from "@/components/ui/FormInput";
import { useAuth } from "@/context/AuthProvider";
import { useToastService } from "@/hooks/useToastService";
import { Link, router } from "expo-router";
import React, { useRef, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUp() {
  const { signup } = useAuth();
  const { showErrorToast, showSuccessToast } = useToastService();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);

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
      showSuccessToast("Berhasil mendaftar", "Selamat datang di Populite");
      router.push("/dashboard/home");
    } catch (error: any) {
      showErrorToast("Gagal Mendaftar", `${error.message}`);
    } finally {
      setLoading(false);
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
          <Text className="text-2xl mb-5">Daftar</Text>
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
            onSubmitEditting={handleSignUp}
            secureTextEntry={true}
          />
          <AppButton title="Masuk" onPress={handleSignUp} variant="primary" />
        </View>

        {/* Links to other auth pages would go here */}
        <View className="flex-row items-center justify-center mt-4 mb-4 gap-2">
          <Text>Sudah memiliki akun ?</Text>
          <Link
            href="/(auth)/signIn"
            className="text-center text-blue-700 underline"
          >
            Masuk
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
