import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant: "primary" | "secondary" | "danger" | "outline";
  className?: string;
  loadingText?: string;
  disabled?: boolean;
  textClassName?: string;
  icon?: React.ReactNode;
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
    case "outline":
      return {
        button: "bg-white border border-gray-300 active:bg-gray-50",
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
  disabled = false,
  textClassName = "",
  icon,
}: AppButtonProps) {
  const styles = getVariantStyle(variant);
  const isDisabled = isLoading || disabled;
  const disableStyle = isDisabled ? "opacity-60" : "";
  const textColor = styles.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`p-2 rounded-lg shadow-md flex-row justify-center items-center ${styles.button} ${disableStyle} ${className}`}
    >
      {isLoading ? (
        <View className="flex-row items-center">
          <ActivityIndicator
            color={textColor === "text-white" ? "#fff" : "#4F46E5"}
            className="mr-2"
          />
          <Text className={`font-bold text-lg ${textColor} ${textClassName}`}>
            {loadingText}
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`font-bold text-base ${textColor} ${textClassName}`}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
