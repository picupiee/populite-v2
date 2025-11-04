import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant: "primary" | "secondary" | "danger";
  className?: string;
  loadingText?: string;
}

const getVariantStyle = (variant: AppButtonProps["variant"]) => {
  switch (variant) {
    case "danger":
      return {
        button: "bg-red-600 active:bg-red-700",
        text: "text-white",
      };
    case "secondary":
      return {
        button: "bg-gray-200 border border-gray-300 active:bg-gray-300",
        text: "text-gray-700",
      };
    case "primary":
      return {
        button: "bg-indigo-600 active:bg-indigo-700",
        text: "text-white",
      };
  }
};

export default function AppButton({
  title,
  onPress,
  isLoading = false,
  variant = "primary",
  className = "",
  loadingText = "Loading . . .",
}: AppButtonProps) {
  const styles = getVariantStyle(variant);
  const disableStyle = isLoading || variant === "secondary" ? "opacity-60" : "";
  const textColor = styles.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      className={`p-4 rounded-lg shadow-md flex-row justify-center items-center ${styles.button} ${disableStyle} ${className}`}
    >
      {isLoading ? (
        <View className="flex-row items-center">
          <ActivityIndicator
            color={textColor === "text-white" ? "#fff" : "#4F46E5"}
            className="mr-2"
          />
          <Text className={`font-bold text-lg ${textColor}`}>
            {loadingText}
          </Text>
        </View>
      ) : (
        <Text className={`font-bold text-lg ${textColor}`}>{title}</Text>
      )}
    </Pressable>
  );
}
