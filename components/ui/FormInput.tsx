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
  onSubmitEditting?: () => void;
  secureTextEntry?: boolean;
  style?: string;
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
}: FormInputProps) {
  const controlledValue = String(value ?? "")
  // Style for the input field itself
  const inputStyle = `
    border rounded-lg p-3 text-base text-gray-800 items-start
    ${error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
  `;

  return (
    <View className={`mb-4 ${className}`}>
      {/* Label */}
      <Text className={`text-sm font-bold mb-1 text-gray-700 ${labelStyle}`}>
        {label}
      </Text>

      {/* Input Field */}
      <TextInput
        value={controlledValue}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        style={{ minHeight: multiline ? 80 : undefined }} // Set min height for multiline
        className={inputStyle}
        placeholderTextColor={error ? "#EF4444" : "#9CA3AF"}
        secureTextEntry={secureTextEntry}
      />

      {/* Error Message */}
      {error && (
        <Text className="text-xs text-red-600 mt-1 font-medium">{error}</Text>
      )}
    </View>
  );
}
