import { useAuth } from "@/context/AuthProvider";
import { useToastService } from "@/hooks/useToastService";
import { Link, router } from "expo-router";
import React, { useRef, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

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
    <View className="flex-1 items-center justify-center p-20 md:scale-125 bg-slate-200">
      <View className="my-10 w-full md:w-1/2">
        <Text className="text-2xl mb-5">Sign In</Text>
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
          onSubmitEditing={handleLogin}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="border-b-2 border-slate-300 outline-none focus:border-slate-500 bg-slate-200 transition-colors ease-out p-3 mb-4"
        />

        <Button title="Login" onPress={handleLogin} />
      </View>

      {/* Links to other auth pages would go here */}
      <View className="flex-row items-center justify-center mt-4 mb-4 gap-2">
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
