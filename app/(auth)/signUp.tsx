import { useAuth } from "@/context/AuthProvider";
import { useToastService } from "@/hooks/useToastService";
import { Link, router } from "expo-router";
import React, { useRef, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
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
    <SafeAreaView className="flex-1">
      <View className="flex-1 items-center justify-center p-10 md:scale-125 bg-slate-200">
        <View className="my-10 w-full md:w-1/2">
          <Text className="text-2xl mb-5">Sign Up</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => {
              if (passwordInputRef.current) {
                passwordInputRef.current.focus();
              }
            }}
            className="border-b-2 border-slate-300 outline-none focus:border-slate-500 bg-slate-200 transition-colors ease-out p-3 mb-4"
          />

          <TextInput
            ref={passwordInputRef}
            returnKeyType="go"
            onSubmitEditing={handleSignUp}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="border-b-2 border-slate-300 outline-none focus:border-slate-500 bg-slate-200 transition-colors ease-out p-3 mb-4"
          />

          <Button title="Register" onPress={handleSignUp} />
        </View>

        {/* Links to other auth pages would go here */}
        <View className="flex-row items-center justify-center mt-4 mb-4 gap-2">
          <Text>Already Registered ?</Text>
          <Link href="/(auth)/signIn" className="text-center text-blue-500">
            Sign In
          </Link>
        </View>
        <Link
          href="/(auth)/reset-password"
          className="text-center text-blue-500"
        >
          Forgot Password ?
        </Link>
      </View>
    </SafeAreaView>
  );
}
