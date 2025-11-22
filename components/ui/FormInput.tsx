import React from "react";
import { KeyboardTypeOptions, Text, TextInput, View } from "react-native";

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null; // Nullable error message
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  className?: string; // Tailwind class for the outer View
  labelStyle?: string;
  onSubmitEditing?: () => void;
  secureTextEntry?: boolean;
  style?: string;
  icon?: React.ReactNode; // New icon prop
}

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder = "",
  error = null,
  keyboardType = "default",
  multiline = false,
  className = "",
  labelStyle = "",
  secureTextEntry = false,
  icon,
  onSubmitEditing,
}: FormInputProps) {
  const controlledValue = String(value ?? "")
  
  // Container style for the input + icon
  const containerStyle = `
    flex-row items-center border rounded-xl px-3 bg-white
    ${error ? "border-red-500 bg-red-50" : "border-gray-200"}
    ${multiline ? "items-start py-2" : "h-12"}
  `;

  return (
    <View className={`mb-4 ${className}`}>
      {/* Label */}
      {label ? (
        <Text className={`text-sm font-semibold mb-1.5 text-gray-600 ${labelStyle}`}>
          {label}
        </Text>
      ) : null}

      {/* Input Container */}
      <View className={containerStyle}>
        {icon && <View className="mr-3">{icon}</View>}
        
        <TextInput
          value={controlledValue}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          multiline={multiline}
          style={{ flex: 1, minHeight: multiline ? 80 : undefined }}
          placeholderTextColor={error ? "#EF4444" : "#9CA3AF"}
          secureTextEntry={secureTextEntry}
          onSubmitEditing={onSubmitEditing}
        />
      </View>

      {/* Error Message */}
      {error && (
        <Text className="text-xs text-red-600 mt-1 font-medium ml-1">{error}</Text>
      )}
    </View>
  );
}
